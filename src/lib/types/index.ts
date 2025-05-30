export type GameState =
  | "setup"
  | "ready"
  | "in_progress"
  | "paused"
  | "completed";
export type SessionState = "IN_PROGRESS" | "COMPLETED"; // Simplified session lifecycle
export type Difficulty = "easy" | "medium" | "hard";

export interface Game {
  id: number;
  name: string;
  rules?: string;
  state: GameState;
  currentRound?: number;
  totalRounds?: number;
  analytics?: GameAnalytics[];
  createdAt: string;
  updatedAt: string;
}

export interface GameStatistics {
  winRates: Record<string, number>;
  commonStrategies: string[];
  difficultyLevels: Record<string, number>;
}

export interface GameAnalytics {
  id: number;
  game: Game;
  totalPlays: number;
  averageDuration: number;
  averagePlayers: number;
  statistics: GameStatistics;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: number;
  name: string;
  strategy?: string;
  session: Session;
  team?: Team;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  name: string;
  players: Player[];
  session: Session;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: number;
  sessionName: string;
  isActive: boolean; // true = IN_PROGRESS, false = COMPLETED
  status?: string; // "active" or "completed"
  games: Game[];
  players: Player[];
  startTime?: string;
  endTime?: string;
  winner?: string;
  difficulty?: Difficulty;
  createdAt: string;
  updatedAt: string;
  playerCount: number;
  joinCode?: string;
}

export interface CreateSessionDto {
  gameIds: number[];
  sessionName: string;
  isActive?: boolean; // Default is true - sessions are created in IN_PROGRESS state
}

export interface CreatePlayerDto {
  name: string;
  sessionId: string;
  type?: string;
}

export interface AssignPlayersDto {
  players: CreatePlayerDto[];
}

export interface PlayerScoreDto {
  playerId: number;
  points: number;
}

export interface TeamScoreDto {
  teamId: number;
  points: number;
}

export interface Score {
  id: number;
  points: number;
  createdAt: string;
}
