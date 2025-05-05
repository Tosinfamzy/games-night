"use client";

import {
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { wsService } from "@/lib/websocket";

type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

interface WebSocketContextType {
  connected: boolean;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
  joinTeam: (teamId: number, playerId: number) => Promise<boolean>;
  leaveTeam: (teamId: number) => void;
  sendTeamMessage: (
    teamId: number,
    playerId: number,
    message: string
  ) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  connectionStatus: "disconnected",
  reconnect: () => {},
  joinTeam: () => Promise.resolve(false),
  leaveTeam: () => {},
  sendTeamMessage: () => false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const handleConnectionStatus = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      setConnected(status === "connected");

      if (status === "connected") {
        console.log("Successfully connected to the game server");
      } else if (status === "error") {
        console.error(
          "Connection to game server failed. Some features may not work."
        );
      }
    };

    wsService.on("connection_status", handleConnectionStatus);

    wsService.connect();

    setConnectionStatus(wsService.getConnectionStatus());
    setConnected(wsService.getConnectionStatus() === "connected");

    return () => {
      wsService.off("connection_status", handleConnectionStatus);
      wsService.disconnect();
    };
  }, []);

  const reconnect = () => {
    setConnectionStatus("connecting");
    wsService.disconnect();
    setTimeout(() => wsService.connect(), 500);
  };

  const joinTeam = async (
    teamId: number,
    playerId: number
  ): Promise<boolean> => {
    if (!connected) {
      console.error("Cannot join team: not connected to WebSocket server");
      return false;
    }

    return new Promise((resolve) => {
      wsService.joinTeam(teamId, playerId, (response) => {
        resolve(response.success);
        if (!response.success) {
          console.error(`Failed to join team: ${response.message}`);
        }
      });
    });
  };

  const leaveTeam = (teamId: number) => {
    if (!connected) {
      console.error("Cannot leave team: not connected to WebSocket server");
      return;
    }

    wsService.leaveTeam(teamId);
  };

  const sendTeamMessage = (
    teamId: number,
    playerId: number,
    message: string
  ): boolean => {
    if (!connected) {
      console.error(
        "Cannot send team message: not connected to WebSocket server"
      );
      return false;
    }

    return wsService.sendTeamMessage(teamId, playerId, message);
  };

  const contextValue = {
    connected,
    connectionStatus,
    reconnect,
    joinTeam,
    leaveTeam,
    sendTeamMessage,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
