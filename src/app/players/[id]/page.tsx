"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Badge } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { api } from "@/services/api";
import { useSessionStore } from "@/store/sessionStore";
import { useGameStore } from "@/store/gameStore";
import { BasePlayer } from "@/types/session";
import { Game } from "@/types/game";
import { RealtimeScoreUpdates } from "@/components/sessions/RealtimeScoreUpdates";
import Link from "next/link";

interface PlayerDetails {
  id: number;
  name: string;
  team?: {
    id: number;
    name: string;
    players?: BasePlayer[];
    score?: number;
  };
  score?: number;
  session: {
    id: number;
    sessionName: string;
    currentGame?: Game;
    games?: Game[];
  };
}

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params?.id as string;

  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<BasePlayer[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  const { fetchSession } = useSessionStore();
  const { fetchGames } = useGameStore();

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch player details
        const playerResponse = await api.get(`/players/${playerId}`);
        const playerData = playerResponse.data as PlayerDetails;
        setPlayer(playerData);

        // Fetch session details
        if (playerData.session.id) {
          const sessionResponse = await fetchSession(
            playerData.session.id.toString()
          );

          // Find current active game
          const currentActiveGame = sessionResponse.games?.find(
            (g) => g.state === "in_progress"
          );
          if (currentActiveGame) {
            setCurrentGame(currentActiveGame);
          }

          // Get team members if player is in a team
          if (playerData.team?.id) {
            const team = sessionResponse.teams?.find(
              (t) => t.id === playerData.team?.id
            );
            if (team?.players) {
              setTeamMembers(
                team.players.filter((p) => p.id !== parseInt(playerId))
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch player data:", error);
        setError("Could not load your player information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
    fetchGames();
  }, [playerId, fetchSession, fetchGames]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-900">
            Loading your player information...
          </p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500 mb-4">
          {error || "Player not found"}
        </div>
        <div className="text-center">
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Player Dashboard</h1>
          <Link href={`/sessions/${player.session.id}`}>
            <Button variant="outline">View Full Session</Button>
          </Link>
        </div>

        {/* Player Information Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-500">Name</h3>
                <p className="text-xl font-semibold">{player.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Session</h3>
                <p className="text-xl font-semibold">
                  {player.session.sessionName}
                </p>
              </div>
              {player.team && (
                <div className="col-span-full">
                  <h3 className="font-medium text-gray-500">Team</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-semibold">{player.team.name}</p>
                    {player.team.score !== undefined && (
                      <Badge variant="info" className="ml-2">
                        Score: {player.team.score}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {player.score !== undefined && (
                <div className="col-span-full">
                  <h3 className="font-medium text-gray-500">Your Score</h3>
                  <p className="text-xl font-semibold">{player.score} points</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Game Card */}
        {currentGame && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500">Game</h3>
                  <p className="text-xl font-semibold">{currentGame.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-500">Status:</h3>
                  <Badge
                    variant={
                      currentGame.state === "in_progress"
                        ? "success"
                        : currentGame.state === "paused"
                        ? "warning"
                        : currentGame.state === "completed"
                        ? "default"
                        : "info"
                    }
                  >
                    {currentGame.state}
                  </Badge>
                </div>
                {currentGame.currentRound && currentGame.totalRounds && (
                  <div>
                    <h3 className="font-medium text-gray-500">Round</h3>
                    <p className="text-lg font-medium">
                      {currentGame.currentRound} of {currentGame.totalRounds}
                    </p>
                  </div>
                )}
                <div className="pt-2">
                  <Link href={`/games/${currentGame.id}`}>
                    <Button variant="outline">View Game Details</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members Card */}
        {player.team && teamMembers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <span className="font-medium">{member.name}</span>
                    {member.score !== undefined && (
                      <Badge variant="info">Score: {member.score}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Score Updates */}
        {currentGame && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Live Score Updates</h2>
            <RealtimeScoreUpdates
              gameId={currentGame.id}
              sessionId={player.session.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
