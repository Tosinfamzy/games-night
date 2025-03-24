"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Badge, Input } from "@/components/ui";
import { useGameStore } from "@/store/gameStore";
import { useSessionStore } from "@/store/sessionStore";
import { GameStatus } from "@/types/game";
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

  const {
    currentGame,
    fetchGame,
    joinGame,
    leaveGame,
    startGame,
    endGame,
    isLoading,
    error,
  } = useGameStore();

  const { currentSession, fetchSession } = useSessionStore();

  useEffect(() => {
    if (gameId) {
      fetchGame(gameId);
      fetchScores();
    }
  }, [gameId, fetchGame]);

  useEffect(() => {
    if (currentGame?.sessionId) {
      fetchSession(currentGame.sessionId);
    }
  }, [currentGame?.sessionId, fetchSession]);

  const fetchScores = async () => {
    try {
      const response = await api.get(`/games/${gameId}/scores`);
      setScores(response.data);
    } catch (error) {
      console.error("Failed to fetch scores:", error);
    }
  };

  const handleUpdateScore = async (playerId: string, score: number) => {
    if (!score) return;
    try {
      await api.post(`/games/${gameId}/scores`, {
        playerId,
        score,
      });
      await fetchScores();
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Error: {error}</div>
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

  const isHost = currentGame.createdBy === "current_user"; // Replace with actual user ID check
  const isPlayer = currentGame.currentPlayers.includes("current_user"); // Replace with actual user ID check
  const canJoin =
    currentGame.status === "pending" &&
    !isPlayer &&
    currentGame.currentPlayers.length < (currentGame.maxPlayers || 0);
  const canStart =
    isHost &&
    currentGame.status === "pending" &&
    currentGame.currentPlayers.length >= (currentGame.minPlayers || 0);
  const canEnd = isHost && currentGame.status === "active";

  return (
    <div className="container mx-auto px-4 py-8">
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
                <p className="text-gray-600 mt-2">
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
            <h2 className="text-xl font-semibold mb-4">Game Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{currentGame.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Players</p>
                  <p className="font-medium">
                    {currentGame.currentPlayers.length} /{" "}
                    {currentGame.maxPlayers}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p className="font-medium">{currentGame.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-medium">
                    {new Date(currentGame.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {currentGame.customRules && (
                <div>
                  <p className="text-sm text-gray-600">Custom Rules</p>
                  <p className="font-medium mt-1">{currentGame.customRules}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Players & Scores</h2>
            <div className="space-y-4">
              {currentGame.currentPlayers.map((playerId) => (
                <div
                  key={playerId}
                  className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{playerId}</span>
                    {playerId === currentGame.createdBy && (
                      <Badge variant="info">Host</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      Total:{" "}
                      {scores.find((s) => s.playerId === playerId)?.score || 0}
                    </span>
                    {currentGame.state === "in_progress" && (
                      <div className="flex items-center gap-2">
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
          {canStart && <Button onClick={handleStartGame}>Start Game</Button>}
          {canEnd && (
            <Button variant="outline" onClick={handleEndGame}>
              End Game
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
