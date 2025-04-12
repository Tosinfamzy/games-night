import { io, Socket } from "socket.io-client";
import { Game } from "@/types/game";
import { Session, BasePlayer, BaseTeam } from "@/types/session";

// Event name literals to ensure type safety with string keys
type ConnectionStatusType =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error";

// Standard interfaces for events based on API schema
interface GameScore {
  playerId: string;
  score: number;
}

interface TeamScore {
  teamId: string;
  score: number;
}

interface GameScoreUpdate {
  gameId: string;
  scores: GameScore[];
  teamScores?: TeamScore[];
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

interface TeamScoreUpdate {
  gameId: string;
  teamScores: TeamScore[];
}

// Interfaces for real-time score updates based on API schema
interface PlayerScoreEvent {
  playerId: number;
  gameId: number;
  points: number;
  timestamp: string;
  playerName?: string;
}

interface TeamScoreEvent {
  teamId: number;
  gameId: number;
  points: number;
  timestamp: string;
  teamName?: string;
}

// Define static event types
interface StaticEventMap {
  connection_status: ConnectionStatusType;
  "player:score:update": PlayerScoreEvent;
  "team:score:update": TeamScoreEvent;
}

// Interface for session event listener types
interface SessionEventTypes {
  update: SessionUpdate;
  players: PlayerUpdate;
  teams: TeamUpdate;
  score: GameScoreUpdate;
}

// Generic event handler type
type EventHandler<T> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private static instance: WebSocketService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionStatus: ConnectionStatusType = "disconnected";

  // Store listeners with proper typings, using SessionEventTypes
  private connectionListeners = new Set<EventHandler<ConnectionStatusType>>();
  private playerScoreListeners = new Set<EventHandler<PlayerScoreEvent>>();
  private teamScoreListeners = new Set<EventHandler<TeamScoreEvent>>();
  private gameEventListeners: Map<
    string,
    {
      score?: Set<EventHandler<GameScoreUpdate>>;
      state?: Set<EventHandler<GameStateUpdate>>;
      teamScore?: Set<EventHandler<TeamScoreUpdate>>;
      playerScore?: Set<EventHandler<PlayerScoreEvent>>;
    }
  > = new Map();
  private sessionEventListeners: Map<
    string,
    {
      [K in keyof SessionEventTypes]?: Set<EventHandler<SessionEventTypes[K]>>;
    }
  > = new Map();

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(): void {
    if (this.socket && this.connectionStatus === "connected") return;

    this.connectionStatus = "connecting";
    console.log("Connecting to WebSocket server...");

    const url =
      process.env.NEXT_PUBLIC_WS_URL || "https://games-night-api.onrender.com";

    try {
      this.socket = io(url, {
        transports: ["websocket"],
        autoConnect: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        console.log("WebSocket connected successfully");
        this.connectionStatus = "connected";
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(this.connectionStatus);
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`WebSocket disconnected: ${reason}`);
        this.connectionStatus = "disconnected";
        this.notifyConnectionListeners(this.connectionStatus);

        if (reason === "io server disconnect") {
          this.reconnect();
        }
      });

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        this.connectionStatus = "error";
        this.notifyConnectionListeners(this.connectionStatus);
        this.reconnect();
      });

      this.socket.on("error", (error: Error) => {
        console.error("WebSocket error:", error);
        this.connectionStatus = "error";
        this.notifyConnectionListeners(this.connectionStatus);
      });
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      this.connectionStatus = "error";
      this.notifyConnectionListeners(this.connectionStatus);
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        } else {
          this.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error(
        "Max reconnection attempts reached. Please try again later."
      );
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log("Disconnecting from WebSocket server...");
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = "disconnected";
      this.notifyConnectionListeners(this.connectionStatus);
    }
  }

  getConnectionStatus(): ConnectionStatusType {
    return this.connectionStatus;
  }

  // Type-safe event handlers using specific listener collections
  on<K extends keyof StaticEventMap>(
    event: K,
    handler: EventHandler<StaticEventMap[K]>
  ): void {
    if (event === "connection_status") {
      this.connectionListeners.add(
        handler as EventHandler<ConnectionStatusType>
      );
    } else if (event === "player:score:update") {
      this.playerScoreListeners.add(handler as EventHandler<PlayerScoreEvent>);
    } else if (event === "team:score:update") {
      this.teamScoreListeners.add(handler as EventHandler<TeamScoreEvent>);
    }
  }

  off<K extends keyof StaticEventMap>(
    event: K,
    handler: EventHandler<StaticEventMap[K]>
  ): void {
    if (event === "connection_status") {
      this.connectionListeners.delete(
        handler as EventHandler<ConnectionStatusType>
      );
    } else if (event === "player:score:update") {
      this.playerScoreListeners.delete(
        handler as EventHandler<PlayerScoreEvent>
      );
    } else if (event === "team:score:update") {
      this.teamScoreListeners.delete(handler as EventHandler<TeamScoreEvent>);
    }
  }

  // Type-safe notification methods for each event type
  private notifyConnectionListeners(status: ConnectionStatusType): void {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error("Error in connection status listener:", error);
      }
    });
  }

  private notifyPlayerScoreListeners(data: PlayerScoreEvent): void {
    this.playerScoreListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error("Error in player score listener:", error);
      }
    });
  }

  private notifyTeamScoreListeners(data: TeamScoreEvent): void {
    this.teamScoreListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error("Error in team score listener:", error);
      }
    });
  }

  // Game-specific methods
  subscribeToGame(
    gameId: string,
    callbacks: {
      onScoreUpdate?: EventHandler<GameScoreUpdate>;
      onStateUpdate?: EventHandler<GameStateUpdate>;
      onTeamScoreUpdate?: EventHandler<TeamScoreUpdate>;
      onPlayerScoreEvent?: EventHandler<PlayerScoreEvent>;
    }
  ): void {
    if (!this.socket) {
      this.connect();
      if (!this.socket) {
        console.error("Failed to subscribe to game: socket not initialized");
        return;
      }
    }

    // Initialize listeners for this game if they don't exist
    if (!this.gameEventListeners.has(gameId)) {
      this.gameEventListeners.set(gameId, {});
    }

    // Get the listeners for this game
    const gameListeners = this.gameEventListeners.get(gameId)!;

    this.socket.emit("join:game", { gameId });
    console.log(`Joined game room: ${gameId}`);

    if (callbacks.onScoreUpdate) {
      if (!gameListeners.score) {
        gameListeners.score = new Set();
      }
      gameListeners.score.add(callbacks.onScoreUpdate);
      this.socket.on(`game:${gameId}:score`, callbacks.onScoreUpdate);
    }

    if (callbacks.onStateUpdate) {
      if (!gameListeners.state) {
        gameListeners.state = new Set();
      }
      gameListeners.state.add(callbacks.onStateUpdate);
      this.socket.on(`game:${gameId}:state`, callbacks.onStateUpdate);
    }

    if (callbacks.onTeamScoreUpdate) {
      if (!gameListeners.teamScore) {
        gameListeners.teamScore = new Set();
      }
      gameListeners.teamScore.add(callbacks.onTeamScoreUpdate);
      this.socket.on(`game:${gameId}:teamScore`, callbacks.onTeamScoreUpdate);
    }

    if (callbacks.onPlayerScoreEvent) {
      if (!gameListeners.playerScore) {
        gameListeners.playerScore = new Set();
      }
      gameListeners.playerScore.add(callbacks.onPlayerScoreEvent);
      this.socket.on(
        `game:${gameId}:playerScore`,
        callbacks.onPlayerScoreEvent
      );
    }
  }

  unsubscribeFromGame(gameId: string): void {
    if (!this.socket) return;

    this.socket.emit("leave:game", { gameId });
    console.log(`Left game room: ${gameId}`);

    this.socket.off(`game:${gameId}:score`);
    this.socket.off(`game:${gameId}:state`);
    this.socket.off(`game:${gameId}:teamScore`);
    this.socket.off(`game:${gameId}:playerScore`);

    // Clean up the listeners
    this.gameEventListeners.delete(gameId);
  }

  // Session-specific methods
  subscribeToSession(
    sessionId: string,
    callbacks: {
      onUpdate?: EventHandler<SessionUpdate>;
      onPlayerUpdate?: EventHandler<PlayerUpdate>;
      onTeamUpdate?: EventHandler<TeamUpdate>;
      onScoreUpdate?: EventHandler<GameScoreUpdate>;
    }
  ): void {
    if (!this.socket) {
      this.connect();
      if (!this.socket) {
        console.error("Failed to subscribe to session: socket not initialized");
        return;
      }
    }

    // Initialize listeners for this session if they don't exist
    if (!this.sessionEventListeners.has(sessionId)) {
      this.sessionEventListeners.set(sessionId, {});
    }

    // Get the listeners for this session
    const sessionListeners = this.sessionEventListeners.get(sessionId)!;

    this.socket.emit("join:session", { sessionId });
    console.log(`Joined session room: ${sessionId}`);

    if (callbacks.onUpdate) {
      if (!sessionListeners.update) {
        sessionListeners.update = new Set();
      }
      sessionListeners.update.add(callbacks.onUpdate);
      this.socket.on(`session:${sessionId}:update`, callbacks.onUpdate);
    }

    if (callbacks.onPlayerUpdate) {
      if (!sessionListeners.players) {
        sessionListeners.players = new Set();
      }
      sessionListeners.players.add(callbacks.onPlayerUpdate);
      this.socket.on(`session:${sessionId}:players`, callbacks.onPlayerUpdate);
    }

    if (callbacks.onTeamUpdate) {
      if (!sessionListeners.teams) {
        sessionListeners.teams = new Set();
      }
      sessionListeners.teams.add(callbacks.onTeamUpdate);
      this.socket.on(`session:${sessionId}:teams`, callbacks.onTeamUpdate);
    }

    if (callbacks.onScoreUpdate) {
      if (!sessionListeners.score) {
        sessionListeners.score = new Set();
      }
      sessionListeners.score.add(callbacks.onScoreUpdate);
      this.socket.on(`session:${sessionId}:score`, callbacks.onScoreUpdate);
    }
  }

  unsubscribeFromSession(sessionId: string): void {
    if (!this.socket) return;

    this.socket.emit("leave:session", { sessionId });
    console.log(`Left session room: ${sessionId}`);

    this.socket.off(`session:${sessionId}:update`);
    this.socket.off(`session:${sessionId}:players`);
    this.socket.off(`session:${sessionId}:teams`);
    this.socket.off(`session:${sessionId}:score`);

    // Clean up the listeners
    this.sessionEventListeners.delete(sessionId);
  }

  // Score update methods
  updatePlayerScore(playerId: number, gameId: number, points: number): boolean {
    if (!this.socket) {
      console.error("Cannot update player score: socket not initialized");
      return false;
    }

    console.log(
      `Sending player score update: Player ${playerId}, Game ${gameId}, Points ${points}`
    );
    this.socket.emit("player:score", {
      playerId,
      gameId,
      points,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  updateTeamScore(teamId: number, gameId: number, points: number): boolean {
    if (!this.socket) {
      console.error("Cannot update team score: socket not initialized");
      return false;
    }

    console.log(
      `Sending team score update: Team ${teamId}, Game ${gameId}, Points ${points}`
    );
    this.socket.emit("team:score", {
      teamId,
      gameId,
      points,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  onPlayerScoreUpdate(callback: EventHandler<PlayerScoreEvent>): void {
    if (!this.socket) {
      this.connect();
    }
    this.playerScoreListeners.add(callback);
    this.socket?.on("player:score:update", callback);
  }

  onTeamScoreUpdate(callback: EventHandler<TeamScoreEvent>): void {
    if (!this.socket) {
      this.connect();
    }
    this.teamScoreListeners.add(callback);
    this.socket?.on("team:score:update", callback);
  }
}

export const wsService = WebSocketService.getInstance();
