"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Badge, Input } from "@/components/ui";
import { useGameStore } from "@/store/gameStore";
import { useSessionStore } from "@/store/sessionStore";
import { GameStatus, GamePhase } from "@/types/game";
import { api } from "@/services/api";

interface PlayerScore {
  playerId: string;
  score: number;
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [newScore, setNewScore] = useState<Record<string, number>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    games,
    currentGame,
    fetchGames,
    setCurrentGame,
    joinGame,
    leaveGame,
    startGame,
    endGame,
    setupGame,
    playerReady,
    completeGame,
    updateGameState,
    isLoading,
    error,
  } = useGameStore();

  const { currentSession, fetchSession } = useSessionStore();

  useEffect(() => {
    async function loadGame() {
      setIsPageLoading(true);
      setLoadError(null);

      try {
        if (!gameId) {
          setLoadError("Invalid game ID");
          return;
        }

        await fetchGames();
        const game = games.find(g => g.id.toString() === gameId);
        
        if (!game) {
          setLoadError("Game not found");
          return;
        }

        setCurrentGame(gameId);
      } catch (err) {
        console.error("Error loading game:", err);
        setLoadError(
          "Failed to load the game. It might not exist or you may not have permission to view it."
        );
      } finally {
        setIsPageLoading(false);
      }
    }

    loadGame();
  }, [gameId, fetchGames]);

  useEffect(() => {
    if (currentGame?.sessionId) {
      fetchSession(currentGame.sessionId);
    }
  }, [currentGame?.sessionId, fetchSession]);

  const handleUpdateScore = async (playerId: string, score: number) => {
    if (!score || !gameId) return;
    
    try {
      const gameState = currentGame?.state as any; // TODO: Update Game type to include scores
      const currentScores = gameState?.scores || {};
      await api.put(`/games/${gameId}/state`, {
        scores: {
          ...currentScores,
          [playerId]: (currentScores[playerId] || 0) + score
        }
      });
      
      await fetchGames();
      setNewScore({ ...newScore, [playerId]: 0 });
    } catch (error) {
      console.error("Failed to update score:", error);
    }
  };

  const getStatusVariant = (
    status: GameStatus | undefined
  ): "default" | "success" | "warning" | "error" | "info" => {
    switch (status) {
      case "pending":
        return "warning";
      case "active":
        return "success";
      case "completed":
        return "default";
      case "cancelled":
        return "error";
      default:
        return "info";
    }
  };

  const handleJoinGame = async () => {
    if (gameId) {
      await joinGame(gameId);
    }
  };

  const handleLeaveGame = async () => {
    if (gameId && confirm("Are you sure you want to leave this game?")) {
      await leaveGame(gameId);
    }
  };

  const handleStartGame = async () => {
    if (gameId) {
      await startGame(gameId);
    }
  };

  const handleEndGame = async () => {
    if (gameId && confirm("Are you sure you want to end this game?")) {
      await endGame(gameId);
    }
  };

  const handleSetupGame = async () => {
    if (gameId) {
      try {
        await setupGame(gameId, {
          totalRounds: 10,
          config: JSON.stringify({
            gameType: currentGame?.type || "custom",
            maxPlayers: currentGame?.maxPlayers || 4,
            minPlayers: currentGame?.minPlayers || 2,
            customRules: currentGame?.customRules,
          }),
        });
      } catch (error) {
        console.error("Failed to setup game:", error);
      }
    }
  };

  const handlePlayerReady = async () => {
    if (gameId) {
      try {
        await playerReady(gameId, {
          playerId: 1,
        });
      } catch (error) {
        console.error("Failed to mark player as ready:", error);
      }
    }
  };

  const handleCompleteGame = async () => {
    if (gameId && confirm("Are you sure you want to complete this game?")) {
      try {
        await completeGame(gameId);
      } catch (error) {
        console.error("Failed to complete game:", error);
      }
    }
  };

  if (isPageLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (loadError || (!isLoading && !currentGame)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500 mb-4">
          {loadError || "Game not found"}
        </div>
        <div className="text-center">
          <Button onClick={() => router.push("/games")}>
            Back to Games List
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading game...</div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Game not found</div>
      </div>
    );
  }

  const isHost = currentGame.createdBy === "current_user";
  const isPlayer = currentGame.currentPlayers?.includes("current_user") ?? false;
  const canJoin =
    currentGame.status === "pending" &&
    !isPlayer &&
    (currentGame.currentPlayers?.length ?? 0) < (currentGame.maxPlayers || 0);
  const canSetup =
    isHost &&
    currentGame.status === "pending" &&
    currentGame.state === "setup";
  const canStart =
    isHost &&
    currentGame.status === "pending" &&
    currentGame.state === "ready" &&
    (currentGame.currentPlayers?.length ?? 0) >= (currentGame.minPlayers || 0);
  const canEnd = isHost && currentGame.status === "active";
  const canComplete = isHost && currentGame.status === "active";

  return (
    <div className="container mx-auto px-4 py-8 text-gray-900 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            Back to Games
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {currentGame.name}
              </h1>
              {currentSession && (
                <p className="text-gray-900 mt-2">
                  Session: {currentSession.sessionName}
                </p>
              )}
            </div>
            <Badge variant={getStatusVariant(currentGame.status)}>
              {currentGame.status}
            </Badge>
          </div>
        </div>

        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Game Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-900">Type</p>
                  <p className="font-medium text-gray-900">{currentGame.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Players</p>
                  <p className="font-medium text-gray-900">
                    {currentGame.currentPlayers?.length ?? 0} /{" "}
                    {currentGame.maxPlayers ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Created By</p>
                  <p className="font-medium text-gray-900">{currentGame.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Created At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(currentGame.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {currentGame.customRules && (
                <div>
                  <p className="text-sm text-gray-900">Custom Rules</p>
                  <p className="font-medium mt-1 text-gray-900">{currentGame.customRules}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="mb-8 text-gray-900">
          <div className="p-6 text-gray-900">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Players & Scores</h2>
            <div className="space-y-4">
              {(currentGame.currentPlayers ?? []).map((playerId) => (
                <div
                  key={playerId}
                  className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900">{playerId}</span>
                    {playerId === currentGame.createdBy && (
                      <Badge variant="info">Host</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900">
                      Total:{" "}
                      {((currentGame.state as any)?.scores?.[playerId]) || 0}
                    </span>
                    {currentGame.state === "in_progress" && (
                      <div className="flex items-center gap-2 text-gray-900">
                        <Input
                          type="number"
                          value={newScore[playerId] || ""}
                          onChange={(e) =>
                            setNewScore({
                              ...newScore,
                              [playerId]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20"
                          placeholder="Score"
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateScore(playerId, newScore[playerId] || 0)
                          }
                          disabled={!newScore[playerId]}
                        >
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="flex gap-4 justify-end">
          {canJoin && <Button onClick={handleJoinGame}>Join Game</Button>}
          {isPlayer && currentGame.status === "pending" && (
            <Button variant="outline" onClick={handleLeaveGame}>
              Leave Game
            </Button>
          )}
          {canSetup && <Button onClick={handleSetupGame}>Setup Game</Button>}
          {isPlayer && currentGame.state === "setup" && (
            <Button onClick={handlePlayerReady}>Mark as Ready</Button>
          )}
          {canStart && <Button onClick={handleStartGame}>Start Game</Button>}
          {canEnd && (
            <Button variant="outline" onClick={handleEndGame}>
              End Game
            </Button>
          )}
          {canComplete && (
            <Button variant="outline" onClick={handleCompleteGame}>
              Complete Game
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
