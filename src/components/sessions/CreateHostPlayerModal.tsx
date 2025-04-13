import React, { useState } from "react";
import { Modal } from "@/components/ui";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { api } from "@/services/api";

interface CreateHostPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hostId: number) => void;
  sessionId?: string | number; // Still keeping this prop for flexibility
}

export function CreateHostPlayerModal({
  isOpen,
  onClose,
  onSuccess,
}: // We'll keep sessionId in the props but won't use it directly
CreateHostPlayerModalProps) {
  const [hostName, setHostName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) return;

    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Call the API to create a host player - only sending the name
      const response = await api.post("/players/host", {
        name: hostName.trim(),
        // Not sending sessionId at all, as it's optional
      });

      // Show success message
      setSuccessMessage(`Host player "${hostName}" created successfully!`);

      // Short delay to show the success message before closing
      setTimeout(() => {
        // Pass the host ID to the parent component
        onSuccess(response.data.id);
        setHostName("");
      }, 800); // Short delay so users can see the success message
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create host player"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Host Player">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <p className="text-gray-600">
            Before creating a session, you need to create a host player who will
            manage the session.
          </p>
          <div>
            <label
              htmlFor="hostName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Host Name
            </label>
            <Input
              id="hostName"
              name="hostName"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
              {successMessage}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || !hostName.trim()}>
            {isCreating ? "Creating..." : "Create Host Player"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
