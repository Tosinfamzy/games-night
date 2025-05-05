import { io, Socket } from "socket.io-client";
import { Game } from "@/types/game";
import { Session, BasePlayer, BaseTeam } from "@/types/session";

type ConnectionStatusType =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error";

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

interface TeamMessageEvent {
  teamId: number;
  playerId: number;
  playerName: string;
  message: string;
  timestamp: string;
}

interface TeamPlayerEvent {
  teamId: number;
  playerId: number;
  playerName: string;
  action: "joined" | "left";
  timestamp: string;
}

interface TeamResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

type TeamResponseCallback = (response: TeamResponse) => void;

interface StaticEventMap {
  connection_status: ConnectionStatusType;
  "player:score:update": PlayerScoreEvent;
  "team:score:update": TeamScoreEvent;
  "team:message": TeamMessageEvent;
  "team:player:update": TeamPlayerEvent;
}

interface SessionEventTypes {
  update: SessionUpdate;
  players: PlayerUpdate;
  teams: TeamUpdate;
  score: GameScoreUpdate;
}

interface TeamEventTypes {
  message: TeamMessageEvent;
  player: TeamPlayerEvent;
}

type EventHandler<T> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private static instance: WebSocketService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionStatus: ConnectionStatusType = "disconnected";

  private connectionListeners = new Set<EventHandler<ConnectionStatusType>>();
  private playerScoreListeners = new Set<EventHandler<PlayerScoreEvent>>();
  private teamScoreListeners = new Set<EventHandler<TeamScoreEvent>>();
  private teamMessageListeners = new Set<EventHandler<TeamMessageEvent>>();
  private teamPlayerListeners = new Set<EventHandler<TeamPlayerEvent>>();

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

  private teamEventListeners: Map<
    string,
    {
      [K in keyof TeamEventTypes]?: Set<EventHandler<TeamEventTypes[K]>>;
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

      // Team-related socket events
      this.socket.on("team:message", (data: TeamMessageEvent) => {
        console.log(`Team message received: Team ${data.teamId}`, data);
        this.notifyTeamMessageListeners(data);

        // Also notify team-specific listeners
        const teamListeners = this.teamEventListeners.get(
          data.teamId.toString()
        );
        if (teamListeners?.message) {
          teamListeners.message.forEach((listener) => {
            try {
              listener(data);
            } catch (error) {
              console.error("Error in team message listener:", error);
            }
          });
        }
      });

      this.socket.on("team:player:update", (data: TeamPlayerEvent) => {
        console.log(
          `Team player update: ${data.action} Team ${data.teamId}`,
          data
        );
        this.notifyTeamPlayerListeners(data);

        // Also notify team-specific listeners
        const teamListeners = this.teamEventListeners.get(
          data.teamId.toString()
        );
        if (teamListeners?.player) {
          teamListeners.player.forEach((listener) => {
            try {
              listener(data);
            } catch (error) {
              console.error("Error in team player update listener:", error);
            }
          });
        }
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
    } else if (event === "team:message") {
      this.teamMessageListeners.add(handler as EventHandler<TeamMessageEvent>);
    } else if (event === "team:player:update") {
      this.teamPlayerListeners.add(handler as EventHandler<TeamPlayerEvent>);
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
    } else if (event === "team:message") {
      this.teamMessageListeners.delete(
        handler as EventHandler<TeamMessageEvent>
      );
    } else if (event === "team:player:update") {
      this.teamPlayerListeners.delete(handler as EventHandler<TeamPlayerEvent>);
    }
  }

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

  private notifyTeamMessageListeners(data: TeamMessageEvent): void {
    this.teamMessageListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error("Error in team message listener:", error);
      }
    });
  }

  private notifyTeamPlayerListeners(data: TeamPlayerEvent): void {
    this.teamPlayerListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error("Error in team player update listener:", error);
      }
    });
  }

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

    if (!this.gameEventListeners.has(gameId)) {
      this.gameEventListeners.set(gameId, {});
    }

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

    this.gameEventListeners.delete(gameId);
  }

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

    if (!this.sessionEventListeners.has(sessionId)) {
      this.sessionEventListeners.set(sessionId, {});
    }

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

    this.sessionEventListeners.delete(sessionId);
  }

  // Team socket methods
  joinTeam(
    teamId: number,
    playerId: number,
    callback?: TeamResponseCallback
  ): void {
    if (!this.socket) {
      console.error("Cannot join team: socket not initialized");
      if (callback) {
        callback({
          success: false,
          message: "Not connected to the server",
        });
      }
      return;
    }

    console.log(`Joining team ${teamId} as player ${playerId}`);

    this.socket.emit(
      "joinTeam",
      { teamId, playerId },
      (response: TeamResponse) => {
        if (response.success) {
          // Set up team event listeners if this is the first time joining this team
          if (!this.teamEventListeners.has(teamId.toString())) {
            this.teamEventListeners.set(teamId.toString(), {});
            console.log(`Joined team room: team_${teamId}`);
          }
        }

        if (callback) {
          callback(response);
        }
      }
    );
  }

  leaveTeam(teamId: number): void {
    if (!this.socket) return;

    console.log(`Leaving team ${teamId}`);
    this.socket.emit("leaveTeam", { teamId });

    // Clean up team-specific event listeners
    this.socket.off(`team:${teamId}:message`);
    this.socket.off(`team:${teamId}:player`);

    this.teamEventListeners.delete(teamId.toString());
  }

  subscribeToTeam(
    teamId: number,
    callbacks: {
      onMessage?: EventHandler<TeamMessageEvent>;
      onPlayerUpdate?: EventHandler<TeamPlayerEvent>;
    }
  ): void {
    if (!this.socket) {
      this.connect();
      if (!this.socket) {
        console.error("Failed to subscribe to team: socket not initialized");
        return;
      }
    }

    if (!this.teamEventListeners.has(teamId.toString())) {
      this.teamEventListeners.set(teamId.toString(), {});
    }

    const teamListeners = this.teamEventListeners.get(teamId.toString())!;

    if (callbacks.onMessage) {
      if (!teamListeners.message) {
        teamListeners.message = new Set();
      }
      teamListeners.message.add(callbacks.onMessage);
      this.socket.on(`team:${teamId}:message`, callbacks.onMessage);
    }

    if (callbacks.onPlayerUpdate) {
      if (!teamListeners.player) {
        teamListeners.player = new Set();
      }
      teamListeners.player.add(callbacks.onPlayerUpdate);
      this.socket.on(`team:${teamId}:player`, callbacks.onPlayerUpdate);
    }
  }

  unsubscribeFromTeam(teamId: number): void {
    if (!this.socket) return;

    this.socket.off(`team:${teamId}:message`);
    this.socket.off(`team:${teamId}:player`);

    this.teamEventListeners.delete(teamId.toString());
  }

  sendTeamMessage(teamId: number, playerId: number, message: string): boolean {
    if (!this.socket) {
      console.error("Cannot send team message: socket not initialized");
      return false;
    }

    console.log(
      `Sending team message: Team ${teamId}, Player ${playerId}, Message: ${message.substring(
        0,
        20
      )}${message.length > 20 ? "..." : ""}`
    );

    this.socket.emit(
      "teamMessage",
      {
        teamId,
        playerId,
        message,
        timestamp: new Date().toISOString(),
      },
      (response: TeamResponse) => {
        if (!response.success) {
          console.error(`Failed to send team message: ${response.message}`);
        }
      }
    );

    return true;
  }

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

  onTeamMessage(callback: EventHandler<TeamMessageEvent>): void {
    if (!this.socket) {
      this.connect();
    }
    this.teamMessageListeners.add(callback);
    this.socket?.on("team:message", callback);
  }

  onTeamPlayerUpdate(callback: EventHandler<TeamPlayerEvent>): void {
    if (!this.socket) {
      this.connect();
    }
    this.teamPlayerListeners.add(callback);
    this.socket?.on("team:player:update", callback);
  }
}

export const wsService = WebSocketService.getInstance();
