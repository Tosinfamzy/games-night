import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button, Badge, Switch } from "@/components/ui";
import { Rule, Game } from "@/types/game";
import { api } from "@/services/api";

interface GameRulesManagerProps {
  game: Game;
  className?: string;
  onRulesChanged?: () => void;
}

export function GameRulesManager({
  game,
  className = "",
  onRulesChanged,
}: GameRulesManagerProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch game rules when game changes
  useEffect(() => {
    if (!game?.id) return;

    const fetchGameRules = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get active rules for this game
        const response = await api.get(`/games/${game.id}/rules`);
        if (Array.isArray(response.data)) {
          // If response data is already an array of rules
          setRules(response.data);
        } else if (response.data?.rules && Array.isArray(response.data.rules)) {
          // If rules are nested in a 'rules' property
          setRules(response.data.rules);
        } else if (
          response.data?.rulesContent &&
          Array.isArray(response.data.rulesContent)
        ) {
          // If rules are nested in a 'rulesContent' property as an array
          setRules(response.data.rulesContent);
        } else {
          console.error("Unexpected response format:", response.data);
          setError("Failed to parse game rules");
        }
      } catch (err) {
        console.error("Failed to fetch game rules:", err);
        setError("Failed to load game rules");
      } finally {
        setLoading(false);
      }
    };

    fetchGameRules();
  }, [game?.id]);

  const toggleRule = async (ruleId: number) => {
    const updatedRules = rules.map((rule) =>
      rule.id === ruleId
        ? { ...rule, isDefaultEnabled: !rule.isDefaultEnabled }
        : rule
    );

    setRules(updatedRules);

    try {
      // Update the rule on the server
      await api.put(`/games/rules/${ruleId}`, {
        isDefaultEnabled: updatedRules.find((r) => r.id === ruleId)
          ?.isDefaultEnabled,
      });

      if (onRulesChanged) onRulesChanged();
    } catch (err) {
      console.error("Failed to update rule:", err);
      // Revert the change if it failed
      setRules(rules);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Game Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-700">Loading rules...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Game Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500">{error}</div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mx-auto block mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (rules.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Game Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            {game.type === "custom"
              ? game.customRules || "No custom rules specified for this game."
              : `Using default rules for ${game.type}.`}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Game Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{rule.name}</h3>
                  <Badge
                    variant={rule.isDefaultEnabled ? "success" : "warning"}
                  >
                    {rule.isDefaultEnabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
              </div>
              <Switch
                checked={rule.isDefaultEnabled}
                onChange={() => toggleRule(rule.id)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
