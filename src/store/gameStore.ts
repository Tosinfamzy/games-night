import { create } from "zustand";
import {
  GameStoreState,
  CreateGameDto,
  GameSetupDto,
  AddPlayerDto,
  Game,
} from "@/types/game";
// Update the import path to correct location
import { api } from "@/services/api";
import { wsService } from "@/lib/websocket";

export const useGameStore = create<GameStoreState>((set, get) => ({
  games: [],
  currentGame: null,
  isLoading: false,
  error: null,

  fetchGames: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/games");
      const games = response.data;
      set({ games, isLoading: false });

      // Update currentGame if we have a game selected
      const currentGame = get().currentGame;
      if (currentGame) {
        const updatedGame = games.find((g: Game) => g.id === currentGame.id);
        set({ currentGame: updatedGame || null });
      }
      return games;
    } catch (error) {
      console.error("Failed to fetch games:", error);
      set({ error: "Failed to fetch games", isLoading: false });
      throw error;
    }
  },

  setCurrentGame: (gameId: string) => {
    const game = get().games.find((g: Game) => g.id.toString() === gameId);
    set({ currentGame: game || null });

    // Subscribe to real-time updates for this game if found
    if (game) {
      wsService.subscribeToGame(gameId, {
        onScoreUpdate: (data) => {
          set((state) => ({
            games: state.games.map((g: Game) =>
              g.id.toString() === gameId
                ? {
                    ...g,
                    scores: data.scores,
                    teamScores: data.teamScores,
                    analytics: g.analytics.map((analytics) => ({
                      ...analytics,
                      statistics: {
                        ...analytics.statistics,
                        scoreHistory: [
                          ...(analytics.statistics.scoreHistory || []),
                          ...data.scores.map((score) => ({
                            playerId: parseInt(score.playerId),
                            playerName:
                              g.participants.find(
                                (p) => p.player.id.toString() === score.playerId
                              )?.player.name || `Player ${score.playerId}`,
                            points: score.score,
                            timestamp: new Date().toISOString(),
                          })),
                        ],
                      },
                    })),
                  }
                : g
            ),
            currentGame:
              state.currentGame?.id.toString() === gameId
                ? {
                    ...state.currentGame,
                    scores: data.scores,
                    teamScores: data.teamScores,
                    analytics: state.currentGame.analytics.map((analytics) => ({
                      ...analytics,
                      statistics: {
                        ...analytics.statistics,
                        scoreHistory: [
                          ...(analytics.statistics.scoreHistory || []),
                          ...data.scores.map((score) => ({
                            playerId: parseInt(score.playerId),
                            playerName:
                              state.currentGame!.participants.find(
                                (p) => p.player.id.toString() === score.playerId
                              )?.player.name || `Player ${score.playerId}`,
                            points: score.score,
                            timestamp: new Date().toISOString(),
                          })),
                        ],
                      },
                    })),
                  }
                : state.currentGame,
          }));
        },
        onStateUpdate: (data) => {
          set((state) => ({
            games: state.games.map((g: Game) =>
              g.id.toString() === gameId ? data.state : g
            ),
            currentGame:
              state.currentGame?.id.toString() === gameId
                ? data.state
                : state.currentGame,
          }));
        },
        onTeamScoreUpdate: (data) => {
          set((state) => ({
            games: state.games.map((g: Game) =>
              g.id.toString() === gameId
                ? { ...g, teamScores: data.teamScores }
                : g
            ),
            currentGame:
              state.currentGame?.id.toString() === gameId
                ? { ...state.currentGame, teamScores: data.teamScores }
                : state.currentGame,
          }));
        },
      });
    }
  },

  createGame: async (data: CreateGameDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/games", data);
      const newGame = response.data;
      set((state) => ({
        games: [...state.games, newGame],
        currentGame: newGame,
        isLoading: false,
      }));
      return newGame;
    } catch (err) {
      set({ error: "Failed to create game", isLoading: false });
      throw err;
    }
  },

  setupGame: async (id: string, data: GameSetupDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/games/${id}/setup`, data);
      const updatedGame = response.data;
      set((state) => ({
        games: state.games.map((g) => (g.id === Number(id) ? updatedGame : g)),
        currentGame:
          state.currentGame?.id === Number(id)
            ? updatedGame
            : state.currentGame,
        isLoading: false,
      }));
      return updatedGame;
    } catch (err) {
      set({ error: "Failed to setup game", isLoading: false });
      throw err;
    }
  },

  addPlayer: async (id: string, data: AddPlayerDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/games/${id}/players`, data);
      const newParticipant = response.data;
      set((state) => ({
        games: state.games.map((g) =>
          g.id === Number(id)
            ? {
                ...g,
                participants: [...g.participants, newParticipant],
              }
            : g
        ),
        currentGame:
          state.currentGame?.id === Number(id)
            ? {
                ...state.currentGame,
                participants: [
                  ...state.currentGame.participants,
                  newParticipant,
                ],
              }
            : state.currentGame,
        isLoading: false,
      }));
      return newParticipant;
    } catch (err) {
      set({ error: "Failed to add player", isLoading: false });
      throw err;
    }
  },

  playerReady: async (id: string, playerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/games/${id}/players/${playerId}/ready`);
      const updatedParticipant = response.data;
      set((state) => ({
        games: state.games.map((g) =>
          g.id === Number(id)
            ? {
                ...g,
                participants: g.participants.map((p) =>
                  p.id === updatedParticipant.id ? updatedParticipant : p
                ),
              }
            : g
        ),
        currentGame:
          state.currentGame?.id === Number(id)
            ? {
                ...state.currentGame,
                participants: state.currentGame.participants.map((p) =>
                  p.id === updatedParticipant.id ? updatedParticipant : p
                ),
              }
            : state.currentGame,
        isLoading: false,
      }));
      return updatedParticipant;
    } catch (err) {
      set({ error: "Failed to update player ready status", isLoading: false });
      throw err;
    }
  },

  startGame: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/games/${id}/start`);
      const updatedGame = response.data;
      set((state) => ({
        games: state.games.map((g) => (g.id === Number(id) ? updatedGame : g)),
        currentGame:
          state.currentGame?.id === Number(id)
            ? updatedGame
            : state.currentGame,
        isLoading: false,
      }));
      return updatedGame;
    } catch (err) {
      set({ error: "Failed to start game", isLoading: false });
      throw err;
    }
  },

  completeGame: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/games/${id}/complete`);
      const updatedGame = response.data;
      set((state) => ({
        games: state.games.map((g) => (g.id === Number(id) ? updatedGame : g)),
        currentGame:
          state.currentGame?.id === Number(id)
            ? updatedGame
            : state.currentGame,
        isLoading: false,
      }));
      return updatedGame;
    } catch (err) {
      set({ error: "Failed to complete game", isLoading: false });
      throw err;
    }
  },

  updateGameState: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/games/${id}/state`);
      const updatedGame = response.data;
      set((state) => ({
        games: state.games.map((g) => (g.id === Number(id) ? updatedGame : g)),
        currentGame:
          state.currentGame?.id === Number(id)
            ? updatedGame
            : state.currentGame,
        isLoading: false,
      }));
      return updatedGame;
    } catch (err) {
      set({ error: "Failed to update game state", isLoading: false });
      throw err;
    }
  },

  removePlayer: async (id: string, playerId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/games/${id}/players/${playerId}`);
      set((state) => ({
        games: state.games.map((g) =>
          g.id === Number(id)
            ? {
                ...g,
                participants: g.participants.filter(
                  (p) => p.id !== Number(playerId)
                ),
              }
            : g
        ),
        currentGame:
          state.currentGame?.id === Number(id)
            ? {
                ...state.currentGame,
                participants: state.currentGame.participants.filter(
                  (p) => p.id !== Number(playerId)
                ),
              }
            : state.currentGame,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: "Failed to remove player", isLoading: false });
      throw err;
    }
  },

  cleanup: () => {
    const currentGame = get().currentGame;
    if (currentGame) {
      wsService.unsubscribeFromGame(String(currentGame.id));
    }
  },
}));
