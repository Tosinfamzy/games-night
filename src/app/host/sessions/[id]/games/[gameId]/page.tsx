"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { useGameStore } from "@/store/gameStore";
import { ScoringSystem } from "@/components/sessions/ScoringSystem";
import { Button, Badge } from "@/components/ui";
import { api } from "@/services/api";
import { Game } from "@/types/game";

export default function GamePage() {
  const params = useParams();
  const gameId = params?.gameId ? Number(params.gameId) : 0;
  const sessionId = params?.id as string;

  const { currentSession, updatePlayerScore, updateTeamScore, fetchSession } =
    useSessionStore();
  const { games, fetchGames } = useGameStore();
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isStateUpdating, setIsStateUpdating] = useState(false);

  useEffect(() => {
    fetchGames();
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [fetchGames, fetchSession, sessionId]);

  useEffect(() => {
    if (games && games.length > 0) {
      const game = games.find((g) => g.id === gameId);
      // Convert undefined to null when no game is found
      setCurrentGame(game || null);
    }
  }, [games, gameId]);

  const handleGameStateChange = async (newState: string) => {
    if (!gameId) return;

    setIsStateUpdating(true);
    try {
      await api.put(`/games/${gameId}/state`, {
        state: newState,
      });

      // Refresh game data
      await fetchGames();

      // Show feedback (You might want to add a toast notification system)
      console.log(`Game state changed to ${newState}`);
    } catch (error) {
      console.error("Failed to update game state:", error);
    } finally {
      setIsStateUpdating(false);
    }
  };

  const isHost = true;

  const getStateDescription = (state: string) => {
    switch (state) {
      case "setup":
        return "Configure game settings";
      case "ready":
        return "Players are ready";
      case "in_progress":
        return "Game is ongoing";
      case "paused":
        return "Game is paused";
      case "completed":
        return "Game is completed";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Game Management</h1>

      {currentSession && currentGame ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              {/* Game State Display and Management */}
              <div className="mb-6">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Game State:{" "}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          currentGame.state === "setup"
                            ? "warning"
                            : currentGame.state === "ready"
                            ? "info"
                            : currentGame.state === "in_progress"
                            ? "success"
                            : currentGame.state === "paused"
                            ? "warning"
                            : currentGame.state === "completed"
                            ? "default"
                            : "default"
                        }
                      >
                        {currentGame.state}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {getStateDescription(currentGame.state)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {currentGame.currentRound && currentGame.totalRounds
                        ? `Round: ${currentGame.currentRound}/${currentGame.totalRounds}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Game State Changer - Accessible to everyone */}
                {isHost && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">
                      Change Game Stage
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        onChange={(e) =>
                          e.target.value &&
                          handleGameStateChange(e.target.value)
                        }
                        className="px-4 py-2 border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
                        disabled={isStateUpdating}
                      >
                        <option value="">Select New Stage</option>
                        <option value="setup">Setup</option>
                        <option value="ready">Ready</option>
                        <option value="in_progress">In Progress</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                      <Button
                        onClick={() => {
                          const selectElem = document.querySelector("select");
                          if (selectElem && selectElem.value) {
                            handleGameStateChange(selectElem.value);
                          }
                        }}
                        disabled={isStateUpdating}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        {isStateUpdating ? "Updating..." : "Change Stage"}
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-blue-700">
                      Select a stage and click Change Stage to update the
                      current game status.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Scoring</h3>
                <ScoringSystem
                  teams={currentSession.teams || []}
                  players={currentSession.players || []}
                  gameId={gameId}
                  onUpdateScore={(playerId, gameId, points) =>
                    updatePlayerScore(playerId, gameId, points)
                  }
                  onUpdateTeamScore={(teamId, gameId, points) =>
                    updateTeamScore(teamId, gameId, points)
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Game Information
            </h2>
            {currentGame ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Game Name</h3>
                  <p className="text-gray-600">{currentGame.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Game Type</h3>
                  <p className="capitalize text-gray-600">
                    {currentGame.type || "Custom"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Status</h3>
                  <Badge>{currentGame.status}</Badge>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Players</h3>
                  <p className="text-gray-600">
                    {currentSession?.players?.length || 0} /{" "}
                    {currentGame.maxPlayers || "∞"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Loading game information...</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading game details...</p>
        </div>
      )}
    </div>
  );
}
