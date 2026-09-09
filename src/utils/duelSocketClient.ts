import { DuelRoom } from './duelRoomService';
import { LeaderboardEntry } from '../types';

type RoomUpdateListener = (room: DuelRoom) => void;
type LeaderboardUpdateListener = (leaderboard: LeaderboardEntry[]) => void;

class DuelSocketManager {
  private socket: WebSocket | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private syncTimeTimer: NodeJS.Timeout | null = null;

  // Clock offset in ms: clientTime + clockOffset = serverTime
  private clockOffset: number = 0;

  // Active subscriptions
  private activeRoomSub: { roomId: string; playerId: string; name?: string; university?: string } | null = null;
  private roomListeners: Set<RoomUpdateListener> = new Set();
  private leaderboardListeners: Set<LeaderboardUpdateListener> = new Set();

  // Polling fallback timers
  private roomPollTimer: NodeJS.Timeout | null = null;
  private leaderboardPollTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private getSocketUrl(): string {
    if (typeof window === 'undefined') return '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const url = this.getSocketUrl();

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Perform time synchronization immediately
        this.syncTime();

        // Start recurring clock sync every 20s
        if (this.syncTimeTimer) clearInterval(this.syncTimeTimer);
        this.syncTimeTimer = setInterval(() => this.syncTime(), 20000);

        // Resubscribe to active room if any
        if (this.activeRoomSub) {
          this.send({
            type: 'JOIN_ROOM',
            roomId: this.activeRoomSub.roomId,
            playerId: this.activeRoomSub.playerId,
            name: this.activeRoomSub.name,
            university: this.activeRoomSub.university
          });
        }

        // Resubscribe to leaderboard if any listeners
        if (this.leaderboardListeners.size > 0) {
          this.send({ type: 'SUBSCRIBE_LEADERBOARD' });
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (err) {
          console.warn('Socket message parse error:', err);
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        // Socket will trigger onclose
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(6000, 500 * Math.pow(1.5, this.reconnectAttempts));
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public getSyncedServerTime(): number {
    return Date.now() + this.clockOffset;
  }

  private syncTime() {
    if (!this.isConnected()) return;
    const clientTime = Date.now();
    this.send({
      type: 'SYNC_TIME',
      clientTime
    });
  }

  private handleMessage(msg: any) {
    switch (msg.type) {
      case 'SYNC_TIME_RES': {
        const now = Date.now();
        const rtt = now - msg.clientTime;
        const latency = rtt / 2;
        // clockOffset = serverTime + latency - now
        this.clockOffset = Math.round((msg.serverTime + latency) - now);
        break;
      }

      case 'ROOM_STATE':
      case 'ROOM_UPDATED':
      case 'ROUND_STARTED':
      case 'ROUND_REVEAL':
      case 'MATCH_FINISHED':
      case 'PLAYER_PRESENCE': {
        if (msg.room) {
          this.notifyRoomListeners(msg.room);
        }
        break;
      }

      case 'LEADERBOARD_UPDATED': {
        if (Array.isArray(msg.leaderboard)) {
          this.notifyLeaderboardListeners(msg.leaderboard);
        }
        break;
      }
    }
  }

  public send(data: any): boolean {
    if (this.isConnected() && this.socket) {
      try {
        this.socket.send(JSON.stringify(data));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // Room Subscription with fast multi-tab fallback
  public subscribeToRoom(
    roomId: string,
    playerId: string,
    listener: RoomUpdateListener,
    metadata?: { name?: string; university?: string }
  ): () => void {
    this.roomListeners.add(listener);
    this.activeRoomSub = { roomId, playerId, ...metadata };

    if (this.isConnected()) {
      this.send({
        type: 'JOIN_ROOM',
        roomId,
        playerId,
        name: metadata?.name,
        university: metadata?.university
      });
    } else {
      this.connect();
    }

    // Secondary HTTP fallback polling (every 1.5s) if disconnected
    if (!this.roomPollTimer) {
      this.roomPollTimer = setInterval(async () => {
        if (!this.isConnected() && this.activeRoomSub) {
          try {
            const res = await fetch(`/api/duel/room/${this.activeRoomSub.roomId}?playerId=${this.activeRoomSub.playerId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.room) this.notifyRoomListeners(data.room);
            }
          } catch {}
        }
      }, 1500);
    }

    return () => {
      this.roomListeners.delete(listener);
      if (this.roomListeners.size === 0) {
        if (this.activeRoomSub) {
          this.send({
            type: 'LEAVE_ROOM',
            roomId: this.activeRoomSub.roomId,
            playerId: this.activeRoomSub.playerId
          });
        }
        this.activeRoomSub = null;
        if (this.roomPollTimer) {
          clearInterval(this.roomPollTimer);
          this.roomPollTimer = null;
        }
      }
    };
  }

  private notifyRoomListeners(room: DuelRoom) {
    for (const listener of this.roomListeners) {
      try {
        listener(room);
      } catch (err) {
        console.warn('Room listener error:', err);
      }
    }
  }

  // Leaderboard Subscription with live push
  public subscribeToLeaderboard(listener: LeaderboardUpdateListener): () => void {
    this.leaderboardListeners.add(listener);

    if (this.isConnected()) {
      this.send({ type: 'SUBSCRIBE_LEADERBOARD' });
    } else {
      this.connect();
    }

    // Secondary HTTP fallback polling (every 4s) if socket is not active
    if (!this.leaderboardPollTimer) {
      this.leaderboardPollTimer = setInterval(async () => {
        if (!this.isConnected() && this.leaderboardListeners.size > 0) {
          try {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.leaderboard)) {
                this.notifyLeaderboardListeners(data.leaderboard);
              }
            }
          } catch {}
        }
      }, 4000);
    }

    return () => {
      this.leaderboardListeners.delete(listener);
      if (this.leaderboardListeners.size === 0) {
        this.send({ type: 'UNSUBSCRIBE_LEADERBOARD' });
        if (this.leaderboardPollTimer) {
          clearInterval(this.leaderboardPollTimer);
          this.leaderboardPollTimer = null;
        }
      }
    };
  }

  private notifyLeaderboardListeners(leaderboard: LeaderboardEntry[]) {
    for (const listener of this.leaderboardListeners) {
      try {
        listener(leaderboard);
      } catch (err) {
        console.warn('Leaderboard listener error:', err);
      }
    }
  }
}

// Global Singleton Instance
export const duelSocket = new DuelSocketManager();
