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
import { SessionNavigation } from "@/components/sessions/SessionNavigation";
import { JoinCodeDisplay } from "@/components/sessions/JoinCodeDisplay";
import { SessionQRCode } from "@/components/sessions/SessionQRCode";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id as string | undefined;

  if (!sessionId) {
    throw new Error("Session ID is missing.");
  }

  const [isCreateGameModalOpen, setIsCreateGameModalOpen] = useState(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [isValidatingHost, setIsValidatingHost] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    currentSession,
    isLoading: isSessionLoading,
    error: sessionError,
    fetchSession,
    endSession,
    hostId,
    setHostId,
    validateHostId,
  } = useSessionStore();

  useEffect(() => {
    let isMounted = true;

    async function checkAndFetchSession() {
      setIsValidatingHost(true);

      if (isInitialLoad) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (isMounted) setIsInitialLoad(false);
      }

      if (!isMounted) return;

      if (sessionId && hostId) {
        const isValid = await validateHostId();

        if (isValid && isMounted) {
          await fetchSession(sessionId);
          setIsHostModalOpen(false);
        } else if (isMounted) {
          console.log("Host validation failed, showing modal");
          setIsHostModalOpen(true);
        }
      } else if (sessionId && !hostId && isMounted) {
        console.log("No host ID found, showing modal");
        setIsHostModalOpen(true);
      }

      if (isMounted) setIsValidatingHost(false);
    }

    checkAndFetchSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId, fetchSession, hostId, validateHostId, isInitialLoad]);

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

    if (
      confirm(
        "Are you sure you want to complete this session? Once completed, it cannot be reactivated and no new players will be able to join."
      )
    ) {
      try {
        await endSession(sessionId);
        router.push("/sessions");
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }
  };

  if (isValidatingHost) {
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-8 text-gray-900">
            <h1 className="text-2xl font-bold mb-4">
              Validating Session Access
            </h1>
            <p className="mb-6">
              Please wait while we verify your session credentials...
            </p>
            <div className="flex justify-center">
              <div className="animate-pulse w-12 h-12 rounded-full bg-blue-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              sessionId={sessionId}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isSessionLoading) {
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-8 text-gray-900">
            <h1 className="text-2xl font-bold mb-4">Loading Session</h1>
            <p className="mb-6">
              Please wait while we load the session data...
            </p>
            <div className="flex justify-center">
              <div className="animate-pulse w-12 h-12 rounded-full bg-blue-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error Loading Session</h2>
            <p>{sessionError}</p>
            <div className="mt-4">
              <Button onClick={() => router.push("/sessions")}>
                Back to Sessions
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-8 text-gray-900">
            <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
            <p className="mb-6">
              The session you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
            <Button onClick={() => router.push("/sessions")}>
              Back to Sessions
            </Button>
          </div>
        </div>
      </div>
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
              Status: {currentSession.isActive ? "In Progress" : "Completed"} ·
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
                  Complete Session
                </Button>
              </div>
            )}
          </div>
        </div>

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
            <>
              <SessionNavigation sessionId={sessionId} className="mb-6" />
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
                          <div className="mt-1 text-gray-600">
                            {game.rules.map((rule) => (
                              <div key={rule.id} className="mb-2">
                                <p className="font-medium text-gray-900">
                                  {rule.name}
                                </p>
                                <p className="text-gray-600">
                                  {rule.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Link href={`/games/${game.id}`}>
                        <Button variant="outline">View Game</Button>
                      </Link>
                      {hostId && (
                        <Link
                          href={`/host/sessions/${sessionId}/games/${game.id}`}
                        >
                          <Button variant="outline">Manage Game</Button>
                        </Link>
                      )}
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
            </>
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

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Join Code
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <JoinCodeDisplay joinCode={currentSession.joinCode} />
            <SessionQRCode
              joinCode={currentSession.joinCode}
              sessionId={sessionId}
            />
          </div>
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
        sessionId={sessionId}
      />
    </main>
  );
}
