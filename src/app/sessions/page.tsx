"use client";

import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { CreateHostPlayerModal } from "@/components/sessions/CreateHostPlayerModal";
import { Button } from "@/components/ui";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { SessionFormData } from "@/types/session";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SessionsPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const { sessions, createSession, fetchSessions, hostId, setHostId, error } =
    useSessionStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreateSession = async (data: SessionFormData) => {
    try {
      // Ensure hostId is provided by using the current hostId from store if not included in form data
      const sessionData = {
        ...data,
        hostId: data.hostId ?? hostId ?? 0, // Use form data hostId, fall back to store hostId, or 0 as last resort
      };

      if (!sessionData.hostId) {
        throw new Error("Host ID is required to create a session");
      }

      const newSession = await createSession(sessionData);
      setIsCreateModalOpen(false);
      router.push(`/sessions/${newSession.id}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleCreateButtonClick = () => {
    if (!hostId) {
      setIsHostModalOpen(true);
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleHostCreated = (newHostId: number) => {
    setHostId(newHostId);
    setIsHostModalOpen(false);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-gray-900">Game Sessions</h1>
          </Link>
          <Button onClick={handleCreateButtonClick}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Session
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Sessions Found
            </h2>
            <p className="text-gray-600 mb-4">
              {!hostId
                ? "Create a host player to start managing game sessions."
                : "Create your first game session to get started."}
            </p>
            <Button onClick={handleCreateButtonClick}>
              {!hostId ? "Create Host Player" : "Create New Session"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {session.sessionName}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {session.isActive ? "Active" : "Ended"} · Created{" "}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {session.isActive ? "Active" : "Ended"}
                  </span>
                </div>

                <div className="flex justify-end">
                  <Link href={`/sessions/${session.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <CreateSessionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSession}
        />

        <CreateHostPlayerModal
          isOpen={isHostModalOpen}
          onClose={() => setIsHostModalOpen(false)}
          onSuccess={handleHostCreated}
        />
      </div>
    </div>
  );
}
