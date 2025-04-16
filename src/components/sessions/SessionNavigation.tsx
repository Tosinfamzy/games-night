import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/Badge";
import { useSessionStore } from "@/store/sessionStore";

interface SessionNavigationProps {
  sessionId: string;
  currentGameId?: string;
  className?: string;
}

export function SessionNavigation({
  sessionId,
  currentGameId,
  className = "",
}: SessionNavigationProps) {
  const router = useRouter();
  const { currentSession, hostId } = useSessionStore();

  if (!currentSession) return null;

  const games = currentSession.games || [];
  if (games.length <= 1) return null;

  const currentIndex = currentGameId
    ? games.findIndex((game) => game.id.toString() === currentGameId)
    : -1;

  const previousGameId = currentIndex > 0 ? games[currentIndex - 1].id : null;
  const nextGameId =
    currentIndex < games.length - 1 ? games[currentIndex + 1].id : null;

  const navigateToGame = (gameId: number) => {
    router.push(`/games/${gameId}`);
  };

  const handleMoveToNextGame = async () => {
    try {
      if (hostId) {
        await fetch(`/api/sessions/${sessionId}/next-game?hostId=${hostId}`, {
          method: "POST",
        });

        if (nextGameId) {
          router.push(`/games/${nextGameId}`);
        } else {
          router.refresh();
        }
      } else {
        console.error("Host ID required to move to the next game");
      }
    } catch (error) {
      console.error("Failed to move to next game:", error);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Session Games</h3>
          <Badge variant="info">
            {currentIndex + 1} of {games.length}
          </Badge>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => previousGameId && navigateToGame(previousGameId)}
            disabled={!previousGameId}
            className="flex-1"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              nextGameId ? navigateToGame(nextGameId) : handleMoveToNextGame()
            }
            disabled={!nextGameId && !currentSession.isActive}
            className="flex-1"
          >
            Next
            <ChevronRightIcon className="h-5 w-5 ml-1" />
          </Button>
        </div>

        <div className="mt-2">
          <div className="text-sm font-medium text-gray-700 mb-2">
            All Games:
          </div>
          <div className="flex flex-wrap gap-2">
            {games.map((game, index) => (
              <Button
                key={game.id}
                size="sm"
                variant={
                  game.id.toString() === currentGameId ? "default" : "outline"
                }
                onClick={() => navigateToGame(game.id)}
                className="min-w-[2.5rem]"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
