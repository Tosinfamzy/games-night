import React, { useState } from "react";
import { BasePlayer, BaseTeam } from "@/types/session";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/services/api";

interface TeamManagerProps {
  teams: BaseTeam[];
  players: BasePlayer[];
  onTeamUpdated: (team: BaseTeam) => void;
  onTeamCreated?: (teamName: string) => Promise<BaseTeam>;
  onTeamsRandomized?: () => Promise<BaseTeam[]>;
  sessionId: string;
  /**
   * The host ID is required for team creation and team randomization.
   * API endpoints will return a 400 error if this is missing or not a number.
   */
  hostId?: number;
}

export function TeamManager({
  teams,
  players,
  onTeamUpdated,
  onTeamCreated,
  onTeamsRandomized,
  sessionId,
  hostId,
}: TeamManagerProps) {
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isRandomizingTeams, setIsRandomizingTeams] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState<number | null>(null);
  const [isRemovingPlayer, setIsRemovingPlayer] = useState<string | null>(null);

  const handleAddPlayerToTeam = async (team: BaseTeam, player: BasePlayer) => {
    setIsAddingPlayer(player.id);
    try {
      if (!onTeamUpdated) {
        await api.put(`/sessions/teams/${team.id}/players`, {
          playerId: player.id,
        });
      }

      const updatedTeam = {
        ...team,
        players: [...team.players, player],
      };
      onTeamUpdated(updatedTeam);
    } catch (error) {
      console.error("Failed to add player to team:", error);
      setTeamError(
        error instanceof Error ? error.message : "Failed to add player to team"
      );
    } finally {
      setIsAddingPlayer(null);
    }
  };

  const handleRemovePlayerFromTeam = async (
    team: BaseTeam,
    playerId: number
  ) => {
    setIsRemovingPlayer(`${team.id}-${playerId}`);
    try {
      if (!onTeamUpdated) {
        await api.delete(`/sessions/teams/${team.id}/players/${playerId}`);
      }

      const updatedTeam = {
        ...team,
        players: team.players.filter((p) => p.id !== playerId),
      };
      onTeamUpdated(updatedTeam);
    } catch (error) {
      console.error("Failed to remove player from team:", error);
      setTeamError(
        error instanceof Error
          ? error.message
          : "Failed to remove player from team"
      );
    } finally {
      setIsRemovingPlayer(null);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setTeamError("Team name is required");
      return;
    }

    if (!onTeamCreated && !sessionId) {
      setTeamError("Team creation is not available");
      return;
    }

    if (!hostId) {
      setTeamError("Host ID is required to create a team");
      return;
    }

    setTeamError(null);
    setIsCreatingTeam(true);

    try {
      if (onTeamCreated) {
        await onTeamCreated(newTeamName);
      } else {
        await api.post(`/sessions/${sessionId}/teams`, {
          name: newTeamName,
          hostId: Number(hostId),
        });
      }
      setNewTeamName("");
    } catch (error) {
      setTeamError(
        error instanceof Error ? error.message : "Failed to create team"
      );
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleRandomizeTeams = async () => {
    if (!sessionId) {
      setTeamError("Session ID is required to randomize teams");
      return;
    }

    if (!hostId) {
      setTeamError(
        "Host ID is required to randomize teams. Please create a host player first."
      );
      return;
    }

    setTeamError(null);
    setIsRandomizingTeams(true);

    try {
      if (onTeamsRandomized) {
        await onTeamsRandomized();
      } else {
        await api.post(
          `/sessions/${sessionId}/teams/random`,
          {},
          {
            params: { hostId: Number(hostId) },
          }
        );
      }
    } catch (error) {
      console.error("Error randomizing teams:", error);
      if (error instanceof Error && error.message.includes("hostId")) {
        setTeamError("Failed to randomize teams: Host ID is required");
      } else {
        setTeamError(
          error instanceof Error ? error.message : "Failed to randomize teams"
        );
      }
    } finally {
      setIsRandomizingTeams(false);
    }
  };

  const availablePlayers = players.filter(
    (player) =>
      !teams.some((team) => team.players.some((p) => p.id === player.id))
  );

  const canCreateTeam = players.length >= 4 && availablePlayers.length >= 2;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 mb-4">
        {players.length >= 4 && teams.length === 0 && (
          <>
            <Button
              onClick={handleRandomizeTeams}
              disabled={isRandomizingTeams || !hostId}
              variant="outline"
              title={
                !hostId ? "Host ID is required to create random teams" : ""
              }
            >
              {isRandomizingTeams ? "Creating..." : "Create Random Teams"}
            </Button>
            {!hostId && (
              <div className="w-full mt-2 text-sm text-amber-600">
                Host ID is required to create random teams.
              </div>
            )}
          </>
        )}
      </div>

      {teams.map((team) => (
        <div
          key={team.id}
          className="p-4 bg-white shadow rounded-lg space-y-2 text-gray-900"
        >
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
                  disabled={isRemovingPlayer === `${team.id}-${player.id}`}
                >
                  {isRemovingPlayer === `${team.id}-${player.id}`
                    ? "Removing..."
                    : "Remove"}
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
                disabled={isAddingPlayer !== null}
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
        <div className="mt-6 p-4 border rounded-lg text-gray-900">
          <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
          {teamError && (
            <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-md">
              {teamError}
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-900">
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
