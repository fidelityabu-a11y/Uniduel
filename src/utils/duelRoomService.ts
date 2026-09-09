import { Question } from '../types';

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
  questions: Question[];
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
    correctIndex?: number;
    timestamp: number;
    status: 'answered_correct' | 'answered_incorrect' | 'timeout' | string;
  };
}

const BROADCAST_CHANNEL_NAME = 'uduel_online_rooms_v2';
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // Graceful fallback if iframe sandbox restricts BroadcastChannel
}

// Normalize duel room codes from text or URL (e.g., 'UD-1234', '1234', 'ud1234', full URL)
export function normalizeRoomCode(code: string): string {
  if (!code) return '';
  let cleaned = String(code).trim();
  try {
    if (cleaned.includes('duelRoom=')) {
      const match = cleaned.match(/duelRoom=([A-Za-z0-9_-]+)/);
      if (match && match[1]) {
        cleaned = match[1];
      }
    }
  } catch {}
  cleaned = cleaned.toUpperCase().replace(/\s+/g, '');
  if (/^\d{4}$/.test(cleaned)) {
    cleaned = 'UD-' + cleaned;
  }
  if (/^UD\d{4}$/.test(cleaned)) {
    cleaned = 'UD-' + cleaned.substring(2);
  }
  return cleaned;
}

// Generate persistent unique client ID (per tab session so multi-tab testing works flawlessly)
export function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return 'p_' + Date.now();
  const KEY = 'uduel_contestant_client_id';
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'p_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
  }
}

function broadcastRoomChange(room: DuelRoom) {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'ROOM_UPDATE', room });
    }
    // Also save in localStorage for cross-tab storage event
    localStorage.setItem(`uduel_room_${room.id}`, JSON.stringify(room));
  } catch (err) {
    console.warn('Broadcast error:', err);
  }
}

export async function createDuelRoom(params: {
  roomId: string;
  host: { id: string; name: string; university: string };
  questions: Question[];
  questionCount: number;
  section: string;
}): Promise<DuelRoom> {
  const normalizedId = normalizeRoomCode(params.roomId);

  try {
    const res = await fetch('/api/duel/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, roomId: normalizedId })
    });

    if (res.ok) {
      const data = await res.json();
      broadcastRoomChange(data.room);
      return data.room;
    }
  } catch (err) {
    console.warn('API error, falling back to local sync:', err);
  }

  // Local sync fallback
  const fallbackRoom: DuelRoom = {
    id: normalizedId,
    status: 'waiting',
    createdAt: Date.now(),
    lastActivity: Date.now(),
    host: {
      id: params.host.id,
      name: params.host.name,
      university: params.host.university,
      score: 0,
      answers: {},
      isReady: true,
      lastSeen: Date.now()
    },
    guest: undefined,
    questions: params.questions,
    questionCount: params.questionCount,
    section: params.section,
    currentQIndex: 0
  };

  broadcastRoomChange(fallbackRoom);
  return fallbackRoom;
}

export async function joinDuelRoom(params: {
  roomId: string;
  guest: { id: string; name: string; university: string };
}): Promise<{ success: boolean; room?: DuelRoom; error?: string; guestId?: string; isHost?: boolean }> {
  const normalizedId = normalizeRoomCode(params.roomId);

  try {
    const res = await fetch('/api/duel/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: normalizedId, guest: params.guest })
    });

    if (res.ok) {
      const data = await res.json();
      broadcastRoomChange(data.room);
      return { success: true, room: data.room, guestId: data.guestId, isHost: data.isHost };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Failed to join room' };
    }
  } catch (err) {
    console.warn('API join error, trying localStorage fallback:', err);
  }

  // Local storage fallback for same-browser testing
  const raw = localStorage.getItem(`uduel_room_${normalizedId}`);
  if (raw) {
    try {
      const room: DuelRoom = JSON.parse(raw);
      let guestId = params.guest.id;
      if (room.host.id === guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 8) + '_' + Date.now().toString(36);
      }
      room.guest = {
        id: guestId,
        name: params.guest.name || 'Challenger',
        university: params.guest.university || 'University of Lagos (UNILAG)',
        score: 0,
        answers: {},
        isReady: true,
        lastSeen: Date.now()
      };
      room.status = 'ready';
      room.lastActivity = Date.now();
      broadcastRoomChange(room);
      return { success: true, room, guestId };
    } catch {
      // parse error
    }
  }

  return { success: false, error: `Could not find room with code "${normalizedId}". Check the code and try again.` };
}

export async function updateDuelPlayerName(params: {
  roomId: string;
  playerId: string;
  name: string;
  university?: string;
}): Promise<DuelRoom | null> {
  const normalizedId = normalizeRoomCode(params.roomId);
  try {
    const res = await fetch('/api/duel/update-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, roomId: normalizedId })
    });
    if (res.ok) {
      const data = await res.json();
      broadcastRoomChange(data.room);
      return data.room;
    }
  } catch (err) {
    console.warn('API update name error:', err);
  }

  const raw = localStorage.getItem(`uduel_room_${normalizedId}`);
  if (raw) {
    try {
      const room: DuelRoom = JSON.parse(raw);
      if (room.host.id === params.playerId) {
        if (params.name) room.host.name = params.name.trim();
        if (params.university) room.host.university = params.university.trim();
      } else if (room.guest?.id === params.playerId) {
        if (params.name) room.guest.name = params.name.trim();
        if (params.university) room.guest.university = params.university.trim();
      }
      broadcastRoomChange(room);
      return room;
    } catch {}
  }
  return null;
}

export async function fetchDuelRoom(roomId: string, playerId?: string): Promise<DuelRoom | null> {
  const normalizedId = normalizeRoomCode(roomId);

  try {
    const url = `/api/duel/room/${normalizedId}${playerId ? `?playerId=${playerId}` : ''}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data.room;
    }
  } catch {
    // try fallback
  }

  const raw = localStorage.getItem(`uduel_room_${normalizedId}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

export const getDuelRoom = fetchDuelRoom;

export async function startDuelMatch(roomId: string, playerId: string): Promise<DuelRoom | null> {
  const normalizedId = normalizeRoomCode(roomId);

  try {
    const res = await fetch('/api/duel/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: normalizedId, playerId })
    });
    if (res.ok) {
      const data = await res.json();
      broadcastRoomChange(data.room);
      return data.room;
    }
  } catch {
    // fallback
  }

  const raw = localStorage.getItem(`uduel_room_${normalizedId}`);
  if (raw) {
    const room: DuelRoom = JSON.parse(raw);
    room.status = 'in_progress';
    room.currentQIndex = 0;
    room.roundStartTime = Date.now();
    broadcastRoomChange(room);
    return room;
  }
  return null;
}

export async function submitDuelAnswer(params: {
  roomId: string;
  playerId: string;
  qIndex: number;
  optionIndex: number;
  isCorrect: boolean;
  timeSpent: number;
  clientTimestamp?: number;
}): Promise<DuelRoom | null> {
  const normalizedId = normalizeRoomCode(params.roomId);

  try {
    const res = await fetch('/api/duel/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, roomId: normalizedId })
    });
    if (res.ok) {
      const data = await res.json();
      broadcastRoomChange(data.room);
      return data.room;
    }
  } catch {
    // fallback
  }

  const raw = localStorage.getItem(`uduel_room_${normalizedId}`);
  if (raw) {
    const room: DuelRoom = JSON.parse(raw);
    const target = room.host.id === params.playerId ? room.host : room.guest?.id === params.playerId ? room.guest : null;
    const opponent = room.host.id === params.playerId ? room.guest : room.host;
    if (target) {
      if (room.currentQIndex > params.qIndex || room.status === 'finished') {
        return room;
      }
      if (target.answers[params.qIndex] !== undefined) {
        return room;
      }

      const oppAns = opponent?.answers[params.qIndex];
      if (oppAns && oppAns.isCorrect) {
        return room;
      }

      const answerTime = params.clientTimestamp || Date.now();
      target.answers[params.qIndex] = {
        option: params.optionIndex,
        isCorrect: params.isCorrect,
        timeSpent: params.timeSpent,
        timestamp: answerTime
      };

      const currentQ = room.questions[params.qIndex];
      const correctIndex = currentQ ? currentQ.correctIndex : 0;
      const isActuallyCorrect = params.optionIndex === correctIndex;

      target.answers[params.qIndex] = {
        option: params.optionIndex,
        isCorrect: isActuallyCorrect,
        timeSpent: params.timeSpent,
        timestamp: answerTime
      };

      if (isActuallyCorrect) {
        target.score += 10;
      }

      room.lastRoundResult = {
        qIndex: params.qIndex,
        answeredBy: target.id,
        answeredByName: target.name,
        isCorrect: isActuallyCorrect,
        optionIndex: params.optionIndex,
        correctIndex,
        timestamp: answerTime,
        status: isActuallyCorrect ? 'answered_correct' : 'answered_incorrect'
      };

      if (params.qIndex + 1 < room.questions.length) {
        room.currentQIndex = params.qIndex + 1;
      } else {
        room.status = 'finished';
        const p1Score = room.host.score;
        const p2Score = room.guest ? room.guest.score : 0;
        if (p1Score > p2Score) room.winner = room.host.id;
        else if (p2Score > p1Score && room.guest) room.winner = room.guest.id;
        else room.winner = 'tie';
      }

      broadcastRoomChange(room);
      return room;
    }
  }
  return null;
}

export async function fetchRealLeaderboard(): Promise<any[] | null> {
  try {
    const res = await fetch('/api/leaderboard');
    if (res.ok) {
      const data = await res.json();
      return data.leaderboard || [];
    }
  } catch {
    // API not reachable
  }
  return null;
}

export async function submitScoreToRealLeaderboard(data: {
  playerId: string;
  name: string;
  university: string;
  points: number;
  ratingDelta?: number;
  isDuelWin?: boolean;
  accuracy?: number;
  bestSection?: string;
  avatarSeed?: string;
}): Promise<any[] | null> {
  try {
    const res = await fetch('/api/leaderboard/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const respData = await res.json();
      return respData.leaderboard || [];
    }
  } catch {
    // API not reachable
  }
  return null;
}

export async function advanceDuelRound(roomId: string, qIndex: number): Promise<DuelRoom | null> {
  const normalizedId = normalizeRoomCode(roomId);

  try {
    const res = await fetch('/api/duel/next-round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: normalizedId, qIndex })
    });
    if (res.ok) {
      const data = await res.json();
      broadcastRoomChange(data.room);
      return data.room;
    }
  } catch {
    // fallback
  }

  const raw = localStorage.getItem(`uduel_room_${normalizedId}`);
  if (raw) {
    const room: DuelRoom = JSON.parse(raw);
    if (qIndex + 1 < room.questions.length) {
      room.currentQIndex = Math.max(room.currentQIndex, qIndex + 1);
    } else {
      room.status = 'finished';
    }
    broadcastRoomChange(room);
    return room;
  }
  return null;
}

export async function requestDuelRematch(roomId: string, newQuestions: Question[]): Promise<DuelRoom | null> {
  const normalizedId = normalizeRoomCode(roomId);

  try {
    const res = await fetch('/api/duel/rematch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: normalizedId, newQuestions })
    });
    if (res.ok) {
      const data = await res.json();
      broadcastRoomChange(data.room);
      return data.room;
    }
  } catch {
    // fallback
  }

  const raw = localStorage.getItem(`uduel_room_${normalizedId}`);
  if (raw) {
    const room: DuelRoom = JSON.parse(raw);
    room.status = 'ready';
    room.currentQIndex = 0;
    room.winner = undefined;
    room.host.score = 0;
    room.host.answers = {};
    if (room.guest) {
      room.guest.score = 0;
      room.guest.answers = {};
    }
    room.questions = newQuestions;
    broadcastRoomChange(room);
    return room;
  }
  return null;
}

export async function leaveDuelRoom(roomId: string, playerId: string): Promise<void> {
  const normalizedId = normalizeRoomCode(roomId);
  try {
    await fetch('/api/duel/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: normalizedId, playerId })
    });
  } catch {
    // ignore
  }
}

// Live Room Subscription (Combining BroadcastChannel instant updates + 400ms polling)
export function subscribeToDuelRoom(
  roomId: string,
  playerId: string,
  onUpdate: (room: DuelRoom) => void
): () => void {
  const normalizedId = normalizeRoomCode(roomId);
  let isSubscribed = true;

  // 1. BroadcastChannel listener for zero-latency multi-tab updates
  const handleBroadcast = (event: MessageEvent) => {
    if (!isSubscribed) return;
    if (event.data?.type === 'ROOM_UPDATE' && event.data.room?.id === normalizedId) {
      onUpdate(event.data.room);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 2. Storage event listener (backup for same-origin tabs)
  const handleStorage = (e: StorageEvent) => {
    if (!isSubscribed) return;
    if (e.key === `uduel_room_${normalizedId}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onUpdate(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  // 3. Regular fast polling interval for network/cross-device sync
  const pollInterval = setInterval(async () => {
    if (!isSubscribed) return;
    const freshRoom = await fetchDuelRoom(normalizedId, playerId);
    if (freshRoom && isSubscribed) {
      onUpdate(freshRoom);
    }
  }, 400);

  // Initial fetch
  fetchDuelRoom(normalizedId, playerId).then((room) => {
    if (room && isSubscribed) onUpdate(room);
  });

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}
