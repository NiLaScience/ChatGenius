import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socket.current) {
      socket.current = io({
        path: "/socket.io",
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.current.on("connect", () => {
        console.log("Connected to WebSocket server with ID:", socket.current?.id);
      });

      socket.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socket.current.on("disconnect", (reason) => {
        console.log("Disconnected from WebSocket server:", reason);
      });
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, []);

  return socket.current;
}