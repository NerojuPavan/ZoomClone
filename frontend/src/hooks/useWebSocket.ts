"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SignalingMessage } from "@/types/meeting";

interface UseWebSocketOptions {
  url: string | null;
  enabled?: boolean;
  onMessage?: (message: SignalingMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: SignalingMessage) => void;
  disconnect: () => void;
}

export function useWebSocket({
  url,
  enabled = true,
  onMessage,
  onOpen,
  onClose,
  onError,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const callbacksRef = useRef({ onMessage, onOpen, onClose, onError });

  useEffect(() => {
    callbacksRef.current = { onMessage, onOpen, onClose, onError };
  }, [onMessage, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      socketRef.current = null;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leave", payload: {} }));
      }
      socket.close();
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!enabled || !url) {
      return;
    }

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      callbacksRef.current.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as SignalingMessage;
        callbacksRef.current.onMessage?.(message);
      } catch {
        console.error("Failed to parse WebSocket message");
      }
    };

    socket.onerror = (event) => {
      callbacksRef.current.onError?.(event);
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      callbacksRef.current.onClose?.();
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leave", payload: {} }));
      }
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, url]);

  const sendMessage = useCallback((message: SignalingMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  return { isConnected, sendMessage, disconnect };
}
