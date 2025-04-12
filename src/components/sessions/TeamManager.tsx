import React, { useState } from "react";
import { BasePlayer, BaseTeam } from "@/types/session";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TeamManagerProps {
  teams: BaseTeam[];
  players: BasePlayer[];
  onTeamUpdated: (team: BaseTeam) => void;
  onTeamCreated?: (teamName: string) => Promise<BaseTeam>;
  sessionId: string;
}

export function TeamManager({
  teams,
  players,
  onTeamUpdated,
  onTeamCreated,
}: TeamManagerProps) {
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

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

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setTeamError("Team name is required");
      return;
    }

    if (!onTeamCreated) {
      setTeamError("Team creation is not available");
      return;
    }

    setTeamError(null);
    setIsCreatingTeam(true);

    try {
      await onTeamCreated(newTeamName);
      setNewTeamName("");
      setIsCreatingTeam(false);
    } catch (error) {
      setTeamError(
        error instanceof Error ? error.message : "Failed to create team"
      );
      setIsCreatingTeam(false);
    }
  };

  const availablePlayers = players.filter(
    (player) =>
      !teams.some((team) => team.players.some((p) => p.id === player.id))
  );

  const canCreateTeam = players.length >= 4 && availablePlayers.length >= 2;

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

      {canCreateTeam && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
          {teamError && (
            <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-md">
              {teamError}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Team Name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleCreateTeam}
              disabled={isCreatingTeam || !newTeamName.trim()}
            >
              {isCreatingTeam ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </div>
      )}

      {!canCreateTeam && players.length >= 4 && (
        <div className="mt-2 p-4 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500">
            You need at least 2 available players to create a team.
          </p>
        </div>
      )}

      {!canCreateTeam && players.length < 4 && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <p className="text-gray-600">
            You need at least 4 players in the session to create teams.
            {players.length > 0 && (
              <>
                {" "}
                Currently have {players.length} player
                {players.length !== 1 ? "s" : ""}.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
