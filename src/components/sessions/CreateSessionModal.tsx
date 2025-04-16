import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { SessionFormData } from "@/types/session";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sessionData: SessionFormData) => void;
  hostId?: number | null;
}

export function CreateSessionModal({
  isOpen,
  onClose,
  onSubmit,
  hostId,
}: CreateSessionModalProps) {
  const [formData, setFormData] = useState<SessionFormData>({
    sessionName: "",
    isActive: true,
  });
  const [isNewHost, setIsNewHost] = useState(false);

  useEffect(() => {
    if (isOpen && hostId) {
      setIsNewHost(true);
      const timer = setTimeout(() => setIsNewHost(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hostId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      hostId: hostId ?? undefined,
    });
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Session">
      <form onSubmit={handleSubmit} className="space-y-6">
        {isNewHost && hostId && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 animate-pulse">
            <p>
              Host player created successfully! Now create your first game
              session.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Session Name"
            name="sessionName"
            value={formData.sessionName}
            onChange={handleInputChange}
            placeholder="Enter a name for your game night session"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Session</Button>
        </div>
      </form>
    </Modal>
  );
}
