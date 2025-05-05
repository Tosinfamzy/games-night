import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useWebSocket } from "@/components/providers/WebSocketProvider";
import { wsService } from "@/lib/websocket";

interface TeamChatMessage {
  id: string;
  teamId: number;
  playerId: number;
  playerName: string;
  message: string;
  timestamp: string;
}

interface TeamChatProps {
  teamId: number;
  playerId: number;
  playerName: string;
  className?: string;
}

export function TeamChat({
  teamId,
  playerId,
  playerName,
  className = "",
}: TeamChatProps) {
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [joinStatus, setJoinStatus] = useState<
    "joining" | "joined" | "failed" | null
  >(null);
  const { connected, joinTeam, sendTeamMessage } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const joinTeamRoom = async () => {
      if (!connected) return;

      setJoinStatus("joining");
      try {
        const success = await joinTeam(teamId, playerId);
        if (success) {
          setJoinStatus("joined");
        } else {
          setJoinStatus("failed");
        }
      } catch (error) {
        console.error("Failed to join team chat:", error);
        setJoinStatus("failed");
      }
    };

    joinTeamRoom();

    return () => {
      // Clean up listener when component unmounts
      if (connected) {
        // Leave the team room
        wsService.leaveTeam(teamId);
      }
    };
  }, [connected, teamId, playerId, joinTeam]);

  useEffect(() => {
    if (!connected) return;

    const handleTeamMessage = (data: {
      teamId: number;
      playerId: number;
      playerName: string;
      message: string;
      timestamp: string;
    }) => {
      if (data.teamId !== teamId) return;

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          teamId: data.teamId,
          playerId: data.playerId,
          playerName: data.playerName,
          message: data.message,
          timestamp: data.timestamp,
        },
      ]);
    };

    const handlePlayerUpdate = (data: {
      teamId: number;
      playerId: number;
      playerName: string;
      action: "joined" | "left";
      timestamp: string;
    }) => {
      if (data.teamId !== teamId) return;

      const systemMessage: TeamChatMessage = {
        id: `system-${Date.now()}`,
        teamId: data.teamId,
        playerId: 0, // System message
        playerName: "System",
        message: `${data.playerName} has ${data.action} the team chat`,
        timestamp: data.timestamp,
      };

      setMessages((prevMessages) => [...prevMessages, systemMessage]);
    };

    wsService.onTeamMessage(handleTeamMessage);
    wsService.onTeamPlayerUpdate(handlePlayerUpdate);

    wsService.subscribeToTeam(teamId, {
      onMessage: handleTeamMessage,
      onPlayerUpdate: handlePlayerUpdate,
    });

    return () => {
      wsService.off("team:message", handleTeamMessage);
      wsService.off("team:player:update", handlePlayerUpdate);
      wsService.unsubscribeFromTeam(teamId);
    };
  }, [connected, teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !connected) return;

    const success = sendTeamMessage(teamId, playerId, currentMessage);

    if (success) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `local-${Date.now()}`,
          teamId: teamId,
          playerId: playerId,
          playerName: playerName,
          message: currentMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
      setCurrentMessage("");
    }
  };

  if (!connected) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle>Team Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 text-gray-500">
            <p>Connecting to chat server...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Chat</CardTitle>
        <Badge
          variant={
            joinStatus === "joined"
              ? "success"
              : joinStatus === "joining"
              ? "info"
              : "error"
          }
        >
          {joinStatus === "joined"
            ? "Connected"
            : joinStatus === "joining"
            ? "Connecting..."
            : "Connection Failed"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto max-h-64 space-y-2 mb-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-lg ${
                    msg.playerId === playerId
                      ? "bg-blue-100 ml-8 text-right"
                      : msg.playerId === 0
                      ? "bg-gray-100 italic text-center text-sm text-gray-500"
                      : "bg-gray-100 mr-8"
                  }`}
                >
                  {msg.playerId !== 0 && msg.playerId !== playerId && (
                    <div className="font-medium text-sm text-blue-700">
                      {msg.playerName}
                    </div>
                  )}
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={joinStatus !== "joined"}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!currentMessage.trim() || joinStatus !== "joined"}
            >
              Send
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
