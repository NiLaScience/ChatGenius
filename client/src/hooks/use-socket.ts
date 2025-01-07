import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socket.current) {
      socket.current = io("/", {
        path: "/socket.io",
      });

      socket.current.on("connect", () => {
        console.log("Connected to WebSocket server");
      });

      socket.current.on("disconnect", () => {
        console.log("Disconnected from WebSocket server");
      });
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  return socket.current;
}
