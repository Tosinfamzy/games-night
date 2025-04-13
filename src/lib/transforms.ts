import { Session, BaseSession } from "@/types/session";

export function toBaseSession(session: Session): BaseSession {
  return {
    id: session.id,
    sessionName: session.sessionName,
    isActive: session.isActive,
    status: session.status,
    teams: session.teams || [],
    players: session.players || [],
    games: session.games || [],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    startTime: session.startTime,
    endTime: session.endTime,
    winner: session.winner,
    difficulty: session.difficulty,
    playerCount: session.playerCount,
    hostId: session.hostId,
    joinCode: session.joinCode,
  };
}
