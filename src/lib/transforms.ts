import { Session, BaseSession, SessionStatus } from "@/types/session";
import { SessionState } from "./types";

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

/**
 * Convert SessionState to active status and status string
 * @param state The session state
 * @returns Object with isActive and status properties
 */
export function sessionStateToStatus(state: SessionState): {
  isActive: boolean;
  status: SessionStatus;
} {
  switch (state) {
    case "IN_PROGRESS":
      return { isActive: true, status: "active" };
    case "COMPLETED":
      return { isActive: false, status: "completed" };
    default:
      return { isActive: false, status: "completed" };
  }
}

/**
 * Convert active status to SessionState
 * @param isActive Whether the session is active
 * @returns The session state
 */
export function activeStatusToSessionState(isActive: boolean): SessionState {
  return isActive ? "IN_PROGRESS" : "COMPLETED";
}
