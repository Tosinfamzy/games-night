import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface PlayerAssignmentProps {
  onSubmit: (players: { name: string }[]) => Promise<void>;
}

export function PlayerAssignment({ onSubmit }: PlayerAssignmentProps) {
  const [players, setPlayers] = useState<{ name: string }[]>([{ name: "" }]);

  const handleAddPlayer = () => {
    setPlayers([...players, { name: "" }]);
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { name: value };
    setPlayers(newPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validPlayers = players.filter((p) => p.name.trim() !== "");
    await onSubmit(validPlayers);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Assign Players</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {players.map((player, index) => (
          <div key={index} className="flex items-center space-x-4">
            <Input
              placeholder={`Player ${index + 1} name`}
              value={player.name}
              onChange={(e) => handlePlayerNameChange(index, e.target.value)}
              className="flex-1"
            />
            {players.length > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRemovePlayer(index)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleAddPlayer}>
            Add Player
          </Button>
          <Button type="submit">Assign Players</Button>
        </div>
      </form>
    </div>
  );
}
