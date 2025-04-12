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

// Create a React context to expose WebSocket status to children
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  connectionStatus: "disconnected",
  reconnect: () => {},
});

// Hook to access WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [connected, setConnected] = useState(false);

  // Connect to WebSocket when the app starts
  useEffect(() => {
    // Subscribe to connection status changes
    const handleConnectionStatus = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      setConnected(status === "connected");

      // Show user-friendly notifications based on connection status
      if (status === "connected") {
        console.log("Successfully connected to the game server");
      } else if (status === "error") {
        console.error(
          "Connection to game server failed. Some features may not work."
        );
      }
    };

    // Register the listener
    wsService.on("connection_status", handleConnectionStatus);

    // Connect to WebSocket
    wsService.connect();

    // Initial status check
    setConnectionStatus(wsService.getConnectionStatus());
    setConnected(wsService.getConnectionStatus() === "connected");

    // Cleanup on unmount
    return () => {
      wsService.off("connection_status", handleConnectionStatus);
      wsService.disconnect();
    };
  }, []);

  // Function to manually reconnect if needed
  const reconnect = () => {
    setConnectionStatus("connecting");
    wsService.disconnect();
    setTimeout(() => wsService.connect(), 500);
  };

  // Context value
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
