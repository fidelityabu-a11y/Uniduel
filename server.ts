import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

export interface DuelPlayer {
  id: string;
  name: string;
  university: string;
  score: number;
  answers: { [qIndex: number]: { option: number; isCorrect: boolean; timeSpent: number; timestamp?: number } };
  isReady: boolean;
  lastSeen: number;
}

export interface DuelRoom {
  id: string;
  status: 'waiting' | 'ready' | 'starting' | 'in_progress' | 'finished';
  createdAt: number;
  lastActivity: number;
  host: DuelPlayer;
  guest?: DuelPlayer;
  questions: any[];
  questionCount: number;
  section: string;
  currentQIndex: number;
  roundStartTime?: number;
  roundEndsAt?: number;
  transitionEndsAt?: number;
  isTransitioning?: boolean;
  winner?: string;
  lastRoundResult?: {
    qIndex: number;
    answeredBy: string;
    answeredByName: string;
    isCorrect: boolean;
    optionIndex: number;
    correctIndex: number;
    timestamp: number;
    pointsEarned?: number;
    status: 'answered_correct' | 'answered_incorrect' | 'timeout' | string;
  };
}

export interface RealLeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  university: string;
  rating: number;
  duelsWon: number;
  totalPoints: number;
  accuracy: number;
  bestSection: string;
  badge: string;
  avatarSeed: string;
  lastActive: number;
  isCurrentUser?: boolean;
}

// Persistent storage file paths
const ROOMS_STORE_PATH = path.join(process.cwd(), '.duel_rooms_store.json');
const LEADERBOARD_STORE_PATH = path.join(process.cwd(), '.duel_leaderboard_store.json');

// Room State with disk persistence
const rooms: Map<string, DuelRoom> = new Map();

// Real Leaderboard: real contestants who have earned points
const realLeaderboard: Map<string, RealLeaderboardEntry> = new Map();

// WebSocket tracking collections
const roomSockets: Map<string, Set<WebSocket>> = new Map();
const leaderboardSubscribers: Set<WebSocket> = new Set();
const socketInfoMap: Map<WebSocket, { roomId?: string; playerId?: string; isLeaderboardSub?: boolean }> = new Map();
const roomTimers: Map<string, NodeJS.Timeout> = new Map();

function clearRoomTimer(roomId: string) {
  const t = roomTimers.get(roomId);
  if (t) {
    clearTimeout(t);
    roomTimers.delete(roomId);
  }
}

function broadcastToRoom(roomId: string, message: any) {
  const normId = normalizeRoomCode(roomId);
  const sockets = roomSockets.get(normId);
  if (!sockets || sockets.size === 0) return;

  const payload = JSON.stringify(message);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch (err) {
        console.warn(`Failed to send to socket in room ${normId}:`, err);
      }
    }
  }
}

let leaderboardDebounceTimer: NodeJS.Timeout | null = null;
function broadcastLeaderboardUpdate(immediate: boolean = false) {
  const doBroadcast = () => {
    leaderboardDebounceTimer = null;
    if (leaderboardSubscribers.size === 0) return;
    const sorted = getSortedLeaderboard();
    const payload = JSON.stringify({
      type: 'LEADERBOARD_UPDATED',
      leaderboard: sorted,
      timestamp: Date.now()
    });

    for (const ws of leaderboardSubscribers) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch {}
      }
    }
  };

  if (immediate) {
    if (leaderboardDebounceTimer) {
      clearTimeout(leaderboardDebounceTimer);
      leaderboardDebounceTimer = null;
    }
    doBroadcast();
  } else if (!leaderboardDebounceTimer) {
    leaderboardDebounceTimer = setTimeout(doBroadcast, 600);
  }
}

function loadRoomsFromDisk() {
  try {
    if (fs.existsSync(ROOMS_STORE_PATH)) {
      const content = fs.readFileSync(ROOMS_STORE_PATH, 'utf-8');
      const data: DuelRoom[] = JSON.parse(content);
      if (Array.isArray(data)) {
        const now = Date.now();
        for (const r of data) {
          // Keep rooms active up to 4 hours
          if (r && r.id && (now - (r.lastActivity || r.createdAt || 0) < 4 * 60 * 60 * 1000)) {
            rooms.set(r.id, r);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load rooms from disk:', err);
  }
}

function saveRoomsToDisk() {
  try {
    const list = Array.from(rooms.values());
    fs.writeFileSync(ROOMS_STORE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save rooms to disk:', err);
  }
}

function loadLeaderboardFromDisk() {
  try {
    if (fs.existsSync(LEADERBOARD_STORE_PATH)) {
      const content = fs.readFileSync(LEADERBOARD_STORE_PATH, 'utf-8');
      const data: RealLeaderboardEntry[] = JSON.parse(content);
      if (Array.isArray(data)) {
        for (const entry of data) {
          if (entry && entry.id) {
            realLeaderboard.set(entry.id, entry);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load leaderboard from disk:', err);
  }
}

function saveLeaderboardToDisk() {
  try {
    const list = Array.from(realLeaderboard.values());
    fs.writeFileSync(LEADERBOARD_STORE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save leaderboard to disk:', err);
  }
}

// Initial hydration from disk
loadRoomsFromDisk();
loadLeaderboardFromDisk();

function getSortedLeaderboard(): RealLeaderboardEntry[] {
  const list = Array.from(realLeaderboard.values());
  // Sort primarily by total points earned, then by rating
  list.sort((a, b) => b.totalPoints - a.totalPoints || b.rating - a.rating);
  return list.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

function updateServerLeaderboardUser(data: {
  playerId: string;
  name: string;
  university: string;
  points: number;
  ratingDelta?: number;
  isDuelWin?: boolean;
  accuracy?: number;
  bestSection?: string;
  avatarSeed?: string;
}) {
  if (!data.playerId || !data.name) return;

  const existing = realLeaderboard.get(data.playerId) || {
    id: data.playerId,
    rank: 0,
    name: data.name.trim(),
    university: data.university.trim() || 'University of Lagos (UNILAG)',
    rating: 1500,
    duelsWon: 0,
    totalPoints: 0,
    accuracy: data.accuracy || 85,
    bestSection: data.bestSection || 'Mixed Duel',
    badge: 'Rising Duelist',
    avatarSeed: data.avatarSeed || data.name,
    lastActive: Date.now()
  };

  existing.name = data.name.trim() || existing.name;
  existing.university = data.university.trim() || existing.university;
  existing.totalPoints += Math.max(0, data.points || 0);

  if (data.isDuelWin) existing.duelsWon += 1;
  if (data.ratingDelta) existing.rating = Math.max(1100, existing.rating + data.ratingDelta);
  if (data.accuracy !== undefined) {
    existing.accuracy = Math.round(((existing.accuracy + data.accuracy) / 2) * 10) / 10;
  }
  if (data.bestSection) existing.bestSection = data.bestSection;

  if (existing.rating >= 2200 || existing.totalPoints >= 200) {
    existing.badge = 'Championship Grandmaster';
  } else if (existing.rating >= 1800 || existing.totalPoints >= 100) {
    existing.badge = 'Varsity Champion';
  } else if (existing.totalPoints >= 40) {
    existing.badge = 'Master Duelist';
  } else {
    existing.badge = 'Rising Duelist';
  }

  existing.lastActive = Date.now();
  realLeaderboard.set(data.playerId, existing);
  saveLeaderboardToDisk();
}

function normalizeRoomCode(code: string): string {
  if (!code) return '';
  let str = String(code).trim();
  try {
    if (str.includes('duelRoom=')) {
      const match = str.match(/duelRoom=([A-Za-z0-9_%-]+)/i);
      if (match && match[1]) {
        str = decodeURIComponent(match[1]);
      }
    } else if (str.includes('http://') || str.includes('https://')) {
      const parsedUrl = new URL(str);
      const roomFromSearch = parsedUrl.searchParams.get('duelRoom');
      if (roomFromSearch) {
        str = roomFromSearch;
      } else if (parsedUrl.hash && parsedUrl.hash.includes('duelRoom=')) {
        const hashMatch = parsedUrl.hash.match(/duelRoom=([A-Za-z0-9_%-]+)/i);
        if (hashMatch && hashMatch[1]) {
          str = decodeURIComponent(hashMatch[1]);
        }
      }
    }
  } catch {}

  // Strip punctuation, quotes, angle brackets, slashes
  str = str.replace(/['"<>\/]/g, '').trim().toUpperCase();

  // If format contains UD prefix with 4-6 digits (e.g. UD-4821, UD 4821, UD4821)
  const udMatch = str.match(/\bUD[\s-_:]*(\d{4,6})\b/i);
  if (udMatch && udMatch[1]) {
    return `UD-${udMatch[1]}`;
  }

  // If format contains 4-6 digits anywhere (e.g. 4821 or Room 4821)
  const digitMatch = str.match(/\b(\d{4,6})\b/);
  if (digitMatch && digitMatch[1]) {
    return `UD-${digitMatch[1]}`;
  }

  // Fallback: strip anything other than letters, digits, and hyphen
  const cleaned = str.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  if (/^\d{4,6}$/.test(cleaned)) {
    return `UD-${cleaned}`;
  }
  if (/^UD\d{4,6}$/.test(cleaned)) {
    return `UD-${cleaned.substring(2)}`;
  }
  return cleaned;
}

function finishRoomMatch(room: DuelRoom) {
  room.status = 'finished';
  clearRoomTimer(room.id);
  const p1Score = room.host.score;
  const p2Score = room.guest ? room.guest.score : 0;
  const hostWon = p1Score > p2Score;
  const guestWon = p2Score > p1Score;

  if (hostWon) room.winner = room.host.id;
  else if (guestWon && room.guest) room.winner = room.guest.id;
  else room.winner = 'tie';

  // Record Host to real leaderboard
  updateServerLeaderboardUser({
    playerId: room.host.id,
    name: room.host.name,
    university: room.host.university,
    points: p1Score,
    isDuelWin: hostWon,
    ratingDelta: hostWon ? 25 : guestWon ? -10 : 5,
    bestSection: room.section
  });

  // Record Guest to real leaderboard
  if (room.guest) {
    updateServerLeaderboardUser({
      playerId: room.guest.id,
      name: room.guest.name,
      university: room.guest.university,
      points: p2Score,
      isDuelWin: guestWon,
      ratingDelta: guestWon ? 25 : hostWon ? -10 : 5,
      bestSection: room.section
    });
  }

  // Push immediate live leaderboard broadcast to all connected clients
  broadcastLeaderboardUpdate(true);
}

const QUESTION_ROUND_DURATION_MS = 15000;
const ROUND_REVEAL_TRANSITION_MS = 1600;

function startRoomMatch(room: DuelRoom): DuelRoom {
  clearRoomTimer(room.id);
  room.status = 'in_progress';
  room.currentQIndex = 0;
  room.isTransitioning = false;
  room.transitionEndsAt = undefined;
  room.winner = undefined;
  room.lastRoundResult = undefined;
  room.host.score = 0;
  room.host.answers = {};
  if (room.guest) {
    room.guest.score = 0;
    room.guest.answers = {};
  }
  room.roundStartTime = Date.now();
  room.roundEndsAt = Date.now() + QUESTION_ROUND_DURATION_MS;
  room.lastActivity = Date.now();

  rooms.set(room.id, room);
  saveRoomsToDisk();

  broadcastToRoom(room.id, { type: 'ROUND_STARTED', room });
  scheduleRoundTimeout(room.id, 0);
  return room;
}

function scheduleRoundTimeout(roomId: string, qIndex: number) {
  clearRoomTimer(roomId);
  const timer = setTimeout(() => {
    handleServerRoundTimeout(roomId, qIndex);
  }, QUESTION_ROUND_DURATION_MS + 250);
  roomTimers.set(roomId, timer);
}

function handleServerRoundTimeout(roomId: string, qIndex: number) {
  const normId = normalizeRoomCode(roomId);
  const room = rooms.get(normId);
  if (!room || room.status !== 'in_progress') return;
  if (room.currentQIndex !== qIndex || room.isTransitioning) return;

  const currentQ = room.questions[qIndex];
  const correctIndex = currentQ ? currentQ.correctIndex : 0;

  room.isTransitioning = true;
  room.transitionEndsAt = Date.now() + ROUND_REVEAL_TRANSITION_MS;
  room.lastRoundResult = {
    qIndex,
    answeredBy: 'timeout',
    answeredByName: 'Clock Expired',
    isCorrect: false,
    optionIndex: -1,
    correctIndex,
    timestamp: Date.now(),
    pointsEarned: 0,
    status: 'timeout'
  };
  room.lastActivity = Date.now();
  rooms.set(normId, room);
  saveRoomsToDisk();

  broadcastToRoom(normId, { type: 'ROUND_REVEAL', room });
  scheduleAdvanceRound(normId, qIndex);
}

function scheduleAdvanceRound(roomId: string, prevQIndex: number) {
  clearRoomTimer(roomId);
  const timer = setTimeout(() => {
    advanceToNextRoundOrFinish(roomId, prevQIndex);
  }, ROUND_REVEAL_TRANSITION_MS);
  roomTimers.set(roomId, timer);
}

function advanceToNextRoundOrFinish(roomId: string, prevQIndex: number): DuelRoom | null {
  clearRoomTimer(roomId);
  const normId = normalizeRoomCode(roomId);
  const room = rooms.get(normId);
  if (!room || room.status !== 'in_progress') return null;

  if (prevQIndex + 1 < room.questions.length) {
    room.currentQIndex = prevQIndex + 1;
    room.isTransitioning = false;
    room.transitionEndsAt = undefined;
    room.roundStartTime = Date.now();
    room.roundEndsAt = Date.now() + QUESTION_ROUND_DURATION_MS;
    room.lastActivity = Date.now();
    rooms.set(normId, room);
    saveRoomsToDisk();

    broadcastToRoom(normId, { type: 'ROUND_STARTED', room });
    scheduleRoundTimeout(normId, room.currentQIndex);
    return room;
  } else {
    finishRoomMatch(room);
    room.isTransitioning = false;
    room.transitionEndsAt = undefined;
    room.lastActivity = Date.now();
    rooms.set(normId, room);
    saveRoomsToDisk();

    broadcastToRoom(normId, { type: 'MATCH_FINISHED', room });
    return room;
  }
}

function handlePlayerAnswerSubmission(params: {
  roomId: string;
  playerId: string;
  qIndex: number;
  optionIndex: number;
  clientTimestamp?: number;
}): { success: boolean; room?: DuelRoom; error?: string; alreadyAnswered?: boolean } {
  const normId = normalizeRoomCode(params.roomId);
  const room = rooms.get(normId);
  if (!room) return { success: false, error: 'Room not found' };

  const target = room.host.id === params.playerId ? room.host : room.guest?.id === params.playerId ? room.guest : null;
  const opponent = room.host.id === params.playerId ? room.guest : room.host;
  if (!target) return { success: false, error: 'Player not recognized in this room' };

  if (room.currentQIndex > params.qIndex || room.status === 'finished') {
    return { success: true, room, alreadyAnswered: true };
  }
  if (room.isTransitioning) {
    return { success: true, room, alreadyAnswered: true };
  }
  if (target.answers[params.qIndex] !== undefined) {
    return { success: true, room, alreadyAnswered: true };
  }
  if (opponent?.answers[params.qIndex] !== undefined) {
    return { success: true, room, alreadyAnswered: true };
  }

  // Clear timeout timer because an answer was submitted
  clearRoomTimer(normId);

  const answerTime = params.clientTimestamp || Date.now();
  const currentQ = room.questions[params.qIndex];
  const correctIndex = currentQ ? currentQ.correctIndex : 0;
  const isActuallyCorrect = params.optionIndex === correctIndex;

  const remainingMs = Math.max(0, (room.roundEndsAt || Date.now()) - Date.now());
  const speedBonus = isActuallyCorrect ? Math.min(5, Math.floor(remainingMs / 2500)) : 0;
  const pointsEarned = isActuallyCorrect ? (10 + speedBonus) : 0;

  target.score += pointsEarned;
  target.answers[params.qIndex] = {
    option: params.optionIndex,
    isCorrect: isActuallyCorrect,
    timeSpent: Math.round((QUESTION_ROUND_DURATION_MS - remainingMs) / 1000),
    timestamp: answerTime
  };

  room.lastRoundResult = {
    qIndex: params.qIndex,
    answeredBy: target.id,
    answeredByName: target.name,
    isCorrect: isActuallyCorrect,
    optionIndex: params.optionIndex,
    correctIndex,
    timestamp: answerTime,
    pointsEarned,
    status: isActuallyCorrect ? 'answered_correct' : 'answered_incorrect'
  };

  room.isTransitioning = true;
  room.transitionEndsAt = Date.now() + ROUND_REVEAL_TRANSITION_MS;
  room.lastActivity = Date.now();
  rooms.set(normId, room);
  saveRoomsToDisk();

  broadcastToRoom(normId, { type: 'ROUND_REVEAL', room });
  scheduleAdvanceRound(normId, params.qIndex);

  return { success: true, room };
}

setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (now - room.lastActivity > 2 * 60 * 60 * 1000) {
      clearRoomTimer(id);
      rooms.delete(id);
    }
  }
}, 10 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      connectedSockets: socketInfoMap.size,
      leaderboardSubscribers: leaderboardSubscribers.size
    });
  });

  // Create or register a duel room
  app.post('/api/duel/create', (req, res) => {
    try {
      const { roomId, host, questions, questionCount, section } = req.body;
      if (!roomId || !host) {
        return res.status(400).json({ error: 'Missing roomId or host details' });
      }

      const normalizedId = normalizeRoomCode(roomId);
      const newRoom: DuelRoom = {
        id: normalizedId,
        status: 'waiting',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        host: {
          id: host.id || 'host_' + Date.now(),
          name: (host.name || '').trim() || 'Contestant 1',
          university: host.university || 'University of Ibadan',
          score: 0,
          answers: {},
          isReady: true,
          lastSeen: Date.now()
        },
        guest: undefined,
        questions: questions || [],
        questionCount: questionCount || 8,
        section: section || 'mixed',
        currentQIndex: 0
      };

      rooms.set(normalizedId, newRoom);
      saveRoomsToDisk();
      broadcastToRoom(normalizedId, { type: 'ROOM_UPDATED', room: newRoom });
      return res.json({ success: true, room: newRoom });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Join an existing duel room
  app.post('/api/duel/join', (req, res) => {
    try {
      const { roomId, guest, createIfMissing, host, questions, questionCount, section } = req.body;
      if (!roomId || !guest) {
        return res.status(400).json({ error: 'Missing roomId or guest details' });
      }

      const normalizedId = normalizeRoomCode(roomId);
      let room = rooms.get(normalizedId);

      // Check disk if not in memory
      if (!room) {
        loadRoomsFromDisk();
        room = rooms.get(normalizedId);
      }

      // If room not found but client provided rehydration details (e.g. from local storage)
      if (!room && createIfMissing && host) {
        room = {
          id: normalizedId,
          status: 'waiting',
          createdAt: Date.now(),
          lastActivity: Date.now(),
          host: {
            id: host.id || 'host_' + Date.now(),
            name: (host.name || '').trim() || 'Contestant 1',
            university: host.university || 'University of Ibadan',
            score: 0,
            answers: {},
            isReady: true,
            lastSeen: Date.now()
          },
          guest: undefined,
          questions: questions || [],
          questionCount: questionCount || 8,
          section: section || 'mixed',
          currentQIndex: 0
        };
        rooms.set(normalizedId, room);
      }

      if (!room) {
        return res.status(404).json({ error: `Room "${normalizedId}" not found. Please verify the code or ask your friend for a new room code.` });
      }

      // If guest ID matches host ID (e.g. testing in the same browser session or same client ID)
      let guestPlayerId = guest.id;
      if (!guestPlayerId || guestPlayerId === room.host.id) {
        guestPlayerId = 'guest_' + Math.random().toString(36).substring(2, 8) + '_' + Date.now().toString(36);
      }

      // If this guest was already in the room (e.g. re-joining / refreshing)
      if (room.guest && (room.guest.id === guest.id || room.guest.id === guestPlayerId)) {
        if (guest.name && guest.name.trim()) room.guest.name = guest.name.trim();
        if (guest.university) room.guest.university = guest.university;
        room.guest.isReady = true;
        room.guest.lastSeen = Date.now();
        room.lastActivity = Date.now();
        rooms.set(normalizedId, room);
        saveRoomsToDisk();
        broadcastToRoom(normalizedId, { type: 'ROOM_UPDATED', room });
        return res.json({ success: true, room, isHost: false, guestId: room.guest.id });
      }

      // If room already has a different guest and match is actively in progress
      if (room.guest && room.status === 'in_progress') {
        return res.status(409).json({ error: 'This duel room already has 2 active contestants in a live match.' });
      }

      // Guest joins
      room.guest = {
        id: guestPlayerId,
        name: (guest.name || '').trim() || 'Challenger',
        university: guest.university || 'University of Lagos (UNILAG)',
        score: 0,
        answers: {},
        isReady: true,
        lastSeen: Date.now()
      };

      // Room now has 2 participants -> state becomes ready
      room.status = 'ready';
      room.lastActivity = Date.now();

      rooms.set(normalizedId, room);
      saveRoomsToDisk();
      broadcastToRoom(normalizedId, { type: 'ROOM_UPDATED', room });
      return res.json({ success: true, room, isHost: false, guestId: room.guest.id });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Update contestant name/university in room
  app.post('/api/duel/update-name', (req, res) => {
    try {
      const { roomId, playerId, name, university } = req.body;
      const normalizedId = normalizeRoomCode(roomId || '');
      const room = rooms.get(normalizedId);
      if (!room) return res.status(404).json({ error: 'Room not found' });

      if (room.host.id === playerId) {
        if (name && name.trim()) room.host.name = name.trim();
        if (university) room.host.university = university.trim();
      } else if (room.guest?.id === playerId) {
        if (name && name.trim()) room.guest.name = name.trim();
        if (university) room.guest.university = university.trim();
      } else {
        return res.status(403).json({ error: 'Player not recognized in this room' });
      }

      room.lastActivity = Date.now();
      rooms.set(normalizedId, room);
      saveRoomsToDisk();
      broadcastToRoom(normalizedId, { type: 'ROOM_UPDATED', room });
      return res.json({ success: true, room });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Get current room status
  app.get('/api/duel/room/:id', (req, res) => {
    const normalizedId = normalizeRoomCode(req.params.id);
    let room = rooms.get(normalizedId);
    if (!room) {
      loadRoomsFromDisk();
      room = rooms.get(normalizedId);
    }
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const playerId = req.query.playerId as string | undefined;
    if (playerId) {
      if (room.host.id === playerId) room.host.lastSeen = Date.now();
      if (room.guest?.id === playerId) room.guest.lastSeen = Date.now();
    }
    room.lastActivity = Date.now();

    return res.json({ success: true, room });
  });

  // Host triggers duel launch
  app.post('/api/duel/start', (req, res) => {
    const { roomId, playerId } = req.body;
    const normalizedId = normalizeRoomCode(roomId || '');
    let room = rooms.get(normalizedId);
    if (!room) {
      loadRoomsFromDisk();
      room = rooms.get(normalizedId);
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const updated = startRoomMatch(room);
    return res.json({ success: true, room: updated });
  });

  // Submit answer for a question: processed through authoritative state machine
  app.post('/api/duel/answer', (req, res) => {
    const { roomId, playerId, qIndex, optionIndex, clientTimestamp } = req.body;
    const result = handlePlayerAnswerSubmission({
      roomId,
      playerId,
      qIndex,
      optionIndex,
      clientTimestamp
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to submit answer' });
    }

    return res.json({ success: true, room: result.room, alreadyAnswered: result.alreadyAnswered });
  });

  // GET Real Leaderboard (sorted descending by points and rating)
  app.get('/api/leaderboard', (req, res) => {
    return res.json({ success: true, leaderboard: getSortedLeaderboard() });
  });

  // POST Submit Score / Activity to Real Leaderboard
  app.post('/api/leaderboard/submit', (req, res) => {
    try {
      const { playerId, name, university, points, ratingDelta, isDuelWin, accuracy, bestSection, avatarSeed } = req.body;
      if (!playerId || !name) {
        return res.status(400).json({ error: 'Missing playerId or name' });
      }

      updateServerLeaderboardUser({
        playerId,
        name,
        university: university || 'University of Lagos (UNILAG)',
        points: Number(points) || 0,
        ratingDelta: Number(ratingDelta) || 0,
        isDuelWin: Boolean(isDuelWin),
        accuracy: accuracy !== undefined ? Number(accuracy) : undefined,
        bestSection,
        avatarSeed
      });

      broadcastLeaderboardUpdate(true);
      return res.json({ success: true, leaderboard: getSortedLeaderboard() });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Force next question if timer ran out on one or both
  app.post('/api/duel/next-round', (req, res) => {
    const { roomId, qIndex } = req.body;
    const normalizedId = normalizeRoomCode(roomId || '');
    const updated = advanceToNextRoundOrFinish(normalizedId, qIndex);
    if (!updated) {
      return res.status(404).json({ error: 'Room not found or not in progress' });
    }
    return res.json({ success: true, room: updated });
  });

  // Request Rematch with fresh questions
  app.post('/api/duel/rematch', (req, res) => {
    const { roomId, newQuestions } = req.body;
    const normalizedId = normalizeRoomCode(roomId || '');
    let room = rooms.get(normalizedId);
    if (!room) {
      loadRoomsFromDisk();
      room = rooms.get(normalizedId);
    }

    if (!room) return res.status(404).json({ error: 'Room not found' });

    clearRoomTimer(normalizedId);
    room.status = 'ready';
    room.currentQIndex = 0;
    room.isTransitioning = false;
    room.transitionEndsAt = undefined;
    room.winner = undefined;
    room.lastRoundResult = undefined;
    room.host.score = 0;
    room.host.answers = {};
    if (room.guest) {
      room.guest.score = 0;
      room.guest.answers = {};
    }
    if (newQuestions && newQuestions.length > 0) {
      room.questions = newQuestions;
    }

    room.lastActivity = Date.now();
    rooms.set(normalizedId, room);
    saveRoomsToDisk();
    broadcastToRoom(normalizedId, { type: 'ROOM_UPDATED', room });
    return res.json({ success: true, room });
  });

  // Leave room
  app.post('/api/duel/leave', (req, res) => {
    const { roomId, playerId } = req.body;
    const normalizedId = normalizeRoomCode(roomId || '');
    let room = rooms.get(normalizedId);
    if (!room) {
      loadRoomsFromDisk();
      room = rooms.get(normalizedId);
    }

    if (room) {
      clearRoomTimer(normalizedId);
      if (room.host.id === playerId) {
        room.status = 'waiting';
      } else if (room.guest?.id === playerId) {
        room.guest = undefined;
        room.status = 'waiting';
      }
      room.lastActivity = Date.now();
      rooms.set(normalizedId, room);
      saveRoomsToDisk();
      broadcastToRoom(normalizedId, { type: 'ROOM_UPDATED', room });
    }

    return res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create unified HTTP + WebSocket Server
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    socketInfoMap.set(ws, {});

    ws.on('message', (rawData) => {
      try {
        const data = JSON.parse(rawData.toString());
        const info = socketInfoMap.get(ws) || {};

        switch (data.type) {
          case 'SYNC_TIME': {
            ws.send(JSON.stringify({
              type: 'SYNC_TIME_RES',
              clientTime: data.clientTime,
              serverTime: Date.now()
            }));
            break;
          }

          case 'SUBSCRIBE_LEADERBOARD': {
            info.isLeaderboardSub = true;
            socketInfoMap.set(ws, info);
            leaderboardSubscribers.add(ws);
            ws.send(JSON.stringify({
              type: 'LEADERBOARD_UPDATED',
              leaderboard: getSortedLeaderboard(),
              timestamp: Date.now()
            }));
            break;
          }

          case 'UNSUBSCRIBE_LEADERBOARD': {
            info.isLeaderboardSub = false;
            socketInfoMap.set(ws, info);
            leaderboardSubscribers.delete(ws);
            break;
          }

          case 'JOIN_ROOM': {
            const normId = normalizeRoomCode(data.roomId || '');
            if (!normId) return;
            info.roomId = normId;
            info.playerId = data.playerId;
            socketInfoMap.set(ws, info);

            let set = roomSockets.get(normId);
            if (!set) {
              set = new Set();
              roomSockets.set(normId, set);
            }
            set.add(ws);

            let room = rooms.get(normId);
            if (!room) {
              loadRoomsFromDisk();
              room = rooms.get(normId);
            }

            if (room) {
              if (data.playerId) {
                if (room.host.id === data.playerId) {
                  room.host.lastSeen = Date.now();
                  if (data.name) room.host.name = data.name;
                  if (data.university) room.host.university = data.university;
                } else if (room.guest?.id === data.playerId) {
                  room.guest.lastSeen = Date.now();
                  if (data.name) room.guest.name = data.name;
                  if (data.university) room.guest.university = data.university;
                }
                rooms.set(normId, room);
                saveRoomsToDisk();
              }

              ws.send(JSON.stringify({
                type: 'ROOM_STATE',
                room,
                serverTime: Date.now()
              }));

              broadcastToRoom(normId, {
                type: 'PLAYER_PRESENCE',
                playerId: data.playerId,
                status: 'online',
                room
              });
            }
            break;
          }

          case 'START_MATCH': {
            const normId = normalizeRoomCode(data.roomId || '');
            const room = rooms.get(normId);
            if (room) {
              startRoomMatch(room);
            }
            break;
          }

          case 'SUBMIT_ANSWER': {
            handlePlayerAnswerSubmission({
              roomId: data.roomId,
              playerId: data.playerId,
              qIndex: data.qIndex,
              optionIndex: data.optionIndex,
              clientTimestamp: data.clientTimestamp
            });
            break;
          }

          case 'REMATCH': {
            const normId = normalizeRoomCode(data.roomId || '');
            const room = rooms.get(normId);
            if (room) {
              clearRoomTimer(normId);
              room.status = 'ready';
              room.currentQIndex = 0;
              room.isTransitioning = false;
              room.transitionEndsAt = undefined;
              room.winner = undefined;
              room.lastRoundResult = undefined;
              room.host.score = 0;
              room.host.answers = {};
              if (room.guest) {
                room.guest.score = 0;
                room.guest.answers = {};
              }
              if (data.newQuestions && data.newQuestions.length > 0) {
                room.questions = data.newQuestions;
              }
              room.lastActivity = Date.now();
              rooms.set(normId, room);
              saveRoomsToDisk();
              broadcastToRoom(normId, { type: 'ROOM_UPDATED', room });
            }
            break;
          }

          case 'LEAVE_ROOM': {
            const normId = normalizeRoomCode(data.roomId || '');
            const room = rooms.get(normId);
            if (room) {
              clearRoomTimer(normId);
              if (room.host.id === data.playerId) {
                room.status = 'waiting';
              } else if (room.guest?.id === data.playerId) {
                room.guest = undefined;
                room.status = 'waiting';
              }
              room.lastActivity = Date.now();
              rooms.set(normId, room);
              saveRoomsToDisk();
              broadcastToRoom(normId, { type: 'ROOM_UPDATED', room });
            }
            break;
          }
        }
      } catch (err) {
        console.warn('WS parse error:', err);
      }
    });

    ws.on('close', () => {
      const info = socketInfoMap.get(ws);
      if (info) {
        if (info.isLeaderboardSub) {
          leaderboardSubscribers.delete(ws);
        }
        if (info.roomId) {
          const set = roomSockets.get(info.roomId);
          if (set) {
            set.delete(ws);
            if (set.size === 0) roomSockets.delete(info.roomId);
          }
          if (info.playerId) {
            const room = rooms.get(info.roomId);
            if (room) {
              if (room.host.id === info.playerId) room.host.lastSeen = Date.now();
              if (room.guest?.id === info.playerId) room.guest.lastSeen = Date.now();
              broadcastToRoom(info.roomId, {
                type: 'PLAYER_PRESENCE',
                playerId: info.playerId,
                status: 'offline',
                room
              });
            }
          }
        }
      }
      socketInfoMap.delete(ws);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running with WebSockets on http://0.0.0.0:${PORT}`);
  });
}

startServer();
