import React, { useState } from "react";
import { Modal } from "@/components/ui";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { SessionFormData } from "@/types/session";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sessionData: SessionFormData) => void;
  hostId?: number | null; // Update to accept null as well
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Include the hostId in the submission data if it exists
    onSubmit({
      ...formData,
      hostId: hostId ?? undefined, // Convert null to undefined
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
