import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { api } from "@/services/api";
import { Session } from "@/types/session";

interface SessionInfo {
  id: number;
  sessionName: string;
  playerCount: number;
  isActive: boolean;
  joinCode: string;
}

interface JoinSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: Session, playerId: number) => void;
  initialCode?: string | null;
  initialSessionData?: Session | null;
  fromQrCode?: boolean; // New prop to indicate if opened from QR code scan
}

export function JoinSessionModal({
  isOpen,
  onClose,
  onSuccess,
  initialCode = null,
  initialSessionData = null,
  fromQrCode = false, // Default to false for backward compatibility
}: JoinSessionModalProps) {
  const [step, setStep] = useState<"code" | "name">(
    fromQrCode ? "name" : "code"
  );
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use initialCode and initialSessionData if provided
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setError(null);

      if (initialCode) {
        setJoinCode(initialCode);

        // If we have initial session data from the QR code
        if (initialSessionData) {
          setSessionInfo({
            id: initialSessionData.id,
            sessionName: initialSessionData.sessionName,
            playerCount: initialSessionData.playerCount || 0,
            isActive: initialSessionData.isActive,
            joinCode: initialSessionData.joinCode,
          });
          setStep("name"); // Skip to name step
        } else if (fromQrCode) {
          // If coming from QR but no session data, do the lookup immediately
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
      // First verify the session exists with this code
      const response = await api.post("/sessions/lookup", {
        joinCode: code.trim(),
      });

      setSessionInfo(response.data);
      setStep("name");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No active session found with this code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCodeCheck(joinCode);
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !joinCode.trim() || !sessionInfo) return;

    setIsLoading(true);
    setError(null);

    try {
      // First create a player
      const playerResponse = await api.post("/players", {
        name: playerName.trim(),
        type: "participant",
        sessionId: sessionInfo.id.toString(), // Add the sessionId parameter
      });

      const playerId = playerResponse.data.id;

      // Then join the session with that player
      const joinResponse = await api.post("/sessions/join", {
        joinCode: joinCode.trim(),
        playerId,
      });

      // Pass the session and player ID back to the parent component
      onSuccess(joinResponse.data, playerId);

      // Reset form
      setJoinCode("");
      setPlayerName("");
      setSessionInfo(null);
      setStep(fromQrCode ? "name" : "code"); // Stay on name step if from QR
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to join session. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    // If from QR code, closing is better than going back to code step
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

  // Modified title to make it clear when coming from QR code
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
            {error && <p className="text-sm text-red-500">{error}</p>}
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
            {error && <p className="text-sm text-red-500">{error}</p>}
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
