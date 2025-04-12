import React, { useState } from "react";
import { BasePlayer, BaseTeam } from "@/types/session";
import { Input } from "@/components/ui/Input";

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

  const handlePlayerScoreChange = async (playerId: number, score: string) => {
    const numericScore = parseFloat(score);
    if (!isNaN(numericScore)) {
      setPlayerScores((prev) => ({ ...prev, [playerId]: numericScore }));
      await onUpdateScore(playerId, gameId, numericScore);
    }
  };

  const handleTeamScoreChange = async (teamId: number, score: string) => {
    const numericScore = parseFloat(score);
    if (!isNaN(numericScore)) {
      setTeamScores((prev) => ({ ...prev, [teamId]: numericScore }));
      await onUpdateTeamScore(teamId, gameId, numericScore);
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
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            >
              <h4 className="font-medium mb-2">{team.name}</h4>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={teamScores[team.id] || ""}
                  onChange={(e) =>
                    handleTeamScoreChange(team.id, e.target.value)
                  }
                  className="w-24"
                  placeholder="Score"
                />
                <span className="text-gray-600">points</span>
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
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={playerScores[player.id] || ""}
                  onChange={(e) =>
                    handlePlayerScoreChange(player.id, e.target.value)
                  }
                  className="w-24"
                  placeholder="Score"
                />
                <span className="text-gray-600">points</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
