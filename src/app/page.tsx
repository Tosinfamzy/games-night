"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { useSessionStore } from "@/store/sessionStore";
import { Badge } from "@/components/ui/Badge";

export default function Home() {
  const router = useRouter();
  const { games, isLoading, error, fetchGames } = useGameStore();
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { sessions, fetchSessions, createSession } = useSessionStore();

  useEffect(() => {
    fetchGames();
    fetchSessions();
  }, [fetchGames, fetchSessions]);

  const activeSessions = sessions.filter((session) => session.isActive);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Games Night
            </Link>
            <div className="flex gap-4">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create New Session
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b shadow-sm"
      >
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Welcome to Games Night
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Organize and join exciting game sessions with friends. From poker
              to chess, create the perfect game night experience.
            </p>
            <Link href="/games">
              <Button size="lg">Browse Games</Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="container mx-auto px-4 py-16"
      >
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="p-6 h-full shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Create Games
              </h3>
              <p className="text-gray-700">
                Set up your own game sessions with custom settings and invite
                your friends to join.
              </p>
            </Card>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="p-6 h-full shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Real-time Updates
              </h3>
              <p className="text-gray-700">
                Stay updated with live game status, player movements, and game
                progress.
              </p>
            </Card>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="p-6 h-full shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Multiple Game Types
              </h3>
              <p className="text-gray-700">
                Support for various game types including poker, chess, and more.
              </p>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Active Games Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white border-t shadow-sm"
      >
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Active Games</h2>
            <Link href="/games">
              <Button variant="outline">View All Games</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 shadow-sm">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-700 mb-4">{error}</p>
              <Button onClick={() => fetchGames()}>Try Again</Button>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No active games
              </h3>
              <p className="text-gray-700 mb-4">
                Be the first to create a game and invite your friends!
              </p>
              <Link href="/games">
                <Button>Create a Game</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.slice(0, 3).map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onHoverStart={() => setHoveredGame(game.id)}
                  onHoverEnd={() => setHoveredGame(null)}
                >
                  <Card className="p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {hoveredGame === game.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-blue-50/50"
                      />
                    )}
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {game.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            game.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : game.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {game.status === "active"
                            ? "In Progress"
                            : game.status === "pending"
                            ? "Waiting"
                            : "Finished"}
                        </span>
                      </div>
                      <div className="space-y-2 mb-6">
                        <p className="text-gray-700 flex items-center">
                          <span className="font-medium">Players:</span>
                          <span className="ml-2">
                            {(game.participants || []).length}/
                            {game.maxPlayers || 0}
                          </span>
                        </p>
                        <p className="text-gray-700 flex items-center">
                          <span className="font-medium">Type:</span>
                          <span className="ml-2 capitalize">
                            {game.type || "Unknown"}
                          </span>
                        </p>
                        <p className="text-gray-700 flex items-center">
                          <span className="font-medium">Host:</span>
                          <span className="ml-2">{game.createdBy}</span>
                        </p>
                      </div>
                      <Link href={`/games/${game.id}`}>
                        <Button
                          variant={
                            game.status === "pending" ? "default" : "outline"
                          }
                          className="w-full"
                          disabled={game.status !== "pending"}
                        >
                          {game.status === "pending"
                            ? "Join Game"
                            : game.status === "active"
                            ? "Game in Progress"
                            : "Game Ended"}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Active Sessions Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white border-t shadow-sm"
      >
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Active Sessions
              </h2>
              <p className="text-gray-600 mt-1">
                Currently running game sessions
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/sessions">
                <Button variant="outline">View All Sessions</Button>
              </Link>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                New Session
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : activeSessions.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {activeSessions.slice(0, 3).map((session) => (
                  <Card
                    key={session.id}
                    className="p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {session.sessionName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Started{" "}
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Games:</span>
                        <span className="ml-2">
                          {session.games?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Players:</span>
                        <span className="ml-2">
                          {session.players?.length || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => router.push(`/sessions/${session.id}`)}
                        variant="outline"
                      >
                        Join Session
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              {activeSessions.length > 3 && (
                <div className="flex justify-center mt-8">
                  <Link href="/sessions">
                    <Button variant="outline">View All Sessions</Button>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Active Sessions
              </h3>
              <p className="text-gray-600 mb-6">
                Start a new session to begin playing games with friends!
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create Your First Session
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-white border-t shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-700 mb-4 md:mb-0">
              © 2024 Games Night. All rights reserved.
            </div>
            <div className="flex gap-4">
              <Link
                href="/privacy"
                className="text-gray-700 hover:text-gray-900"
              >
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-700 hover:text-gray-900">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          const session = await createSession(data);
          setIsCreateModalOpen(false);
          router.push(`/sessions/${session.id}`);
        }}
      />
    </div>
  );
}
