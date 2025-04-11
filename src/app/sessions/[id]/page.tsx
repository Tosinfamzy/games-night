"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { CreateGameModal } from "@/components/games/CreateGameModal";
import { useSessionStore } from "@/store/sessionStore";
import Link from "next/link";
import { api } from "@/services/api";
import { SessionManager } from "@/components/sessions/SessionManager";
import { GameFormData } from "@/types/game";
import { CreateHostPlayerModal } from "@/components/sessions/CreateHostPlayerModal";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const [isCreateGameModalOpen, setIsCreateGameModalOpen] = useState(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const {
    currentSession,
    isLoading: isSessionLoading,
    error: sessionError,
    fetchSession,
    endSession,
    hostId,
    setHostId,
  } = useSessionStore();

  useEffect(() => {
    if (sessionId && hostId) {
      fetchSession(sessionId);
    } else if (sessionId && !hostId) {
      setIsHostModalOpen(true);
    }
  }, [sessionId, fetchSession, hostId]);

  const handleHostCreated = (newHostId: number) => {
    setHostId(newHostId);
    setIsHostModalOpen(false);
    fetchSession(sessionId);
  };

  const handleAddGames = async (selectedGameIds: number[]) => {
    if (!hostId) {
      setIsHostModalOpen(true);
      return;
    }

    try {
      await api.post(`/sessions/${sessionId}/games`, {
        gameIds: selectedGameIds,
        hostId: hostId,
      });
      await fetchSession(sessionId);
      setIsCreateGameModalOpen(false);
    } catch (error) {
      console.error("Failed to add games:", error);
    }
  };

  const handleCreateGame = async (gameData: GameFormData) => {
    if (!hostId) {
      setIsHostModalOpen(true);
      return;
    }

    try {
      await api.post("/games", { ...gameData, sessionId, hostId });
      await fetchSession(sessionId);
      setIsCreateGameModalOpen(false);
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  const handleStartGame = async (gameId: number) => {
    if (!hostId) {
      setIsHostModalOpen(true);
      return;
    }

    try {
      await api.post(`/games/${gameId}/start`, { hostId });
      await fetchSession(sessionId);
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  const handleEndGame = async (gameId: number) => {
    if (!hostId) {
      setIsHostModalOpen(true);
      return;
    }

    if (confirm("Are you sure you want to end this game?")) {
      try {
        await api.post(`/games/${gameId}/end`, { hostId });
        await fetchSession(sessionId);
      } catch (error) {
        console.error("Failed to end game:", error);
      }
    }
  };

  const handleEndSession = async () => {
    if (!hostId) {
      setIsHostModalOpen(true);
      return;
    }

    if (confirm("Are you sure you want to end this session?")) {
      try {
        await endSession(sessionId);
        router.push("/sessions");
      } catch (error) {
        console.error("Failed to end session:", error);
      }
    }
  };

  if (!hostId) {
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-8 text-gray-900">
            <h1 className="text-2xl font-bold mb-4">Host Player Required</h1>
            <p className="mb-6">
              You need to create a host player before accessing this session.
            </p>
            <Button onClick={() => setIsHostModalOpen(true)}>
              Create Host Player
            </Button>

            <CreateHostPlayerModal
              isOpen={isHostModalOpen}
              onClose={() => router.push("/sessions")}
              onSuccess={handleHostCreated}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isSessionLoading) {
    return (
      <div className="text-center py-8 text-gray-900">Loading session...</div>
    );
  }

  if (sessionError) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        {sessionError}
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="text-center py-8 text-gray-900">Session not found</div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {currentSession.sessionName}
            </h1>
            <p className="text-gray-600 mt-2">
              Status: {currentSession.isActive ? "Active" : "Inactive"} ·
              Created {new Date(currentSession.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            {currentSession.isActive && (
              <div key="session-actions">
                <Button
                  onClick={() => setIsCreateGameModalOpen(true)}
                  variant="outline"
                >
                  Add Games
                </Button>
                <Button onClick={handleEndSession} variant="outline">
                  End Session
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Session Management Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Session Management
          </h2>
          <SessionManager sessionId={sessionId} session={currentSession} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Games in this Session
          </h2>
          {currentSession.games && currentSession.games.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {currentSession.games.map((game) => (
                <div key={game.id} className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    {game.name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>State: {game.state}</p>
                    {game.rules && (
                      <div>
                        <p className="font-medium text-gray-900">Rules:</p>
                        <p className="mt-1 text-gray-600">{game.rules}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Link href={`/games/${game.id}`}>
                      <Button variant="outline">View Game</Button>
                    </Link>
                    {currentSession.isActive && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleStartGame(game.id)}
                          disabled={game.state !== "ready"}
                        >
                          Start Game
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleEndGame(game.id)}
                          disabled={game.state !== "in_progress"}
                        >
                          End Game
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No games added to this session yet.
              {currentSession.isActive && (
                <div className="mt-4">
                  <Button onClick={() => setIsCreateGameModalOpen(true)}>
                    Add Your First Game
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <CreateGameModal
        isOpen={isCreateGameModalOpen}
        onClose={() => setIsCreateGameModalOpen(false)}
        onSubmit={handleAddGames}
        onCreateGame={handleCreateGame}
      />

      <CreateHostPlayerModal
        isOpen={isHostModalOpen}
        onClose={() => router.push("/sessions")}
        onSuccess={handleHostCreated}
      />
    </main>
  );
}
