import { useState } from "react";
import { Modal, Button, Input, Textarea } from "@/components/ui";
import { useGameStore } from "@/store/gameStore";
import { GameFormData, GameType } from "@/types/game";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedGameIds: number[]) => Promise<void>;
  onCreateGame: (data: GameFormData) => Promise<void>;
}

export function CreateGameModal({
  isOpen,
  onClose,
  onSubmit,
  onCreateGame,
}: CreateGameModalProps) {
  const { games } = useGameStore();
  const [selectedGames, setSelectedGames] = useState<number[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newGameData, setNewGameData] = useState<Partial<GameFormData>>({
    name: "",
    customRules: "",
    type: "custom" as GameType,
    minPlayers: 2,
    maxPlayers: 4,
  });

  const handleSubmit = async () => {
    if (isCreatingNew) {
      if (!newGameData.name || !newGameData.sessionId) return;
      await onCreateGame(newGameData as GameFormData);
    } else {
      await onSubmit(selectedGames);
    }
    onClose();
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setNewGameData({
      name: "",
      customRules: "",
      type: "custom" as GameType,
      minPlayers: 2,
      maxPlayers: 4,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Games to Session">
      <div className="space-y-4">
        {!isCreatingNew ? (
          <>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                Select Games
              </h3>
              <div className="space-y-2">
                {games.map((game) => (
                  <label
                    key={game.id}
                    className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGames.includes(game.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGames([...selectedGames, game.id]);
                        } else {
                          setSelectedGames(
                            selectedGames.filter((id) => id !== game.id)
                          );
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-900">{game.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleCreateNew}>
                Create New Game
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedGames.length === 0}
              >
                Add Selected Games
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Game Name
                </label>
                <Input
                  value={newGameData.name}
                  onChange={(e) =>
                    setNewGameData({ ...newGameData, name: e.target.value })
                  }
                  placeholder="Enter game name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Rules
                </label>
                <Textarea
                  value={newGameData.customRules}
                  onChange={(e) =>
                    setNewGameData({
                      ...newGameData,
                      customRules: e.target.value,
                    })
                  }
                  placeholder="Enter game rules"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingNew(false)}
                >
                  Back to Selection
                </Button>
                <Button onClick={handleSubmit} disabled={!newGameData.name}>
                  Create Game
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
