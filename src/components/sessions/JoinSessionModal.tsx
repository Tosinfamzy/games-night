import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { api } from "@/services/api";
import { Session } from "@/types/session";
import axios, { AxiosError } from "axios";

interface SessionInfo {
  id: number;
  sessionName: string;
  playerCount: number;
  isActive: boolean; // true = IN_PROGRESS, false = COMPLETED
  status?: string; // "active" or "completed"
  joinCode: string;
}

interface Player {
  id: number;
  name: string;
}

// Define the API error response structure
interface ApiErrorResponse {
  message?: string;
  error?: string;
}

// Helper function to extract error messages from API responses
const getApiErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError<ApiErrorResponse>;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      "An unknown API error occurred"
    );
  } else if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred";
};

// API call functions
async function lookupSessionByCode(code: string): Promise<SessionInfo> {
  try {
    const response = await api.post("/sessions/lookup", {
      joinCode: code.trim(),
    });
    console.log("Session lookup response:", response.data);
    if (!response.data) {
      throw new Error("No session found with this code.");
    }
    return response.data as SessionInfo;
  } catch (err) {
    console.error("Session lookup error:", err);
    throw new Error(getApiErrorMessage(err));
  }
}

async function createPlayerInSession(
  name: string,
  sessionId: string
): Promise<Player> {
  const payload = { name, sessionId };
  console.log(
    "createPlayerInSession: Sending payload to POST /players:",
    JSON.stringify(payload, null, 2)
  );
  try {
    const response = await api.post("/players", payload);
    console.log(
      "createPlayerInSession: Received response from POST /players:",
      response.data
    );
    if (!response.data || !response.data.id) {
      throw new Error("Player data not found in response");
    }
    return response.data;
  } catch (error) {
    console.error("createPlayerInSession: Error from POST /players:", error);
    throw new Error(getApiErrorMessage(error));
  }
}

async function joinSessionWithPlayer(
  joinCode: string,
  playerId: number
): Promise<Session> {
  try {
    const response = await api.post("/sessions/join", {
      joinCode: joinCode.trim(),
      playerId,
    });
    console.log("Join session response:", response.data);
    return response.data as Session;
  } catch (err) {
    console.error("Join session error:", err);
    throw new Error(getApiErrorMessage(err));
  }
}

async function cleanupPlayer(playerId: number): Promise<void> {
  try {
    await api.delete(`/players/${playerId}`);
    console.log(`Player ${playerId} cleaned up successfully.`);
  } catch (err) {
    console.error("Failed to clean up player after join error:", err);
    // We don't re-throw here as this is a cleanup operation
  }
}

interface JoinSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: Session, playerId: number) => void;
  initialCode?: string | null;
  initialSessionData?: Session | null;
  fromQrCode?: boolean;
}

export function JoinSessionModal({
  isOpen,
  onClose,
  onSuccess,
  initialCode = null,
  initialSessionData = null,
  fromQrCode = false,
}: JoinSessionModalProps) {
  const [step, setStep] = useState<"code" | "name">(
    fromQrCode ? "name" : "code"
  );
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerIdForCleanup, setPlayerIdForCleanup] = useState<number | null>(
    null
  );
  const playerToCleanupOnUnmountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);

    if (initialCode) {
      setJoinCode(initialCode);
      setPlayerName("");

      if (initialSessionData) {
        setSessionInfo({
          id: initialSessionData.id,
          sessionName: initialSessionData.sessionName,
          playerCount: initialSessionData.playerCount || 0,
          isActive: initialSessionData.isActive,
          joinCode: initialSessionData.joinCode,
        });
        setStep("name");
      } else if (fromQrCode) {
        setSessionInfo(null);
        handleCodeCheck(initialCode);
      } else {
        setSessionInfo(null);
        setStep("code");
      }
    } else if (initialSessionData) {
      setJoinCode(initialSessionData.joinCode);
      setPlayerName("");
      setSessionInfo({
        id: initialSessionData.id,
        sessionName: initialSessionData.sessionName,
        playerCount: initialSessionData.playerCount || 0,
        isActive: initialSessionData.isActive,
        joinCode: initialSessionData.joinCode,
      });
      setStep("name");
    } else {
      setJoinCode("");
      setPlayerName("");
      setSessionInfo(null);
      setStep(fromQrCode ? "name" : "code");
    }
  }, [isOpen, initialCode, initialSessionData, fromQrCode]);

  useEffect(() => {
    playerToCleanupOnUnmountRef.current = playerIdForCleanup;
  }, [playerIdForCleanup]);

  useEffect(() => {
    return () => {
      if (playerToCleanupOnUnmountRef.current) {
        console.log(
          `JoinSessionModal unmounting. Cleaning up player ID: ${playerToCleanupOnUnmountRef.current}`
        );
        cleanupPlayer(playerToCleanupOnUnmountRef.current);
      }
    };
  }, []);

  const handleCodeCheck = async (code: string) => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const sessionData = await lookupSessionByCode(code);

      if (!sessionData.isActive) {
        console.log(
          "Session reports as inactive but proceeding with join process"
        );
        console.log("Session active status:", sessionData.isActive);
        console.log("Session status:", sessionData.status);
      }

      setSessionInfo(sessionData);
      setStep("name");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No session found with this code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCodeCheck(joinCode);
  };

  const validatePlayerName = (
    name: string
  ): { valid: boolean; message?: string } => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { valid: false, message: "Name cannot be empty" };
    }
    if (trimmedName.length < 2) {
      return { valid: false, message: "Name must be at least 2 characters" };
    }
    if (trimmedName.length > 20) {
      return { valid: false, message: "Name must be 20 characters or less" };
    }
    if (!/^[a-zA-Z0-9\s._-]+$/.test(trimmedName)) {
      return {
        valid: false,
        message:
          "Name can only contain letters, numbers, spaces, and simple punctuation",
      };
    }
    return { valid: true };
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionInfo) return;

    const trimmedName = playerName.trim();
    const nameValidation = validatePlayerName(trimmedName);

    if (!nameValidation.valid) {
      setError(nameValidation.message || "Invalid name");
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log(
      `Attempting to create player: Name='${trimmedName}', SessionID='${
        sessionInfo.id
      }', SessionIDType='${typeof sessionInfo.id}'`
    );
    console.log(
      "Full sessionInfo for player creation:",
      JSON.stringify(sessionInfo, null, 2)
    );

    let createdPlayerId: number | null = null;

    try {
      const playerResponse = await createPlayerInSession(
        trimmedName,
        sessionInfo.id.toString()
      );
      createdPlayerId = playerResponse.id;
      setPlayerIdForCleanup(createdPlayerId);

      const joinedSession = await joinSessionWithPlayer(
        joinCode.trim() || sessionInfo.joinCode,
        createdPlayerId
      );

      onSuccess(joinedSession, createdPlayerId);

      setPlayerIdForCleanup(null);
      setJoinCode("");
      setPlayerName("");
      setSessionInfo(null);
      setStep(fromQrCode ? "name" : "code");
      setError(null);
    } catch (err: unknown) {
      if (createdPlayerId) {
        await cleanupPlayer(createdPlayerId);
      }

      let errorMessage = "Failed to join session. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (errorMessage.toLowerCase().includes("name may already be taken")) {
          errorMessage =
            "This name is already taken in the session. Please try another name.";
        }
      }

      setError(errorMessage);
      console.error("Join session error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    if (fromQrCode) {
      handleClose();
    } else {
      setStep("code");
      setSessionInfo(null);
      setError(null);
    }
  };

  const handleClose = () => {
    setError(null);
    setJoinCode("");
    setPlayerName("");
    setSessionInfo(null);
    setStep(fromQrCode && initialCode ? "name" : "code");
    setIsLoading(false);
    onClose();
  };

  const modalTitle = fromQrCode ? "Enter Your Name to Join" : "Join Session";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      {step === "code" ? (
        <form onSubmit={handleCodeSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              Enter the join code provided by the session host.
            </p>
            <div>
              <label
                htmlFor="joinCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Join Code
              </label>
              <Input
                id="joinCode"
                name="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter the join code (e.g., ABC123)"
                className="uppercase"
                required
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !joinCode.trim()}>
              {isLoading ? "Verifying..." : "Next"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePlayerSubmit} className="space-y-6">
          <div className="space-y-4">
            {sessionInfo && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-900">
                  {sessionInfo.sessionName || "Game Session"}
                </p>
                <p className="text-sm text-gray-500">
                  {sessionInfo.playerCount || 0} players in session
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="playerName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Name
              </label>
              <Input
                id="playerName"
                name="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
                autoFocus
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t">
            {!fromQrCode && (
              <Button type="button" variant="outline" onClick={handleBackClick}>
                Back
              </Button>
            )}
            {fromQrCode && (
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !playerName.trim()}
              className={fromQrCode ? "ml-auto" : ""}
            >
              {isLoading ? "Joining..." : "Join Session"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
