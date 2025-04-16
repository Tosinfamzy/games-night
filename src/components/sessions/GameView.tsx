import { useState } from "react";
import { ScoringSystem } from "@/components/sessions/ScoringSystem";
import { useSessionStore } from "@/store/sessionStore";
import { BasePlayer, BaseTeam } from "@/types/session";

interface GameViewProps {
  game: { id: number; name: string };
  players: BasePlayer[];
  teams: BaseTeam[];
}

export function GameView({ game, players, teams }: GameViewProps) {
  const [activeTab, setActiveTab] = useState<string>("players");
  const { updatePlayerScore, updateTeamScore } = useSessionStore();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{game.name}</h2>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            className={`${
              activeTab === "players"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab("players")}
          >
            Players
          </button>
          <button
            className={`${
              activeTab === "scoring"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab("scoring")}
          >
            Scoring
          </button>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === "scoring" && (
          <ScoringSystem
            teams={teams}
            players={players}
            gameId={game.id}
            onUpdateScore={(playerId, gameId, points) =>
              updatePlayerScore(playerId, gameId, points)
            }
            onUpdateTeamScore={(teamId, gameId, points) =>
              updateTeamScore(teamId, gameId, points)
            }
          />
        )}
        {activeTab === "players" && (
          <ul>
            {players.map((player) => (
              <li key={player.id}>
                {player.name} - Score: {player.score}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
