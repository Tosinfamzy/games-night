export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface BaseSession {
  id: number;
  sessionName: string;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  winner?: string;
  difficulty?: "easy" | "medium" | "hard";
  createdAt: string;
  updatedAt: string;
  playerCount: number;
}

export interface BasePlayer {
  id: number;
  name: string;
  strategy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaseTeam {
  id: number;
  name: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
}
