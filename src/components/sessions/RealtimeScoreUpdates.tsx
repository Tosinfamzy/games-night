import React, { useEffect, useState } from "react";
import { wsService } from "@/lib/websocket";
import { useWebSocket } from "@/components/providers/WebSocketProvider";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AnimatePresence, motion } from "framer-motion";

interface ScoreUpdate {
  id: string;
  playerId?: number;
  playerName?: string;
  teamId?: number;
  teamName?: string;
  gameId: number;
  points: number;
  timestamp: string;
  type: "player" | "team";
}

interface RealtimeScoreUpdatesProps {
  gameId: string | number;
  sessionId?: string | number;
  maxUpdates?: number;
}

export function RealtimeScoreUpdates({
  gameId,
  sessionId,
  maxUpdates = 5,
}: RealtimeScoreUpdatesProps) {
  const [scoreUpdates, setScoreUpdates] = useState<ScoreUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<ScoreUpdate | null>(null);
  const { connected, connectionStatus } = useWebSocket();

  const createUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  useEffect(() => {
    const handlePlayerScoreUpdate = (data: {
      playerId: number;
      gameId: number;
      points: number;
      timestamp: string;
      playerName?: string;
    }) => {
      if (data.gameId.toString() !== gameId.toString()) return;

      const newUpdate: ScoreUpdate = {
        id: createUniqueId(),
        playerId: data.playerId,
        playerName: data.playerName || `Player ${data.playerId}`,
        gameId: data.gameId,
        points: data.points,
        timestamp: data.timestamp,
        type: "player",
      };

      setLatestUpdate(newUpdate);

      setScoreUpdates((prev) => {
        const newUpdates = [newUpdate, ...prev].slice(0, maxUpdates);
        return newUpdates;
      });
    };

    const handleTeamScoreUpdate = (data: {
      teamId: number;
      gameId: number;
      points: number;
      timestamp: string;
      teamName?: string;
    }) => {
      if (data.gameId.toString() !== gameId.toString()) return;

      const newUpdate: ScoreUpdate = {
        id: createUniqueId(),
        teamId: data.teamId,
        teamName: data.teamName || `Team ${data.teamId}`,
        gameId: data.gameId,
        points: data.points,
        timestamp: data.timestamp,
        type: "team",
      };

      setLatestUpdate(newUpdate);

      setScoreUpdates((prev) => {
        const newUpdates = [newUpdate, ...prev].slice(0, maxUpdates);
        return newUpdates;
      });
    };

    wsService.subscribeToGame(gameId.toString(), {
      onPlayerScoreEvent: handlePlayerScoreUpdate,
    });

    wsService.onPlayerScoreUpdate(handlePlayerScoreUpdate);
    wsService.onTeamScoreUpdate(handleTeamScoreUpdate);

    if (sessionId) {
      wsService.subscribeToSession(sessionId.toString(), {
        onScoreUpdate: (data) => {
          const relevantScores = data.scores.filter(
            () => data.gameId.toString() === gameId.toString()
          );

          if (relevantScores.length === 0) return;

          relevantScores.forEach((score) => {
            handlePlayerScoreUpdate({
              playerId: parseInt(score.playerId),
              gameId: parseInt(data.gameId),
              points: score.score,
              timestamp: new Date().toISOString(),
            });
          });
        },
      });
    }

    setLatestUpdate(null);

    return () => {
      wsService.unsubscribeFromGame(gameId.toString());
      if (sessionId) {
        wsService.unsubscribeFromSession(sessionId.toString());
      }
    };
  }, [gameId, sessionId, maxUpdates]);

  useEffect(() => {
    if (latestUpdate) {
      const timer = setTimeout(() => {
        setLatestUpdate(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [latestUpdate]);

  if (!connected && scoreUpdates.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Live Score Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {connectionStatus === "connecting"
                ? "Connecting to score updates..."
                : "Waiting for connection to score service..."}
            </span>
            <Badge
              variant={
                connectionStatus === "connected"
                  ? "success"
                  : connectionStatus === "connecting"
                  ? "info"
                  : connectionStatus === "error"
                  ? "error"
                  : "warning"
              }
            >
              {connectionStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Floating notification for latest score update */}
      <AnimatePresence>
        {latestUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant="success">New Score</Badge>
              <span className="text-xs text-gray-500">
                {new Date(latestUpdate.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="font-medium">
              {latestUpdate.type === "player"
                ? latestUpdate.playerName
                : latestUpdate.teamName}
              <span className="text-green-600">
                +{latestUpdate.points} points
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score history card */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Live Score Updates</CardTitle>
            <Badge
              variant={
                connectionStatus === "connected"
                  ? "success"
                  : connectionStatus === "connecting"
                  ? "info"
                  : connectionStatus === "error"
                  ? "error"
                  : "warning"
              }
            >
              {connectionStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {scoreUpdates.length > 0 ? (
            <div className="space-y-3">
              {scoreUpdates.map((update) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-2 rounded-md bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={update.type === "player" ? "info" : "warning"}
                    >
                      {update.type === "player" ? "Player" : "Team"}
                    </Badge>
                    <span className="font-medium">
                      {update.type === "player"
                        ? update.playerName
                        : update.teamName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-green-600">
                      +{update.points}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No score updates yet
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
