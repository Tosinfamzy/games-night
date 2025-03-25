export type GameType = "monopoly" | "uno" | "chess" | "checkers" | "custom";
export type GameStatus = "pending" | "active" | "completed" | "cancelled";
export type GamePhase =
  | "setup"
  | "ready"
  | "in_progress"
  | "paused"
  | "completed";

export interface Player {
  id: string;
  name: string;
  joinedAt: string;
}

export interface GameSettings {
  gameType: string;
  maxPlayers: number;
}

export interface CreateGameDto {
  name: string;
  rules?: string;
}

export interface GameSetupDto {
  totalRounds: number;
  config?: string;
}

export interface PlayerReadyDto {
  playerId: number;
}

export interface Game {
  id: number;
  name: string;
  rules?: string;
  state: GamePhase;
  currentRound: number;
  totalRounds: number;
  analytics: GameAnalytics[];
  createdAt: string;
  updatedAt: string;
  sessionId?: string;
  createdBy?: string;
  currentPlayers: string[];
  status: GameStatus;
  type?: GameType;
  maxPlayers?: number;
  minPlayers?: number;
  customRules?: string;
}

export interface GameAnalytics {
  id: number;
  game: Game;
  totalPlays: number;
  averageDuration: number;
  averagePlayers: number;
  statistics: {
    winRates?: Record<string, number>;
    commonStrategies?: string[];
    difficultyLevels?: Record<string, number>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GameStoreState {
  games: Game[];
  currentGame: Game | null;
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  fetchGames: () => Promise<Game[]>;
  setCurrentGame: (gameId: string) => void;
  createGame: (data: CreateGameDto) => Promise<Game>;
  setupGame: (id: string, data: GameSetupDto) => Promise<Game>;
  playerReady: (id: string, data: PlayerReadyDto) => Promise<Game>;
  startGame: (id: string) => Promise<Game>;
  completeGame: (id: string) => Promise<Game>;
  updateGameState: (id: string) => Promise<Game>;

  // Game management
  joinGame: (id: string) => Promise<Game>;
  leaveGame: (id: string) => Promise<Game>;
  endGame: (id: string) => Promise<Game>;

  cleanup: () => void;
}

export interface GameFormData {
  name: string;
  type: GameType;
  minPlayers: number;
  maxPlayers: number;
  customRules?: string;
  sessionId: string;
}
