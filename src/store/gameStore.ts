import { create } from "zustand";
import {
  GameStoreState,
  CreateGameDto,
  GameSetupDto,
  PlayerReadyDto,
  Game
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
      set({ games: response.data, isLoading: false });
      
      // Update currentGame if we have a game selected
      const currentGame = get().currentGame;
      if (currentGame) {
        const updatedGame = response.data.find((g: Game) => g.id === currentGame.id);
        set({ currentGame: updatedGame || null });
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
      set({ error: "Failed to fetch games", isLoading: false });
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
              g.id.toString() === gameId ? { ...g, scores: data.scores } : g
            ),
            currentGame:
              state.currentGame?.id.toString() === gameId
                ? { ...state.currentGame, scores: data.scores }
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
      const response = await api.post(`/games/${id}/setup`, data);
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

  playerReady: async (id: string, data: PlayerReadyDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/games/${id}/ready`, data);
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

  joinGame: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/games/${id}/join`, { role: "player" });
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
      set({ error: "Failed to join game", isLoading: false });
      throw err;
    }
  },

  leaveGame: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/games/${id}/leave`);
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
      set({ error: "Failed to leave game", isLoading: false });
      throw err;
    }
  },

  endGame: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/games/${id}/end`);
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
      set({ error: "Failed to end game", isLoading: false });
      throw err;
    }
  },

  // Cleanup function to unsubscribe from WebSocket events
  cleanup: () => {
    const currentGame = get().currentGame;
    if (currentGame) {
      wsService.unsubscribeFromGame(String(currentGame.id));
    }
  },
}));
