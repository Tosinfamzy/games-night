export type GameType = "monopoly" | "uno" | "chess" | "checkers" | "custom";
export type GameStatus = "pending" | "active" | "completed" | "cancelled";
export type GamePhase =
  | "setup"
  | "ready"
  | "in_progress"
  | "paused"
  | "completed";

export interface Player {
  id: number;
  name: string;
  session?: {
    id: number;
    sessionName: string;
  };
  team?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GameParticipant {
  id: number;
  status: "joined" | "ready" | "playing" | "finished";
  player: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
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

export interface AddPlayerDto {
  playerId: number;
}

export interface Game {
  id: number;
  name: string;
  rules?: string;
  state: GamePhase;
  currentRound?: number;
  totalRounds?: number;
  analytics: GameAnalytics[];
  participants: GameParticipant[];
  scores?: Array<{
    playerId: string;
    score: number;
  }>;
  teamScores?: Array<{
    teamId: string;
    score: number;
  }>;
  sessions: Array<{
    id: number;
    sessionName: string;
    isActive: boolean;
    players: Player[];
    startTime?: string;
    endTime?: string;
    winner?: string;
    difficulty?: "easy" | "medium" | "hard";
    createdAt: string;
    updatedAt: string;
    playerCount: number;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: GameStatus;
  type?: string;
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
    scoreHistory?: Array<{
      playerId: number;
      playerName: string;
      points: number;
      timestamp: string;
    }>;
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
  addPlayer: (id: string, data: AddPlayerDto) => Promise<GameParticipant>;
  playerReady: (id: string, playerId: string) => Promise<GameParticipant>;
  startGame: (id: string) => Promise<Game>;
  completeGame: (id: string) => Promise<Game>;
  updateGameState: (id: string) => Promise<Game>;
  pauseGame: (id: string) => Promise<Game>;
  resumeGame: (id: string) => Promise<Game>;
  removePlayer: (id: string, playerId: string) => Promise<void>;

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
