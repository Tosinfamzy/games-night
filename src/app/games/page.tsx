"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { CreateGameModal } from "@/components/games/CreateGameModal";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { SessionFormData } from "@/types/session";
import { useGameStore } from "@/store/gameStore";
import { useSessionStore } from "@/store/sessionStore";
import Link from "next/link";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";

export default function GamesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] =
    useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const {
    games,
    isLoading: gamesLoading,
    error: gamesError,
    createGame,
    fetchGames,
  } = useGameStore();
  const {
    sessions,
    createSession,
    fetchSessions,
    isLoading: sessionsLoading,
    hostId,
  } = useSessionStore();

  useEffect(() => {
    fetchGames();
    fetchSessions();
  }, [fetchGames, fetchSessions]);

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || game.state === statusFilter;
    const matchesSession =
      sessionFilter === "all" ||
      game.sessions.some((session) => session.id === Number(sessionFilter));
    return matchesSearch && matchesStatus && matchesSession;
  });

  const getStatusVariant = (
    status: string | undefined
  ): "default" | "success" | "warning" | "error" | "info" => {
    switch (status) {
      case "setup":
        return "warning";
      case "in_progress":
        return "success";
      case "completed":
        return "default";
      case "cancelled":
        return "error";
      default:
        return "info";
    }
  };

  const handleAddGames = async (selectedGameIds: number[]) => {
    if (selectedSessionId) {
      try {
        // Using the API to add games to session
        await api.post(`/sessions/${selectedSessionId}/games`, {
          gameIds: selectedGameIds,
        });
        await fetchGames(); // Refresh games after adding
        setIsCreateModalOpen(false);
      } catch (error) {
        console.error("Failed to add games to session:", error);
      }
    }
  };

  const handleCreateGame = async (data: {
    name: string;
    customRules?: string;
  }) => {
    try {
      // First create the game with valid properties from CreateGameDto
      const newGame = await createGame({
        name: data.name,
        rules: data.customRules,
      });

      // If we have a sessionId, associate the game with the session
      if (selectedSessionId) {
        try {
          await api.post(`/sessions/${selectedSessionId}/games`, {
            gameIds: [newGame.id],
          });
        } catch (error) {
          console.error("Failed to associate game with session:", error);
        }
      }

      await fetchGames(); // Refresh games after creation
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  const handleCreateSession = async (sessionData: SessionFormData) => {
    try {
      // Ensure hostId is provided by using the current hostId from store if not included in form data
      const sessionWithHost = {
        ...sessionData,
        hostId: sessionData.hostId ?? hostId ?? 0,
      };

      if (!sessionWithHost.hostId) {
        throw new Error("Host ID is required to create a session");
      }

      const newSession = await createSession(sessionWithHost);
      setSelectedSessionId(String(newSession.id));
      setIsCreateSessionModalOpen(false);
      setIsCreateModalOpen(true);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  if (gamesLoading || sessionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (gamesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Error: {gamesError}</div>
      </div>
    );
  }

  const handleNavigateToGame = (gameId: number) => {
    router.push(`/games/${gameId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-white">
      <div className="flex justify-between items-center mb-8">
        <Link href={"/"}>
          <h1 className="text-3xl font-bold text-gray-900">Games</h1>
        </Link>
        <Button onClick={() => setIsCreateSessionModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New Game
        </Button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <select
          className="rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="setup">Setup</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
        >
          <option value="all">All Sessions</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.sessionName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => (
          <Card key={game.id} className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {game.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Session:{" "}
                    {game.sessions.length > 0
                      ? sessions.find((s) => s.id === game.sessions[0].id)
                          ?.sessionName || "Unknown"
                      : "No Session"}
                  </p>
                </div>
                <Badge variant={getStatusVariant(game.state)}>
                  {game.state || "unknown"}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  Round: {game.currentRound} / {game.totalRounds}
                </p>
                <p>Created: {new Date(game.createdAt).toLocaleDateString()}</p>
                {game.rules && <p className="italic">Rules: {game.rules}</p>}
              </div>
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleNavigateToGame(game.id)}
                >
                  {game.state === "setup" ? "Join Game" : "View Game"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CreateSessionModal
        isOpen={isCreateSessionModalOpen}
        onClose={() => setIsCreateSessionModalOpen(false)}
        onSubmit={handleCreateSession}
      />

      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleAddGames}
        onCreateGame={handleCreateGame}
      />
    </div>
  );
}
