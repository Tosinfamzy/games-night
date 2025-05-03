import { useState } from "react";
import { Modal, Button, Input, Textarea } from "@/components/ui";
import { useGameStore } from "@/store/gameStore";
import { GameFormData, GameType, Rule, CreateRuleDto } from "@/types/game";

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
    type: "uno" as GameType,
    minPlayers: 2,
    maxPlayers: 8,
  });

  const [gameRules, setGameRules] = useState<Rule[]>([]);
  const [showRulesForm, setShowRulesForm] = useState(false);
  const [newRule, setNewRule] = useState<CreateRuleDto>({
    name: "",
    description: "",
    isDefaultEnabled: true,
  });

  const handleSubmit = async () => {
    if (isCreatingNew) {
      if (!newGameData.name) return;
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
      type: "uno" as GameType,
      minPlayers: 2,
      maxPlayers: 8,
    });
  };

  const handleTypeChange = (type: string) => {
    setNewGameData({ ...newGameData, type: type as GameType });

    switch (type) {
      case "uno":
        setNewGameData((prev) => ({
          ...prev,
          type: type as GameType,
          minPlayers: 2,
          maxPlayers: 10,
        }));
        break;
      case "articulate":
        setNewGameData((prev) => ({
          ...prev,
          type: type as GameType,
          minPlayers: 4,
          maxPlayers: 20,
        }));
        break;
      case "cards_against_humanity":
        setNewGameData((prev) => ({
          ...prev,
          type: type as GameType,
          minPlayers: 3,
          maxPlayers: 20,
        }));
        break;
      case "blackjack":
        setNewGameData((prev) => ({
          ...prev,
          type: type as GameType,
          minPlayers: 1,
          maxPlayers: 7,
        }));
        break;
      default:
        setNewGameData((prev) => ({
          ...prev,
          type: type as GameType,
          minPlayers: 2,
          maxPlayers: 8,
        }));
    }
  };

  const addRule = () => {
    if (newRule.name && newRule.description) {
      setGameRules([
        ...gameRules,
        {
          ...newRule,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setNewRule({ name: "", description: "", isDefaultEnabled: true });
      setShowRulesForm(false);
    }
  };

  const toggleRuleEnabled = (index: number) => {
    const updatedRules = [...gameRules];
    updatedRules[index].isDefaultEnabled =
      !updatedRules[index].isDefaultEnabled;
    setGameRules(updatedRules);
  };

  const removeRule = (index: number) => {
    const updatedRules = [...gameRules];
    updatedRules.splice(index, 1);
    setGameRules(updatedRules);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreatingNew ? "Create New Game" : "Add Games to Session"}
      size="lg"
    >
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
                    <span className="text-sm text-gray-500 ml-2">
                      ({game.type})
                    </span>
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
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Game Type
                </label>
                <select
                  value={newGameData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="uno">UNO</option>
                  <option value="articulate">Articulate</option>
                  <option value="cards_against_humanity">
                    Cards Against Humanity
                  </option>
                  <option value="blackjack">Blackjack</option>
                  <option value="custom">Custom Game</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Min Players
                  </label>
                  <Input
                    type="number"
                    value={newGameData.minPlayers}
                    onChange={(e) =>
                      setNewGameData({
                        ...newGameData,
                        minPlayers: parseInt(e.target.value),
                      })
                    }
                    min={1}
                    max={newGameData.maxPlayers || 20}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Max Players
                  </label>
                  <Input
                    type="number"
                    value={newGameData.maxPlayers}
                    onChange={(e) =>
                      setNewGameData({
                        ...newGameData,
                        maxPlayers: parseInt(e.target.value),
                      })
                    }
                    min={newGameData.minPlayers || 1}
                    className="mt-1"
                  />
                </div>
              </div>

              {newGameData.type === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Custom Rules
                  </label>
                  <Textarea
                    value={newGameData.customRules}
                    onChange={(e) =>
                      setNewGameData({
                        ...newGameData,
                        customRules: e.target.value,
                      })
                    }
                    placeholder="Enter custom game rules"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}

              {newGameData.type !== "custom" && (
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">Game Rules</h3>
                    <Button
                      variant="outline"
                      onClick={() => setShowRulesForm(true)}
                      size="sm"
                    >
                      Add Rule
                    </Button>
                  </div>

                  {showRulesForm && (
                    <div className="bg-gray-50 p-3 mb-3 rounded-md space-y-3">
                      <h4 className="text-sm font-semibold">Add New Rule</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Rule Name
                        </label>
                        <Input
                          value={newRule.name}
                          onChange={(e) =>
                            setNewRule({ ...newRule, name: e.target.value })
                          }
                          placeholder="E.g., No Stacking"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <Textarea
                          value={newRule.description}
                          onChange={(e) =>
                            setNewRule({
                              ...newRule,
                              description: e.target.value,
                            })
                          }
                          placeholder="E.g., Players cannot stack +2 or +4 cards"
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newRule.isDefaultEnabled}
                          onChange={(e) =>
                            setNewRule({
                              ...newRule,
                              isDefaultEnabled: e.target.checked,
                            })
                          }
                          id="rule-enabled"
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="rule-enabled" className="text-sm">
                          Enabled by default
                        </label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRulesForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={addRule}
                          disabled={!newRule.name || !newRule.description}
                        >
                          Add Rule
                        </Button>
                      </div>
                    </div>
                  )}

                  {gameRules.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {gameRules.map((rule, index) => (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={rule.isDefaultEnabled}
                              onChange={() => toggleRuleEnabled(index)}
                              className="rounded border-gray-300"
                            />
                            <div>
                              <p className="font-medium text-sm">{rule.name}</p>
                              <p className="text-xs text-gray-500">
                                {rule.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRule(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No custom rules added. The game will use default rules for{" "}
                      {newGameData.type === "uno"
                        ? "UNO"
                        : newGameData.type === "articulate"
                        ? "Articulate"
                        : newGameData.type === "cards_against_humanity"
                        ? "Cards Against Humanity"
                        : newGameData.type === "blackjack"
                        ? "Blackjack"
                        : "this game"}
                      .
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-4">
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
