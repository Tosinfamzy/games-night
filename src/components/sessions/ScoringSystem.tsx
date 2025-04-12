import React, { useState } from "react";
import { BasePlayer, BaseTeam } from "@/types/session";
import { Input } from "@/components/ui/Input";
import { wsService } from "@/lib/websocket";
import { useWebSocket } from "@/components/providers/WebSocketProvider";
import { Button } from "../ui";

interface ScoringSystemProps {
  teams: BaseTeam[];
  players: BasePlayer[];
  gameId: number;
  onUpdateScore: (
    playerId: number,
    gameId: number,
    score: number
  ) => Promise<void>;
  onUpdateTeamScore: (
    teamId: number,
    gameId: number,
    score: number
  ) => Promise<void>;
}

export function ScoringSystem({
  teams,
  players,
  gameId,
  onUpdateScore,
  onUpdateTeamScore,
}: ScoringSystemProps) {
  const [playerScores, setPlayerScores] = useState<Record<number, number>>({});
  const [teamScores, setTeamScores] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const { connected } = useWebSocket();

  const handlePlayerScoreChange = (playerId: number, score: string) => {
    const numericScore = parseFloat(score);
    if (!isNaN(numericScore)) {
      setPlayerScores((prev) => ({ ...prev, [playerId]: numericScore }));
    }
  };

  const handleTeamScoreChange = (teamId: number, score: string) => {
    const numericScore = parseFloat(score);
    if (!isNaN(numericScore)) {
      setTeamScores((prev) => ({ ...prev, [teamId]: numericScore }));
    }
  };

  const submitPlayerScore = async (playerId: number) => {
    const score = playerScores[playerId];
    if (!score) return;

    // Set submitting state for this player
    setSubmitting((prev) => ({ ...prev, [`player-${playerId}`]: true }));

    try {
      // First, update through the WebSocket for real-time updates
      if (connected) {
        wsService.updatePlayerScore(playerId, gameId, score);
      }

      // Then, use the API for persistence
      await onUpdateScore(playerId, gameId, score);

      // Clear the input after successful submission
      setPlayerScores((prev) => ({ ...prev, [playerId]: 0 }));
    } catch (error) {
      console.error("Failed to update score:", error);
    } finally {
      setSubmitting((prev) => ({ ...prev, [`player-${playerId}`]: false }));
    }
  };

  const submitTeamScore = async (teamId: number) => {
    const score = teamScores[teamId];
    if (!score) return;

    // Set submitting state for this team
    setSubmitting((prev) => ({ ...prev, [`team-${teamId}`]: true }));

    try {
      // First, update through the WebSocket for real-time updates
      if (connected) {
        wsService.updateTeamScore(teamId, gameId, score);
      }

      // Then, use the API for persistence
      await onUpdateTeamScore(teamId, gameId, score);

      // Clear the input after successful submission
      setTeamScores((prev) => ({ ...prev, [teamId]: 0 }));
    } catch (error) {
      console.error("Failed to update team score:", error);
    } finally {
      setSubmitting((prev) => ({ ...prev, [`team-${teamId}`]: false }));
    }
  };

  // Function to handle quick score updates (like +1, +5, etc.)
  const quickScore = async (
    entityId: number,
    points: number,
    isTeam: boolean
  ) => {
    const submittingKey = isTeam
      ? `team-${entityId}-quick`
      : `player-${entityId}-quick`;
    setSubmitting((prev) => ({ ...prev, [submittingKey]: true }));

    try {
      if (connected) {
        if (isTeam) {
          wsService.updateTeamScore(entityId, gameId, points);
        } else {
          wsService.updatePlayerScore(entityId, gameId, points);
        }
      }

      if (isTeam) {
        await onUpdateTeamScore(entityId, gameId, points);
      } else {
        await onUpdateScore(entityId, gameId, points);
      }
    } catch (error) {
      console.error(
        `Failed to update ${isTeam ? "team" : "player"} score:`,
        error
      );
    } finally {
      setSubmitting((prev) => ({ ...prev, [submittingKey]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Scores */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Team Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <h4 className="font-medium mb-2">{team.name}</h4>
              <div className="flex items-center space-x-2 mb-3">
                <Input
                  type="number"
                  value={teamScores[team.id] || ""}
                  onChange={(e) =>
                    handleTeamScoreChange(team.id, e.target.value)
                  }
                  className="w-24"
                  placeholder="Score"
                />
                <Button
                  onClick={() => submitTeamScore(team.id)}
                  disabled={
                    !teamScores[team.id] || submitting[`team-${team.id}`]
                  }
                  isLoading={submitting[`team-${team.id}`]}
                >
                  Update
                </Button>
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickScore(team.id, 1, true)}
                  disabled={submitting[`team-${team.id}-quick`]}
                >
                  +1
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickScore(team.id, 5, true)}
                  disabled={submitting[`team-${team.id}-quick`]}
                >
                  +5
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickScore(team.id, 10, true)}
                  disabled={submitting[`team-${team.id}-quick`]}
                >
                  +10
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Scores */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Player Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <div key={player.id} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{player.name}</h4>
              <div className="flex items-center space-x-2 mb-3">
                <Input
                  type="number"
                  value={playerScores[player.id] || ""}
                  onChange={(e) =>
                    handlePlayerScoreChange(player.id, e.target.value)
                  }
                  className="w-24"
                  placeholder="Score"
                />
                <Button
                  onClick={() => submitPlayerScore(player.id)}
                  disabled={
                    !playerScores[player.id] ||
                    submitting[`player-${player.id}`]
                  }
                  isLoading={submitting[`player-${player.id}`]}
                >
                  Update
                </Button>
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickScore(player.id, 1, false)}
                  disabled={submitting[`player-${player.id}-quick`]}
                >
                  +1
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickScore(player.id, 5, false)}
                  disabled={submitting[`player-${player.id}-quick`]}
                >
                  +5
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickScore(player.id, 10, false)}
                  disabled={submitting[`player-${player.id}-quick`]}
                >
                  +10
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
