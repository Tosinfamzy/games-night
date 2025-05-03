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
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  connectionStatus: "disconnected",
  reconnect: () => {},
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

  const contextValue = {
    connected,
    connectionStatus,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
