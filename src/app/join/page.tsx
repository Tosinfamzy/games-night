"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { JoinSessionModal } from "@/components/sessions/JoinSessionModal";
import { Button } from "@/components/ui";
import Link from "next/link";
import { Session } from "@/types/session";
import { api } from "@/services/api";

// This component handles the parts that need useSearchParams
function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [, setPlayerId] = useState<number | null>(null);
  const [initialCode, setInitialCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there's a join code in URL
  useEffect(() => {
    if (!searchParams) return;

    const code = searchParams.get("code");
    const sessionId = searchParams.get("session");

    if (code) {
      setInitialCode(code);
      setIsJoinModalOpen(true);

      // If we have both code and session ID, we can look up the session info
      if (sessionId) {
        lookupSession(code, sessionId);
      }
    }
  }, [searchParams]);

  // Look up session info when we have both code and session ID
  const lookupSession = async (code: string, sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // First try to verify the session with the join code
      const lookupResponse = await api.post("/sessions/lookup", {
        joinCode: code,
      });

      // If successful and IDs match, pre-populate the session data
      if (lookupResponse.data && lookupResponse.data.id === sessionId) {
        setSessionData(lookupResponse.data);
      }
    } catch (err) {
      console.error("Error looking up session:", err);
      setError("Unable to verify session. Please enter your details manually.");
    } finally {
      setIsLoading(false);
    }
  };

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
    <>
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
              {isLoading ? (
                <p className="text-gray-600 mb-8">
                  Verifying session information...
                </p>
              ) : error ? (
                <p className="text-red-600 mb-8">{error}</p>
              ) : initialCode ? (
                <p className="text-gray-600 mb-8">
                  Session code detected! Enter your name to join.
                </p>
              ) : (
                <p className="text-gray-600 mb-8">
                  Enter a join code to join an existing game session.
                </p>
              )}

              {!isLoading && (
                <Button size="lg" onClick={() => setIsJoinModalOpen(true)}>
                  {initialCode ? "Enter Your Name" : "Enter Join Code"}
                </Button>
              )}

              {isLoading && (
                <div className="flex justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <JoinSessionModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
        initialCode={initialCode}
        initialSessionData={sessionData}
      />
    </>
  );
}

// Loading fallback for the Suspense boundary
function JoinPageLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="bg-white border rounded-lg shadow-sm p-6 text-center">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
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

      <Suspense fallback={<JoinPageLoading />}>
        <JoinPageContent />
      </Suspense>
    </div>
  );
}
