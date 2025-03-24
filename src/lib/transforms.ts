import { Session, BaseSession } from "@/types/session";

export function toBaseSession(session: Session): BaseSession {
  return {
    id: session.id,
    sessionName: session.sessionName,
    isActive: session.isActive,
    teams: session.teams || [],
    players: session.players || [],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}
