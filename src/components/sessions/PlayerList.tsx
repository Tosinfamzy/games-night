import React, { useState } from "react";
import { BasePlayer } from "@/types/session";
import Button from "@/components/ui/Button";
import { useSessionStore } from "@/store/sessionStore";

interface PlayerListProps {
  sessionId: string;
  players: BasePlayer[];
  onPlayerAdded: (player: BasePlayer) => void;
}

export function PlayerList({
  sessionId,
  players,
  onPlayerAdded,
}: PlayerListProps) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const { assignPlayers } = useSessionStore();

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      const response = await assignPlayers(sessionId, {
        players: [{ name: newPlayerName }],
      });
      if (response.players?.length) {
        onPlayerAdded(response.players[response.players.length - 1]);
      }
      setNewPlayerName("");
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-gray-900">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-2 bg-gray-100 rounded"
          >
            <span>{player.name}</span>
            {player.team && (
              <span className="text-sm text-gray-500">
                Team: {(player.team as { name: string }).name}
              </span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleAddPlayer} className="flex gap-2 text-gray-900">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Enter player name"
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button type="submit" disabled={!newPlayerName.trim()}>
          Add Player
        </Button>
      </form>
    </div>
  );
}
