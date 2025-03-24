"use client";

import { useEffect } from "react";
import { wsService } from "@/lib/websocket";

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Connect to WebSocket when the app starts
    wsService.connect();

    // Cleanup on unmount
    return () => {
      wsService.disconnect();
    };
  }, []);

  return <>{children}</>;
}
