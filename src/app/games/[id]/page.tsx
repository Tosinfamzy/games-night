"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Badge } from "@/components/ui";
import { useGameStore } from "@/store/gameStore";
import { useSessionStore } from "@/store/sessionStore";
import { GameStatus } from "@/types/game";
import { api } from "@/services/api";
import { PlayerList } from "@/components/sessions/PlayerList";
import { AnalyticsDashboard } from "@/components/analytics";
import { RealtimeScoreUpdates } from "@/components/sessions/RealtimeScoreUpdates";
import { SessionNavigation } from "@/components/sessions/SessionNavigation";
import { GameRulesManager } from "@/components/games";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { BasePlayer } from "@/types/session";

interface PlayerScoreDto {
  playerId: number;
  gameId: number;
  points: number;
}

interface AddPlayerDto {
  playerId: number;
}

interface GamePlayersResponse {
  players: {
    id: number;
    name: string;
    status: "joined" | "ready" | "playing" | "finished";
    joinedAt: string;
    session: {
      id: number;
      sessionName: string;
    };
  }[];
  total: number;
}

interface GameAnalytics {
  id: number;
  game: {
    id: number;
  };
  statistics: {
    scoreHistory?: Array<{
      playerId: number;
      playerName: string;
      points: number;
      timestamp: string;
    }>;
  };
}

interface GameLeaderboard {
  playerId: number;
  playerName: string;
  points: number;
  rank: number;
}

interface SessionScores {
  playerId: number;
  playerName: string;
  totalPoints: number;
  gamesPlayed: number;
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string | undefined;
  if (!gameId) {
    throw new Error("Game ID is missing");
  }
  const [newScore, setNewScore] = useState<Record<string, number>>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gameLeaderboard, setGameLeaderboard] = useState<
    GameLeaderboard[] | null
  >(null);
  const [sessionScores, setSessionScores] = useState<SessionScores[] | null>(
    null
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | "">("");
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [addPlayerError, setAddPlayerError] = useState<string | null>(null);
  const [gamePlayers, setGamePlayers] = useState<GamePlayersResponse | null>(
    null
  );
  const [newTeamScore, setNewTeamScore] = useState<Record<string, number>>({});
  const [scoreHistory, setScoreHistory] = useState<
    Array<{
      playerId: number;
      playerName: string;
      points: number;
      timestamp: string;
    }>
  >([]);
  const [stateUpdateSuccess, setStateUpdateSuccess] = useState<string | null>(
    null
  );
  const [stateUpdateError, setStateUpdateError] = useState<string | null>(null);

  const {
    games,
    currentGame,
    fetchGames,
    setCurrentGame,
    startGame,
    setupGame,
    completeGame,
    pauseGame,
    resumeGame,
    isLoading,
    error,
  } = useGameStore();

  const { currentSession, fetchSession, hostId } = useSessionStore();

  useEffect(() => {
    if (!gameId) return;
    setIsPageLoading(true);
    fetchGames();
  }, [gameId, fetchGames]);

  useEffect(() => {
    if (!gameId || isLoading || games.length === 0) return;

    const game = games.find((g) => g.id.toString() === gameId);
    if (!game) {
      setLoadError("Game not found");
      setIsPageLoading(false);
      return;
    }

    setCurrentGame(gameId);
    setIsPageLoading(false);
  }, [gameId, games, isLoading, setCurrentGame]);

  useEffect(() => {
    if (currentGame?.sessions?.length) {
      const activeSession = currentGame.sessions.find((s) => s.isActive);
      if (activeSession) {
        fetchSession(activeSession.id.toString());
      }
    }
  }, [currentGame?.sessions, fetchSession]);

  useEffect(() => {
    async function fetchLeaderboards() {
      const activeSession = currentGame?.sessions?.find((s) => s.isActive);
      if (!activeSession?.id || !gameId) return;

      try {
        const gameLeaderboardResponse = await api.get(
          `/scoring/leaderboard/${activeSession.id}/${gameId}`
        );
        setGameLeaderboard(gameLeaderboardResponse.data);

        const sessionScoresResponse = await api.get(
          `/scoring/session/${activeSession.id}`
        );
        setSessionScores(sessionScoresResponse.data);
      } catch (error) {
        console.error("Failed to fetch leaderboards:", error);
      }
    }

    fetchLeaderboards();
  }, [currentGame?.sessions, gameId]);

  useEffect(() => {
    async function subscribeToScores() {
      const activeSession = currentGame?.sessions?.find((s) => s.isActive);
      if (!activeSession?.id) return;

      try {
        await api.get(`/scoring/subscribe/${activeSession.id}`);
      } catch (error) {
        console.error("Failed to subscribe to score updates:", error);
      }
    }

    subscribeToScores();
  }, [currentGame?.sessions]);

  const fetchGamePlayers = async () => {
    if (!gameId) return;

    try {
      const response = await api.get<GamePlayersResponse>(
        `/games/${gameId}/players`
      );
      setGamePlayers(response.data);
    } catch (error) {
      console.error("Failed to fetch game players:", error);
    }
  };

  useEffect(() => {
    fetchGamePlayers();
  }, [gameId]);

  useEffect(() => {
    async function fetchScoreHistory() {
      if (!gameId) return;
      try {
        const response = await api.get<GameAnalytics>(
          `/analytics/games/${gameId}`
        );
        const history = response.data.statistics.scoreHistory || [];
        setScoreHistory(history);
      } catch (error) {
        console.error("Failed to fetch score history:", error);
      }
    }

    fetchScoreHistory();
  }, [gameId]);

  const handleUpdateScore = async (playerId: string, points: number) => {
    if (!points || !gameId || !currentGame?.sessions?.length) return;

    try {
      const activeSession = currentGame.sessions.find((s) => s.isActive);
      if (!activeSession) return;

      await api.post("/scoring/player", {
        playerId: parseInt(playerId),
        gameId: parseInt(gameId),
        points,
      } as PlayerScoreDto);

      const [gameLeaderboardResponse, sessionScoresResponse] =
        await Promise.all([
          api.get(`/scoring/leaderboard/${activeSession.id}/${gameId}`),
          api.get(`/scoring/session/${activeSession.id}`),
        ]);

      setGameLeaderboard(gameLeaderboardResponse.data);
      setSessionScores(sessionScoresResponse.data);
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

  const handleGameStateChange = async (newState: string) => {
    if (!gameId || !isHost || !newState) return;

    try {
      setStateUpdateSuccess(null);
      setStateUpdateError(null);

      await api.put(`/games/${gameId}/state`, {
        state: newState,
      });

      // Refresh game data
      await fetchGames();

      // Show feedback
      setStateUpdateSuccess(`Game state changed to ${newState}`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStateUpdateSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to update game state:", error);
      setStateUpdateError("Failed to update game state. Please try again.");

      // Clear error message after 5 seconds
      setTimeout(() => {
        setStateUpdateError(null);
      }, 5000);
    }
  };

  const handleJoinGame = async () => {
    if (gameId) {
      try {
        await api.post(`/games/${gameId}/players`, {
          playerId: hostId,
        } as AddPlayerDto);
        await fetchGames();
      } catch (error) {
        console.error("Failed to join game:", error);
      }
    }
  };

  const handleLeaveGame = async () => {
    if (
      gameId &&
      hostId &&
      confirm("Are you sure you want to leave this game?")
    ) {
      try {
        await api.delete(`/games/${gameId}/players/${hostId}`);
        await fetchGames();
      } catch (error) {
        console.error("Failed to leave game:", error);
      }
    }
  };

  const handleStartGame = async () => {
    if (gameId) {
      await startGame(gameId);
    }
  };

  const handleEndGame = async () => {
    if (
      gameId &&
      hostId &&
      confirm("Are you sure you want to end this game?")
    ) {
      try {
        // Use completeGame function instead of deleting player
        await completeGame(gameId);
        await fetchGames();
      } catch (error) {
        console.error("Failed to end game:", error);
      }
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
    if (gameId && hostId) {
      try {
        await api.put(`/games/${gameId}/players/${hostId}/ready`);
        await fetchGames();
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

  const handlePauseGame = async () => {
    if (gameId) {
      try {
        await pauseGame(gameId);
        await fetchGames();
      } catch (error) {
        console.error("Failed to pause game:", error);
      }
    }
  };

  const handleResumeGame = async () => {
    if (gameId) {
      try {
        await resumeGame(gameId);
        await fetchGames();
      } catch (error) {
        console.error("Failed to resume game:", error);
      }
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedPlayerId || !gameId) return;

    setIsAddingPlayer(true);
    setAddPlayerError(null);

    try {
      await api.post(`/games/${gameId}/players`, {
        playerId: selectedPlayerId,
      } as AddPlayerDto);

      // Refetch both game data and players
      await Promise.all([
        fetchGames(),
        api
          .get<GamePlayersResponse>(`/games/${gameId}/players`)
          .then((response) => {
            setGamePlayers(response.data);
          }),
      ]);

      setSelectedPlayerId("");
    } catch (error) {
      console.error("Failed to add player:", error);
      setAddPlayerError(
        error instanceof Error ? error.message : "Failed to add player to game"
      );
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const onPlayerAdded = () => {
    setIsAddingPlayer(false);
    setAddPlayerError(null);
    // Refresh game players list
    fetchGamePlayers();
  };

  // Get available players (players in session who aren't in the game)
  const availablePlayers =
    currentSession?.players?.filter(
      (player) =>
        !currentGame?.sessions?.some((session) =>
          session.players.some((gamePlayer) => gamePlayer.id === player.id)
        )
    ) || [];

  // Add a null check before accessing currentGame properties
  if (!currentGame) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Game not found</div>
      </div>
    );
  }

  const isHost = currentGame.createdBy === "current_user";
  const isPlayer =
    currentGame.sessions?.some((session) =>
      session.players.some((player) => player.id.toString() === "current_user")
    ) ?? false;
  const canJoin =
    currentGame.status === "pending" &&
    !isPlayer &&
    (currentGame.sessions?.length
      ? currentGame.sessions.find((s) => s.isActive)?.players?.length ?? 0
      : 0) < (currentGame.maxPlayers || 0);
  const canSetup =
    isHost && currentGame.status === "pending" && currentGame.state === "setup";
  const canStart =
    isHost &&
    currentGame.status === "pending" &&
    currentGame.state === "ready" &&
    (currentGame.sessions?.length
      ? currentGame.sessions.find((s) => s.isActive)?.players?.length ?? 0
      : 0) >= (currentGame.minPlayers || 0);
  const canEnd = isHost && currentGame.status === "active";
  const canComplete = isHost && currentGame.status === "active";
  const canPause =
    isHost &&
    currentGame.status === "active" &&
    currentGame.state === "in_progress";
  const canResume =
    isHost && currentGame.status === "active" && currentGame.state === "paused";

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

  return (
    <div className="container mx-auto px-4 py-8 text-gray-900 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          {currentSession ? (
            <Button
              variant="outline"
              onClick={() => router.push(`/sessions/${currentSession.id}`)}
              className="mb-4"
            >
              Back to Session
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push("/games")}
              className="mb-4"
            >
              Back to Games
            </Button>
          )}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Game Leaderboard */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Game Leaderboard
              </h2>
              <div className="space-y-4">
                {gameLeaderboard &&
                  gameLeaderboard.map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md"
                    >
                      <span className="font-medium text-gray-900">
                        {player.playerName}
                      </span>
                      <span className="font-medium text-gray-900">
                        {player.points} points
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </Card>

          {/* Session Scores */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Session Total Scores
              </h2>
              <div className="space-y-4">
                {sessionScores &&
                  sessionScores.map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md"
                    >
                      <span className="font-medium text-gray-900">
                        {player.playerName}
                      </span>
                      <span className="font-medium text-gray-900">
                        {player.totalPoints} points
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Score History */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Score History
            </h2>
            <div className="space-y-2">
              {scoreHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {entry.playerName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">
                    +{entry.points} points
                  </span>
                </div>
              ))}
              {scoreHistory.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No score history available yet
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Session Games */}
        {currentSession?.games && currentSession.games.length > 0 && (
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Games in Session
              </h2>
              <div className="space-y-4">
                {currentSession.games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-gray-900">
                        {game.name}
                      </span>
                      <Badge
                        variant={getStatusVariant(game.status as GameStatus)}
                      >
                        {game.status}
                      </Badge>
                    </div>
                    {game.id.toString() === gameId ? (
                      <Badge variant="info">Current Game</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/games/${game.id}`)}
                      >
                        View Game
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Session Players Management */}
        <Card>
          <CardHeader>
            <CardTitle>Session Players</CardTitle>
            <CardDescription>
              Players available to add to the game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerList
              sessionId={currentSession?.id?.toString() || ""}
              players={
                currentSession?.players?.filter(
                  (sessionPlayer) =>
                    !gamePlayers?.players.some(
                      (gamePlayer) => gamePlayer.id === sessionPlayer.id
                    )
                ) || []
              }
              onPlayerAdded={onPlayerAdded}
            />
          </CardContent>
        </Card>

        {/* Game Players Management */}
        <Card>
          <CardHeader>
            <CardTitle>Game Players</CardTitle>
            <CardDescription>Manage players in this game</CardDescription>
            <div className="flex gap-2 mt-4">
              <select
                value={selectedPlayerId}
                onChange={(e) => {
                  setSelectedPlayerId(Number(e.target.value));
                  setAddPlayerError(null);
                }}
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAddingPlayer}
              >
                <option value="">Select a player</option>
                {availablePlayers.map((player: BasePlayer) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAddPlayer}
                disabled={!selectedPlayerId || isAddingPlayer}
              >
                {isAddingPlayer ? "Adding..." : "Add to Game"}
              </Button>
            </div>
            {addPlayerError && (
              <p className="mt-2 text-sm text-red-500">{addPlayerError}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gamePlayers?.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.name}</span>
                    <Badge variant="info">{player.status}</Badge>
                    {currentGame?.createdBy === player.id.toString() && (
                      <Badge variant="info">Host</Badge>
                    )}
                  </div>
                  {currentGame?.status === "active" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newScore[player.id] || 0}
                        onChange={(e) =>
                          setNewScore({
                            ...newScore,
                            [player.id]: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 px-2 py-1 border rounded"
                        min={0}
                      />
                      <Button
                        onClick={() =>
                          handleUpdateScore(
                            player.id.toString(),
                            newScore[player.id] || 0
                          )
                        }
                        disabled={!newScore[player.id]}
                      >
                        Update Score
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {(!gamePlayers?.players || gamePlayers.players.length === 0) && (
                <div className="text-center text-gray-500">
                  No players added to the game yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Team Leaderboard
            </h2>
            <div className="space-y-4">
              {currentSession?.teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md"
                >
                  <span className="font-medium text-gray-900">{team.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {team.score || 0} points
                    </span>
                    {currentGame?.status === "active" && (
                      <>
                        <input
                          type="number"
                          value={newTeamScore[team.id] || 0}
                          onChange={(e) =>
                            setNewTeamScore({
                              ...newTeamScore,
                              [team.id]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-2 py-1 border rounded"
                          min={0}
                        />
                        <Button
                          onClick={async () => {
                            if (
                              !newTeamScore[team.id] ||
                              !currentGame?.sessions?.length
                            )
                              return;
                            try {
                              const activeSession = currentGame.sessions.find(
                                (s) => s.isActive
                              );
                              if (!activeSession) return;
                              await api.post("/scoring/team", {
                                teamId: team.id,
                                gameId: parseInt(gameId),
                                points: newTeamScore[team.id],
                              });
                              setNewTeamScore({
                                ...newTeamScore,
                                [team.id]: 0,
                              });
                              // Refresh session to update team scores
                              await fetchSession(activeSession.id.toString());
                            } catch (error) {
                              console.error(
                                "Failed to update team score:",
                                error
                              );
                            }
                          }}
                          disabled={!newTeamScore[team.id]}
                        >
                          Update Score
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <AnalyticsDashboard gameId={gameId} />

        <RealtimeScoreUpdates gameId={gameId} />

        {/* Add Session Navigation if game belongs to an active session */}
        {currentSession && (
          <SessionNavigation
            sessionId={currentSession.id.toString()}
            currentGameId={gameId}
            className="mb-8"
          />
        )}

        <GameRulesManager game={currentGame} />

        <div className="flex flex-wrap gap-4 justify-end mt-8 mb-12">
          <div className="w-full">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-4">
              <div>
                <h3 className="text-lg font-semibold">Game State: </h3>
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
                    {currentGame.state === "setup"
                      ? "Configure game settings"
                      : currentGame.state === "ready"
                      ? "Players are ready"
                      : currentGame.state === "in_progress"
                      ? "Game is ongoing"
                      : currentGame.state === "paused"
                      ? "Game is paused"
                      : currentGame.state === "completed"
                      ? "Game is completed"
                      : ""}
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
          </div>

          {stateUpdateSuccess && (
            <div className="text-center text-green-500">
              {stateUpdateSuccess}
            </div>
          )}
          {stateUpdateError && (
            <div className="text-center text-red-500">{stateUpdateError}</div>
          )}

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

          {canPause && (
            <Button variant="warning" onClick={handlePauseGame}>
              Pause Game
            </Button>
          )}

          {canResume && (
            <Button variant="success" onClick={handleResumeGame}>
              Resume Game
            </Button>
          )}

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

          {isHost && (
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => handleGameStateChange(e.target.value)}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Change Game State</option>
                <option value="setup">Setup</option>
                <option value="ready">Ready</option>
                <option value="in_progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <Button
                onClick={() =>
                  handleGameStateChange(
                    document.querySelector("select")?.value || ""
                  )
                }
              >
                Update State
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
