import {
  BaseSession,
  BaseTeam,
  UpdateTeamDto,
  AssignPlayersDto,
  CreateSessionDto,
} from "@/types/session";
import { api } from "@/services/api";
import { toBaseSession } from "@/lib/transforms";
import { create } from "zustand";

interface SessionStore {
  sessions: BaseSession[];
  currentSession: BaseSession | null;
  isLoading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<BaseSession>;
  createSession: (data: CreateSessionDto) => Promise<BaseSession>;
  assignPlayers: (
    sessionId: string,
    data: AssignPlayersDto
  ) => Promise<BaseSession>;
  updateTeam: (
    sessionId: string,
    teamId: string,
    data: UpdateTeamDto
  ) => Promise<BaseTeam>;
  updatePlayerScore: (playerId: string, points: number) => Promise<void>;
  updateTeamScore: (teamId: string, points: number) => Promise<void>;
  endSession: (id: string) => Promise<void>;
}

const createSessionStore = () => {
  return create<SessionStore>((set) => ({
    sessions: [],
    currentSession: null,
    isLoading: false,
    error: null,

    fetchSessions: async () => {
      set({ isLoading: true, error: null });
      try {
        // Update to use the axios get method directly
        const response = await api.get("/sessions");
        set({
          sessions: response.data.map(toBaseSession),
          isLoading: false,
        });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to fetch sessions",
          isLoading: false,
        });
      }
    },

    fetchSession: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        // Update to use the axios get method directly
        const response = await api.get(`/sessions/${id}`);
        const session = toBaseSession(response.data);
        set({
          currentSession: session,
          isLoading: false,
        });
        return session;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch session";
        set({
          error: errorMessage,
          isLoading: false,
          currentSession: null,
        });
        throw new Error(errorMessage);
      }
    },

    createSession: async (data: CreateSessionDto) => {
      set({ isLoading: true, error: null });
      try {
        // Update to use the axios post method directly
        const response = await api.post("/sessions", data);
        const session = toBaseSession(response.data);
        set((state) => ({
          sessions: [...state.sessions, session],
          isLoading: false,
        }));
        return session;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create session";
        set({
          error: errorMessage,
          isLoading: false,
        });
        throw new Error(errorMessage);
      }
    },

    assignPlayers: async (sessionId: string, data: AssignPlayersDto) => {
      set({ isLoading: true, error: null });
      try {
        // Update to use the axios post method directly
        const response = await api.post(`/sessions/${sessionId}/players`, data);
        const session = toBaseSession(response.data);
        set({ currentSession: session, isLoading: false });
        return session;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to assign players";
        set({
          error: errorMessage,
          isLoading: false,
        });
        throw new Error(errorMessage);
      }
    },

    updateTeam: async (
      sessionId: string,
      teamId: string,
      data: UpdateTeamDto
    ) => {
      set({ isLoading: true, error: null });
      try {
        // Update to use the axios put method directly
        const response = await api.put(
          `/sessions/${sessionId}/teams/${teamId}`,
          data
        );
        const session = toBaseSession(response.data);
        const team = session.teams.find(
          (t: BaseTeam) => t.id === Number(teamId)
        );
        if (!team) {
          throw new Error("Team not found in response");
        }
        set({ currentSession: session, isLoading: false });
        return team;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update team";
        set({
          error: errorMessage,
          isLoading: false,
        });
        throw new Error(errorMessage);
      }
    },

    updatePlayerScore: async (playerId: string, points: number) => {
      set({ isLoading: true, error: null });
      try {
        // Update to use the axios put method directly
        await api.put(`/players/${playerId}/score`, { points });
        set({ isLoading: false });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to update player score";
        set({
          error: errorMessage,
          isLoading: false,
        });
        throw new Error(errorMessage);
      }
    },

    updateTeamScore: async (teamId: string, points: number) => {
      set({ isLoading: true, error: null });
      try {
        // Update to use the axios put method directly
        await api.put(`/teams/${teamId}/score`, { points });
        set((state) => ({
          sessions: state.sessions.map((session) => ({
            ...session,
            teams: session.teams.map((team) =>
              team.id === Number(teamId)
                ? { ...team, score: (team.score || 0) + points }
                : team
            ),
          })),
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                teams: state.currentSession.teams.map((team) =>
                  team.id === Number(teamId)
                    ? { ...team, score: (team.score || 0) + points }
                    : team
                ),
              }
            : null,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to update team score";
        set({
          error: errorMessage,
          isLoading: false,
        });
        throw new Error(errorMessage);
      }
    },

    endSession: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        // Update to use the axios post method directly
        await api.post(`/sessions/${id}/end`);
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === Number(id) ? { ...s, isActive: false } : s
          ),
          currentSession:
            state.currentSession?.id === Number(id)
              ? { ...state.currentSession, isActive: false }
              : state.currentSession,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to end session";
        set({
          error: errorMessage,
          isLoading: false,
        });
        throw new Error(errorMessage);
      }
    },
  }));
};

export const useSessionStore = createSessionStore();
