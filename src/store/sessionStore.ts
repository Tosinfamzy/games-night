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
  setError: (message: string | null) => void;
  createHostPlayer: (name: string) => Promise<number>;
  validateHostId: () => Promise<boolean>;
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

        setError: (message: string | null) => {
          set({ error: message });
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

        validateHostId: async () => {
          const hostId = get().hostId;
          if (!hostId) {
            return false;
          }

          try {
            // Add a timeout to the request to prevent it from hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await api.get(`/players/${hostId}`, {
              signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response.status === 200;
          } catch (error) {
            console.error("Host validation error:", error);
            return false;
          }
        },

        fetchSessions: async () => {
          const hostId = get().hostId;
          if (!hostId) {
            set({ sessions: [], isLoading: false });
            return;
          }

          // Validate hostId before proceeding
          const isValid = await get().validateHostId();
          if (!isValid) {
            get().clearHostId();
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

          // Validate hostId before proceeding
          const isValid = await get().validateHostId();
          if (!isValid) {
            get().clearHostId();
            throw new Error(
              "Host player is no longer valid. Please create a new host player."
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

          // Validate hostId before proceeding
          const isValid = await get().validateHostId();
          if (!isValid) {
            get().clearHostId();
            throw new Error(
              "Host player is no longer valid. Please create a new host player."
            );
          }

          set({ isLoading: true, error: null });
          try {
            // Ensure session is always created in active state
            const response = await api.post("/sessions", {
              ...data,
              hostId,
              isActive: true, // Sessions are always created in active state
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
              { params: { hostId: Number(hostId) } }
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
              hostId: Number(hostId),
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
                hostId: Number(hostId),
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

            set((state) => ({
              sessions: state.sessions.map((session) => ({
                ...session,
                players: session.players.map((player) =>
                  player.id === playerId
                    ? { ...player, score: (player.score || 0) + points }
                    : player
                ),
              })),
              currentSession: state.currentSession
                ? {
                    ...state.currentSession,
                    players: state.currentSession.players.map((player) =>
                      player.id === playerId
                        ? { ...player, score: (player.score || 0) + points }
                        : player
                    ),
                  }
                : null,
              isLoading: false,
            }));
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
            await api.post(`/sessions/${id}/end`, { hostId: Number(hostId) });
            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === Number(id)
                  ? { ...s, isActive: false, status: "completed" }
                  : s
              ),
              currentSession:
                state.currentSession?.id === Number(id)
                  ? {
                      ...state.currentSession,
                      isActive: false,
                      status: "completed",
                    }
                  : state.currentSession,
              isLoading: false,
            }));
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to complete session";
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
              data.numberOfTeams ? { numberOfTeams: data.numberOfTeams } : {},
              { params: { hostId: Number(hostId) } }
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
              { teams: data.teams },
              { params: { hostId: Number(hostId) } }
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
