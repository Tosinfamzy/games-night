import React from "react";
import { BasePlayer, BaseTeam } from "@/types/session";
import Button from "@/components/ui/Button";

interface TeamManagerProps {
  teams: BaseTeam[];
  players: BasePlayer[];
  onTeamUpdated: (team: BaseTeam) => void;
}

export function TeamManager({
  teams,
  players,
  onTeamUpdated,
}: TeamManagerProps) {
  const handleAddPlayerToTeam = (team: BaseTeam, player: BasePlayer) => {
    const updatedTeam = {
      ...team,
      players: [...team.players, player],
    };
    onTeamUpdated(updatedTeam);
  };

  const handleRemovePlayerFromTeam = (team: BaseTeam, playerId: number) => {
    const updatedTeam = {
      ...team,
      players: team.players.filter((p) => p.id !== playerId),
    };
    onTeamUpdated(updatedTeam);
  };

  const availablePlayers = players.filter(
    (player) =>
      !teams.some((team) => team.players.some((p) => p.id === player.id))
  );

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <div key={team.id} className="p-4 bg-white shadow rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-900">{team.name}</h3>
          <div className="space-y-1">
            {team.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span>{player.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePlayerFromTeam(team, player.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          {availablePlayers.length > 0 && (
            <div className="mt-4">
              <select
                className="w-full p-2 border rounded"
                onChange={(e) => {
                  const player = availablePlayers.find(
                    (p) => p.id === Number(e.target.value)
                  );
                  if (player) {
                    handleAddPlayerToTeam(team, player);
                    e.target.value = "";
                  }
                }}
                value=""
              >
                <option value="">Add player...</option>
                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
