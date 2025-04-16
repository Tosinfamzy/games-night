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
import { persist } from "zustand/middleware";

interface SessionStore {
  sessions: BaseSession[];
  currentSession: BaseSession | null;
  hostId: number | null;
  isLoading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<BaseSession>;
  createSession: (data: CreateSessionDto) => Promise<BaseSession>;
  createTeam: (sessionId: string, teamName: string) => Promise<BaseTeam>;
  assignPlayers: (
    sessionId: string,
    data: AssignPlayersDto
  ) => Promise<BaseSession>;
  updateTeam: (
    sessionId: string,
    teamId: string,
    data: UpdateTeamDto
  ) => Promise<BaseTeam>;
  updatePlayerScore: (
    playerId: number,
    gameId: number,
    points: number
  ) => Promise<void>;
  updateTeamScore: (
    teamId: number,
    gameId: number,
    points: number
  ) => Promise<void>;
  endSession: (id: string) => Promise<void>;
  createRandomTeams: (
    sessionId: string,
    data: { numberOfTeams?: number }
  ) => Promise<BaseSession>;
  createCustomTeams: (
    sessionId: string,
    data: { teams: { name: string; playerIds: number[] }[] }
  ) => Promise<BaseSession>;
  setHostId: (id: number) => void;
  clearHostId: () => void;
  createHostPlayer: (name: string) => Promise<number>;
}

const createSessionStore = () => {
  return create<SessionStore>()(
    persist(
      (set, get) => ({
        sessions: [],
        currentSession: null,
        hostId: null,
        isLoading: false,
        error: null,

        setHostId: (id: number) => {
          set({ hostId: id });
        },

        clearHostId: () => {
          set({ hostId: null, sessions: [], currentSession: null });
        },

        createHostPlayer: async (name: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.post("/players/host", {
              name,
            });
            const hostId = response.data.id;
            set({ hostId, isLoading: false });
            return hostId;
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to create host player";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw new Error(errorMessage);
          }
        },

        fetchSessions: async () => {
          const hostId = get().hostId;
          if (!hostId) {
            set({ sessions: [], isLoading: false });
            return;
          }

          set({ isLoading: true, error: null });
          try {
            const response = await api.get("/sessions", {
              params: { hostId },
            });
            set({
              sessions: response.data.map(toBaseSession),
              isLoading: false,
            });
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch sessions",
              isLoading: false,
            });
          }
        },

        fetchSession: async (id: string) => {
          const hostId = get().hostId;
          if (!hostId) {
            throw new Error(
              "No host player found. Create a host player first."
            );
          }

          set({ isLoading: true, error: null });
          try {
            const response = await api.get(`/sessions/${id}`, {
              params: { hostId },
            });
            const session = toBaseSession(response.data);
            set({
              currentSession: session,
              isLoading: false,
            });
            return session;
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to fetch session";
            set({
              error: errorMessage,
              isLoading: false,
              currentSession: null,
            });
            throw new Error(errorMessage);
          }
        },

        createSession: async (data: CreateSessionDto) => {
          const hostId = get().hostId;
          if (!hostId) {
            throw new Error(
              "No host player found. Create a host player first."
            );
          }

          set({ isLoading: true, error: null });
          try {
            const response = await api.post("/sessions", {
              ...data,
              hostId,
            });
            const session = toBaseSession(response.data);
            set((state) => ({
              sessions: [...state.sessions, session],
              isLoading: false,
            }));
            return session;
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to create session";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw new Error(errorMessage);
          }
        },

        createTeam: async (sessionId: string, teamName: string) => {
          const hostId = get().hostId;
          if (!hostId) {
            throw new Error(
              "No host player found. Create a host player first."
            );
          }

          set({ isLoading: true, error: null });
          try {
            const response = await api.post(
              `/sessions/${sessionId}/teams`,
              { name: teamName },
              { params: { hostId } }
            );
            const session = toBaseSession(response.data);
            const team = session.teams.find(
              (t: BaseTeam) => t.name === teamName
            );
            if (!team) {
              throw new Error("Team not found in response");
            }
            set({ currentSession: session, isLoading: false });
            return team;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to create team";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw new Error(errorMessage);
          }
        },

        assignPlayers: async (sessionId: string, data: AssignPlayersDto) => {
          const hostId = get().hostId;
          if (!hostId) {
            throw new Error(
              "No host player found. Create a host player first."
            );
          }

          set({ isLoading: true, error: null });
          try {
            const response = await api.post(`/sessions/${sessionId}/players`, {
              ...data,
              hostId,
            });
            const session = toBaseSession(response.data);
            set({ currentSession: session, isLoading: false });
            return session;
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to assign players";
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
          const hostId = get().hostId;
          if (!hostId) {
            throw new Error(
              "No host player found. Create a host player first."
            );
          }

          set({ isLoading: true, error: null });
          try {
            const response = await api.put(
              `/sessions/${sessionId}/teams/${teamId}`,
              {
                ...data,
                hostId,
              }
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

        updatePlayerScore: async (
          playerId: number,
          gameId: number,
          points: number
        ) => {
          set({ isLoading: true, error: null });
          try {
            await api.post(`/scoring/player`, {
              playerId,
              gameId,
              points,
            });
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

        updateTeamScore: async (
          teamId: number,
          gameId: number,
          points: number
        ) => {
          set({ isLoading: true, error: null });
          try {
            await api.post(`/scoring/team`, {
              teamId,
              gameId,
              points,
            });

            // Still update local state to reflect the change immediately
            set((state) => ({
              sessions: state.sessions.map((session) => ({
                ...session,
                teams: session.teams.map((team) =>
                  team.id === teamId
                    ? { ...team, score: (team.score || 0) + points }
                    : team
                ),
              })),
              currentSession: state.currentSession
                ? {
                    ...state.currentSession,
                    teams: state.currentSession.teams.map((team) =>
                      team.id === teamId
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
          const hostId = get().hostId;
          if (!hostId) {
            throw new Error(
              "No host player found. Create a host player first."
            );
          }

          set({ isLoading: true, error: null });
          try {
            await api.post(`/sessions/${id}/end`, { hostId });
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

        createRandomTeams: async (
          sessionId: string,
          data: { numberOfTeams?: number }
        ) => {
          const hostId = get().hostId;
          if (!hostId) {
            throw new Error(
              "No host player found. Create a host player first."
            );
          }

          set({ isLoading: true, error: null });
          try {
            const response = await api.post(
              `/sessions/${sessionId}/teams/random`,
              { ...data },
              { params: { hostId } }
            );
            const session = toBaseSession(response.data);
            set({ currentSession: session, isLoading: false });
            return session;
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to create random teams";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw new Error(errorMessage);
          }
        },

        createCustomTeams: async (
          sessionId: string,
          data: { teams: { name: string; playerIds: number[] }[] }
        ) => {
          const hostId = get().hostId;
          if (!hostId) {
            throw new Error(
              "No host player found. Create a host player first."
            );
          }

          set({ isLoading: true, error: null });
          try {
            const response = await api.post(
              `/sessions/${sessionId}/teams/custom`,
              { ...data },
              { params: { hostId } }
            );
            const session = toBaseSession(response.data);
            set({ currentSession: session, isLoading: false });
            return session;
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to create custom teams";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw new Error(errorMessage);
          }
        },
      }),
      {
        name: "games-night-session-store",
        partialize: (state) => ({ hostId: state.hostId }),
      }
    )
  );
};

export const useSessionStore = createSessionStore();
