"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { JoinSessionModal } from "@/components/sessions/JoinSessionModal";
import { Button } from "@/components/ui";
import Link from "next/link";
import { Session } from "@/types/session";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [sessionData, setSessionData] = useState<Session | null>(null);
  // We track the player ID to store in localStorage (used for session tracking)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [initialCode, setInitialCode] = useState<string | null>(null);

  // Check if there's a join code in URL
  useEffect(() => {
    if (!searchParams) return;
    const code = searchParams.get("code");
    if (code) {
      setInitialCode(code);
      setIsJoinModalOpen(true);
    }
  }, [searchParams]);

  const handleJoinSuccess = (session: Session, newPlayerId: number) => {
    setSessionData(session);
    setPlayerId(newPlayerId);
    setIsJoinModalOpen(false);
    setJoinSuccess(true);

    // Store player ID in local storage to identify this player
    localStorage.setItem("playerId", newPlayerId.toString());

    // Delay navigation to show success message
    setTimeout(() => {
      router.push(`/sessions/${session.id}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Games Night
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {joinSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Successfully Joined!
              </h2>
              <p className="text-green-700 mb-4">
                You&apos;ve joined {sessionData?.sessionName || "the session"}.
                Redirecting you...
              </p>
              <div className="animate-pulse h-2 bg-green-200 rounded mx-auto w-3/4"></div>
            </div>
          ) : (
            <div className="bg-white border rounded-lg shadow-sm p-6 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Join a Game Session
              </h1>
              <p className="text-gray-600 mb-8">
                Enter a join code to join an existing game session.
              </p>
              <Button size="lg" onClick={() => setIsJoinModalOpen(true)}>
                Enter Join Code
              </Button>
            </div>
          )}
        </div>
      </div>

      <JoinSessionModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
        initialCode={initialCode}
      />
    </div>
  );
}
