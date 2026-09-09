import express from 'express';
import path from 'path';
import fs from 'fs';
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
  winner?: string;
  lastRoundResult?: {
    qIndex: number;
    answeredBy: string;
    answeredByName: string;
    isCorrect: boolean;
    optionIndex: number;
    correctIndex: number;
    timestamp: number;
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
}

setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (now - room.lastActivity > 2 * 60 * 60 * 1000) {
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
    res.json({ status: 'ok', activeRooms: rooms.size });
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

    room.status = 'in_progress';
    room.currentQIndex = 0;
    room.roundStartTime = Date.now();
    room.lastActivity = Date.now();

    rooms.set(normalizedId, room);
    saveRoomsToDisk();
    return res.json({ success: true, room });
  });

  // Submit answer for a question: when ANYONE picks an answer (whether correct or not),
  // record result, reveal correct answer, and advance to next question for both connected ends!
  app.post('/api/duel/answer', (req, res) => {
    const { roomId, playerId, qIndex, optionIndex, isCorrect, timeSpent, clientTimestamp } = req.body;
    const normalizedId = normalizeRoomCode(roomId || '');
    const room = rooms.get(normalizedId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const target = room.host.id === playerId ? room.host : room.guest?.id === playerId ? room.guest : null;
    const opponent = room.host.id === playerId ? room.guest : room.host;
    if (!target) {
      return res.status(403).json({ error: 'Player not recognized in this room' });
    }

    // If the room has already moved past this question or finished, return current state
    if (room.currentQIndex > qIndex || room.status === 'finished') {
      return res.json({ success: true, room, alreadyAdvanced: true });
    }

    // Check if target or opponent already answered this question
    if (target.answers[qIndex] !== undefined) {
      return res.json({ success: true, room, alreadyAnswered: true });
    }
    if (opponent?.answers[qIndex] !== undefined) {
      return res.json({ success: true, room, alreadyAnsweredByOpponent: true });
    }

    const answerTime = clientTimestamp || Date.now();
    const currentQ = room.questions[qIndex];
    const correctIndex = currentQ ? currentQ.correctIndex : 0;
    const isActuallyCorrect = optionIndex === correctIndex;

    target.answers[qIndex] = {
      option: optionIndex,
      isCorrect: isActuallyCorrect,
      timeSpent: timeSpent || 0,
      timestamp: answerTime
    };

    if (isActuallyCorrect) {
      target.score += 10;
    }

    room.lastRoundResult = {
      qIndex,
      answeredBy: target.id,
      answeredByName: target.name,
      isCorrect: isActuallyCorrect,
      optionIndex,
      correctIndex,
      timestamp: answerTime,
      status: isActuallyCorrect ? 'answered_correct' : 'answered_incorrect'
    };

    // RULE: If anyone picks an answer whether correct or not, proceed to next question at both ends!
    if (qIndex + 1 < room.questions.length) {
      room.currentQIndex = qIndex + 1;
      room.roundStartTime = Date.now();
    } else {
      finishRoomMatch(room);
    }

    room.lastActivity = Date.now();
    rooms.set(normalizedId, room);
    saveRoomsToDisk();
    return res.json({ success: true, room });
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

      return res.json({ success: true, leaderboard: getSortedLeaderboard() });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Force next question if timer ran out on one or both
  app.post('/api/duel/next-round', (req, res) => {
    const { roomId, qIndex } = req.body;
    const normalizedId = normalizeRoomCode(roomId || '');
    let room = rooms.get(normalizedId);
    if (!room) {
      loadRoomsFromDisk();
      room = rooms.get(normalizedId);
    }

    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (qIndex + 1 < room.questions.length) {
      room.currentQIndex = Math.max(room.currentQIndex, qIndex + 1);
      room.roundStartTime = Date.now();
    } else {
      room.status = 'finished';
    }

    room.lastActivity = Date.now();
    rooms.set(normalizedId, room);
    saveRoomsToDisk();
    return res.json({ success: true, room });
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

    room.status = 'ready';
    room.currentQIndex = 0;
    room.winner = undefined;
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
      if (room.host.id === playerId) {
        room.status = 'waiting';
      } else if (room.guest?.id === playerId) {
        room.guest = undefined;
        room.status = 'waiting';
      }
      room.lastActivity = Date.now();
      rooms.set(normalizedId, room);
      saveRoomsToDisk();
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
