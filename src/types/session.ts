import { BaseEntity } from "./base";
import { Game } from "./game";

export interface GameAnalytics extends BaseEntity {
  game: string;
  totalPlays: number;
  averageDuration: number;
  averagePlayers: number;
  statistics: {
    winRates: Record<string, number>;
    commonStrategies: string[];
    difficultyLevels: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
}

export interface BasePlayer extends BaseEntity {
  name: string;
  strategy?: string;
  session: string;
  team?: { id: number; name: string };
  score?: number;
}

export interface BaseTeam extends BaseEntity {
  id: number;
  name: string;
  players: BasePlayer[];
  score?: number;
}

export interface Player {
  id: number;
  name: string;
  team: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaseSession {
  id: number;
  sessionName: string;
  isActive: boolean;
  status: SessionStatus;
  teams: BaseTeam[];
  players: BasePlayer[];
  games: Game[];
  createdAt: string;
  updatedAt: string;
  startTime?: string;
  endTime?: string;
  winner?: string;
  difficulty?: "easy" | "medium" | "hard";
  playerCount?: number;
  hostId: number;
  joinCode: string; // Add this property for session joining functionality
}

export type SessionStatus = "active" | "completed" | "cancelled";

export interface CreateSessionDto {
  sessionName: string;
  hostId: number; // Required in API schema
  gameIds?: number[]; // Optional array of game IDs from API schema
  isActive?: boolean;
}

export interface UpdateSessionDto {
  hostId: number; // Required in API schema
  sessionName?: string;
  isActive?: boolean;
}

export type Session = BaseSession;

export interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  wsConnections: Record<string, WebSocket>;

  // CRUD operations
  fetchSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<Session>;
  createSession: (data: CreateSessionDto) => Promise<Session>;
  updateSession: (id: string, data: UpdateSessionDto) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;

  // Session management
  startSession: (id: string) => Promise<void>;
  endSession: (id: string) => Promise<void>;
  moveToNextGame: (id: string) => Promise<void>;

  // Player management
  addPlayer: (sessionId: string, playerName: string) => Promise<Session>;
  removePlayer: (sessionId: string, playerId: string) => Promise<Session>;
  assignPlayers: (id: string, players: { name: string }[]) => Promise<Session>;

  // Team management
  createTeam: (sessionId: string, teamName: string) => Promise<Session>;
  updateTeam: (
    sessionId: string,
    teamId: number,
    playerIds: number[]
  ) => Promise<Session>;
  createRandomTeams: (id: string) => Promise<Session>;
  createCustomTeams: (id: string) => Promise<Session>;

  // Scoring management
  updatePlayerScore: (
    sessionId: string,
    playerId: number,
    score: number
  ) => Promise<Session>;
  updateTeamScore: (
    sessionId: string,
    teamId: number,
    score: number
  ) => Promise<Session>;

  // WebSocket management
  subscribeToSessionUpdates: (id: string) => void;
  unsubscribeFromSessionUpdates: (id: string) => void;
  cleanup: () => void;
}

export interface SessionFormData {
  sessionName: string;
  isActive?: boolean;
  hostId?: number; // Added hostId to match CreateSessionDto
}

export interface AssignPlayersDto {
  hostId: number; // Required in API schema
  players: { name: string }[];
}

export interface UpdateTeamDto {
  name?: string;
  players?: string[];
}

export interface CreateRandomTeamsDto {
  hostId: number;
  numberOfTeams?: number;
}

export interface CreateCustomTeamsDto {
  hostId: number;
  teams: {
    name: string;
    playerIds: number[];
  }[];
}
