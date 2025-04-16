"use client";

import { useParams } from "next/navigation";
import { useSessionStore } from "@/store/sessionStore";
import { ScoringSystem } from "@/components/sessions/ScoringSystem";

export default function GamePage() {
  const params = useParams();
  const gameId = params?.gameId ? Number(params.gameId) : 0;
  const { currentSession, updatePlayerScore, updateTeamScore } =
    useSessionStore();

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Game Management</h1>

      {currentSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Scoring</h3>
                <ScoringSystem
                  teams={currentSession.teams || []}
                  players={currentSession.players || []}
                  gameId={gameId}
                  onUpdateScore={(playerId, gameId, points) =>
                    updatePlayerScore(playerId, gameId, points)
                  }
                  onUpdateTeamScore={(teamId, gameId, points) =>
                    updateTeamScore(teamId, gameId, points)
                  }
                />
              </div>
            </div>
          </div>

          <div></div>
        </div>
      ) : (
        <div>Loading game details...</div>
      )}
    </div>
  );
}
