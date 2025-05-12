import React, { useState } from "react";
import { TeamManager } from "./TeamManager";
import { BasePlayer, BaseTeam, BaseSession } from "@/types/session";
import { PlayerList } from "./PlayerList";
import { useSessionStore } from "@/store/sessionStore";

interface SessionManagerProps {
  sessionId: string;
  session: BaseSession;
}

export function SessionManager({ sessionId, session }: SessionManagerProps) {
  const [teams, setTeams] = useState<BaseTeam[]>(session.teams || []);
  const [players, setPlayers] = useState<BasePlayer[]>(session.players || []);
  const { createTeam, createRandomTeams } = useSessionStore();

  const handlePlayerAdded = (newPlayer: BasePlayer) => {
    setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
  };

  const handleTeamUpdated = (updatedTeam: BaseTeam) => {
    setTeams((prevTeams) =>
      prevTeams.map((team) => (team.id === updatedTeam.id ? updatedTeam : team))
    );
  };

  const handleTeamCreated = async (teamName: string): Promise<BaseTeam> => {
    if (players.length < 4) {
      throw new Error(
        "You need at least 4 players in the session to create teams."
      );
    }

    const newTeam = await createTeam(sessionId, teamName);
    setTeams((prevTeams) => [...prevTeams, newTeam]);
    return newTeam;
  };

  const handleTeamsRandomized = async (): Promise<BaseTeam[]> => {
    if (players.length < 4) {
      throw new Error(
        "You need at least 4 players in the session to create random teams."
      );
    }

    const updatedSession = await createRandomTeams(sessionId, {
      numberOfTeams: 2,
    });
    if (updatedSession && updatedSession.teams) {
      setTeams(updatedSession.teams);
      return updatedSession.teams;
    }
    return [];
  };

  if (!session) {
    return <div className="text-gray-900">Session not found</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">
        {session.sessionName}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Players</h2>
          <PlayerList
            sessionId={sessionId}
            players={players}
            onPlayerAdded={handlePlayerAdded}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Teams</h2>
          <TeamManager
            teams={teams}
            players={players}
            onTeamUpdated={handleTeamUpdated}
            onTeamCreated={handleTeamCreated}
            onTeamsRandomized={handleTeamsRandomized}
            sessionId={sessionId}
            hostId={session.hostId}
          />
        </div>
      </div>
    </div>
  );
}
