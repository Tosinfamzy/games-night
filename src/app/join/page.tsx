"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { JoinSessionModal } from "@/components/sessions/JoinSessionModal";
import { Button } from "@/components/ui";
import Link from "next/link";
import { Session } from "@/types/session";
import { api } from "@/services/api";
import axios, { AxiosError } from "axios";

// Define the API error response structure
interface ApiErrorResponse {
  message?: string;
  error?: string;
}

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
  const [isFromQrCode, setIsFromQrCode] = useState(false);

  useEffect(() => {
    if (!searchParams) return;

    const code = searchParams.get("code");
    const sessionId = searchParams.get("session");
    const qrSource = searchParams.get("source") === "qr";

    if (code) {
      setInitialCode(code);
      setIsJoinModalOpen(true);
      setIsFromQrCode(qrSource);

      if (sessionId) {
        lookupSession(code, sessionId);
      }
    }
  }, [searchParams]);

  const lookupSession = async (code: string, sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const lookupResponse = await api.post("/sessions/lookup", {
        joinCode: code.trim(),
      });

      // Compare session IDs as strings to avoid issues with parsing
      const responseId = lookupResponse.data?.id?.toString();
      const requestedId = sessionId?.toString();

      if (lookupResponse.data && responseId === requestedId) {
        if (!lookupResponse.data.isActive) {
          console.log("Session active status:", lookupResponse.data.isActive);
          console.log("Session data:", lookupResponse.data);
          setError(
            `This session is no longer active. (Session ID: ${responseId}, Status: ${
              lookupResponse.data.status || "unknown"
            })`
          );
          return;
        }
        setSessionData(lookupResponse.data);
      } else {
        console.log(
          "Session ID mismatch. Response:",
          responseId,
          "Requested:",
          requestedId
        );
        console.log("Full response data:", lookupResponse.data);
        setError(
          "Session information doesn't match. Please check the QR code and try again."
        );
      }
    } catch (err: unknown) {
      console.error("Error looking up session:", err);
      let errorMessage =
        "Unable to verify session. Please enter your details manually.";

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSuccess = (session: Session, newPlayerId: number) => {
    setSessionData(session);
    setPlayerId(newPlayerId);
    setIsJoinModalOpen(false);
    setJoinSuccess(true);

    localStorage.setItem("playerId", newPlayerId.toString());
    localStorage.setItem("sessionId", session.id.toString());

    setTimeout(() => {
      router.push(`/players/${newPlayerId}`);
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
                Redirecting you to your player dashboard...
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
        fromQrCode={isFromQrCode}
      />
    </>
  );
}

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
