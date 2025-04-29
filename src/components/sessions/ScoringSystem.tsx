import React, { useState, useEffect } from "react";
import { BasePlayer, BaseTeam } from "@/types/session";
import { Input } from "@/components/ui/Input";
import { wsService } from "@/lib/websocket";
import { useWebSocket } from "@/components/providers/WebSocketProvider";
import { Button } from "../ui";
import { Badge } from "@/components/ui/Badge";

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
  const [feedback, setFeedback] = useState<
    Record<string, { message: string; type: "success" | "error" }>
  >({});
  const { connected } = useWebSocket();

  // Clear feedback messages after a delay
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    Object.keys(feedback).forEach((key) => {
      const timeout = setTimeout(() => {
        setFeedback((prev) => {
          const newFeedback = { ...prev };
          delete newFeedback[key];
          return newFeedback;
        });
      }, 3000);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [feedback]);

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

    const feedbackKey = `player-${playerId}`;
    setSubmitting((prev) => ({ ...prev, [feedbackKey]: true }));
    setFeedback({});

    try {
      if (connected) {
        wsService.updatePlayerScore(playerId, gameId, score);
      }

      await onUpdateScore(playerId, gameId, score);

      setPlayerScores((prev) => ({ ...prev, [playerId]: 0 }));
      setFeedback((prev) => ({
        ...prev,
        [feedbackKey]: {
          message: `Added ${score} points successfully!`,
          type: "success",
        },
      }));
    } catch (error) {
      console.error("Failed to update score:", error);
      setFeedback((prev) => ({
        ...prev,
        [feedbackKey]: {
          message: "Failed to update score",
          type: "error",
        },
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [feedbackKey]: false }));
    }
  };

  const submitTeamScore = async (teamId: number) => {
    const score = teamScores[teamId];
    if (!score) return;

    const feedbackKey = `team-${teamId}`;
    setSubmitting((prev) => ({ ...prev, [feedbackKey]: true }));
    setFeedback({});

    try {
      if (connected) {
        wsService.updateTeamScore(teamId, gameId, score);
      }

      await onUpdateTeamScore(teamId, gameId, score);

      setTeamScores((prev) => ({ ...prev, [teamId]: 0 }));
      setFeedback((prev) => ({
        ...prev,
        [feedbackKey]: {
          message: `Added ${score} points successfully!`,
          type: "success",
        },
      }));
    } catch (error) {
      console.error("Failed to update team score:", error);
      setFeedback((prev) => ({
        ...prev,
        [feedbackKey]: {
          message: "Failed to update score",
          type: "error",
        },
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [feedbackKey]: false }));
    }
  };

  const quickScore = async (
    entityId: number,
    points: number,
    isTeam: boolean
  ) => {
    const submittingKey = isTeam
      ? `team-${entityId}-quick`
      : `player-${entityId}-quick`;

    const feedbackKey = isTeam ? `team-${entityId}` : `player-${entityId}`;

    setSubmitting((prev) => ({ ...prev, [submittingKey]: true }));
    setFeedback({});

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

      setFeedback((prev) => ({
        ...prev,
        [feedbackKey]: {
          message: `Added ${points} points successfully!`,
          type: "success",
        },
      }));
    } catch (error) {
      console.error(
        `Failed to update ${isTeam ? "team" : "player"} score:`,
        error
      );
      setFeedback((prev) => ({
        ...prev,
        [feedbackKey]: {
          message: "Failed to update score",
          type: "error",
        },
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [submittingKey]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Team Scores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">{team.name}</h4>
                <Badge variant="info">Current: {team.score || 0} points</Badge>
              </div>

              {feedback[`team-${team.id}`] && (
                <div
                  className={`p-2 rounded text-sm mb-2 ${
                    feedback[`team-${team.id}`].type === "success"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {feedback[`team-${team.id}`].message}
                </div>
              )}

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

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Player Scores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <div key={player.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">{player.name}</h4>
                <Badge variant="info">
                  Current: {player.score || 0} points
                </Badge>
              </div>

              {feedback[`player-${player.id}`] && (
                <div
                  className={`p-2 rounded text-sm mb-2 ${
                    feedback[`player-${player.id}`].type === "success"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {feedback[`player-${player.id}`].message}
                </div>
              )}

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
