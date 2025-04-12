import { useRouter } from "next/router";
import { useSessionStore } from "@/store/sessionStore";
import { ScoringSystem } from "@/components/sessions/ScoringSystem";

export default function GamePage() {
  const { query } = useRouter();
  const gameId = Number(query.gameId);
  const { currentSession, updatePlayerScore, updateTeamScore } =
    useSessionStore();

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Game Management</h1>

      {currentSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Game content */}
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

          {/* Sidebar */}
          <div>{/* Sidebar content */}</div>
        </div>
      ) : (
        <div>Loading game details...</div>
      )}
    </div>
  );
}
