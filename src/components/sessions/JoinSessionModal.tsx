import React, { useState, useEffect } from "react";
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

// Define the API error response structure
interface ApiErrorResponse {
  message?: string;
  error?: string;
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

  useEffect(() => {
    if (isOpen) {
      setError(null);

      if (initialCode) {
        setJoinCode(initialCode);

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
          handleCodeCheck(initialCode);
        }
      }
    }
  }, [initialCode, initialSessionData, isOpen, fromQrCode]);

  const handleCodeCheck = async (code: string) => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/sessions/lookup", {
        joinCode: code.trim(),
      });

      console.log("Session lookup response:", response.data);

      if (!response.data) {
        setError("No session found with this code.");
        return;
      }
      if (!response.data.isActive) {
        console.log(
          "Session reports as inactive but proceeding with join process"
        );
        console.log("Session active status:", response.data.isActive);
        console.log("Session status:", response.data.status);
      }

      setSessionInfo(response.data);
      setStep("name");
    } catch (err: unknown) {
      let errorMessage = "No session found with this code";

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          axiosError.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error("Session lookup error:", err);
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

    try {
      // Try to create the player
      let playerResponse;
      try {
        playerResponse = await api.post("/players", {
          name: trimmedName,
          type: "participant",
          sessionId: sessionInfo.id.toString(),
        });
      } catch (playerErr: unknown) {
        let playerErrMsg = "Failed to create player profile";
        if (axios.isAxiosError(playerErr)) {
          const axiosError = playerErr as AxiosError<ApiErrorResponse>;
          playerErrMsg =
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            "Name may already be taken or session may be full";
          console.error("Player creation error:", axiosError.response?.data);
        }
        throw new Error(playerErrMsg);
      }

      const playerId = playerResponse.data.id;

      // Now try to join the session
      let joinResponse;
      try {
        joinResponse = await api.post("/sessions/join", {
          joinCode: joinCode.trim(),
          playerId,
        });
      } catch (joinErr: unknown) {
        // If we fail to join, we should clean up the created player
        try {
          await api.delete(`/players/${playerId}`);
        } catch (cleanupErr) {
          console.error(
            "Failed to clean up player after join error:",
            cleanupErr
          );
        }
        throw joinErr;
      }

      onSuccess(joinResponse.data, playerId);

      setJoinCode("");
      setPlayerName("");
      setSessionInfo(null);
      setStep(fromQrCode ? "name" : "code");
    } catch (err: unknown) {
      // Extract detailed error message
      let errorMessage = "Failed to join session. Please try again.";

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;

        if (axiosError.response?.data) {
          errorMessage =
            axiosError.response.data.message ||
            axiosError.response.data.error ||
            errorMessage;

          // Special handling for common errors
          if (axiosError.response.status === 400) {
            const errorData = axiosError.response.data;
            const errorDataStr = typeof errorData === "string" ? errorData : "";
            const errorDataMsg = errorData?.message || "";
            const errorDataErr = errorData?.error || "";

            if (
              errorDataMsg.includes("name") ||
              errorDataErr.includes("name") ||
              errorDataStr.includes("name")
            ) {
              errorMessage =
                "This name is already taken in the session. Please try another name.";
            }
          }
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
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
    setJoinCode("");
    setPlayerName("");
    setSessionInfo(null);
    setError(null);
    setStep(fromQrCode ? "name" : "code");
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
