import { io, Socket } from "socket.io-client";
import { Game } from "@/types/game";
import { Session, BasePlayer, BaseTeam } from "@/types/session";

interface GameScore {
  playerId: string;
  score: number;
}

interface GameScoreUpdate {
  gameId: string;
  scores: GameScore[];
}

interface GameStateUpdate {
  gameId: string;
  state: Game;
}

interface SessionUpdate {
  sessionId: string;
  session: Session;
}

interface PlayerUpdate {
  sessionId: string;
  players: BasePlayer[];
}

interface TeamUpdate {
  sessionId: string;
  teams: BaseTeam[];
}

class WebSocketService {
  private socket: Socket | null = null;
  private static instance: WebSocketService;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(
        process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000",
        {
          transports: ["websocket"],
          autoConnect: true,
        }
      );

      this.socket.on("connect", () => {
        console.log("WebSocket connected");
      });

      this.socket.on("disconnect", () => {
        console.log("WebSocket disconnected");
      });

      this.socket.on("error", (error: Error) => {
        console.error("WebSocket error:", error);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Game events
  subscribeToGame(
    gameId: string,
    callbacks: {
      onScoreUpdate?: (data: GameScoreUpdate) => void;
      onStateUpdate?: (data: GameStateUpdate) => void;
    }
  ) {
    if (!this.socket) return;

    this.socket.emit("join:game", { gameId });

    if (callbacks.onScoreUpdate) {
      this.socket.on(`game:${gameId}:score`, callbacks.onScoreUpdate);
    }

    if (callbacks.onStateUpdate) {
      this.socket.on(`game:${gameId}:state`, callbacks.onStateUpdate);
    }
  }

  unsubscribeFromGame(gameId: string) {
    if (!this.socket) return;

    this.socket.emit("leave:game", { gameId });
    this.socket.off(`game:${gameId}:score`);
    this.socket.off(`game:${gameId}:state`);
  }

  // Session events
  subscribeToSession(
    sessionId: string,
    callbacks: {
      onUpdate?: (data: SessionUpdate) => void;
      onPlayerUpdate?: (data: PlayerUpdate) => void;
      onTeamUpdate?: (data: TeamUpdate) => void;
    }
  ) {
    if (!this.socket) return;

    this.socket.emit("join:session", { sessionId });

    if (callbacks.onUpdate) {
      this.socket.on(`session:${sessionId}:update`, callbacks.onUpdate);
    }

    if (callbacks.onPlayerUpdate) {
      this.socket.on(`session:${sessionId}:players`, callbacks.onPlayerUpdate);
    }

    if (callbacks.onTeamUpdate) {
      this.socket.on(`session:${sessionId}:teams`, callbacks.onTeamUpdate);
    }
  }

  unsubscribeFromSession(sessionId: string) {
    if (!this.socket) return;

    this.socket.emit("leave:session", { sessionId });
    this.socket.off(`session:${sessionId}:update`);
    this.socket.off(`session:${sessionId}:players`);
    this.socket.off(`session:${sessionId}:teams`);
  }
}

export const wsService = WebSocketService.getInstance();
