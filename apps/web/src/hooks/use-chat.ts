"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useChatStore } from "@/stores/chat-store";

const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL_MS = 30_000;

function getWsUrl(tenantId: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const base = apiUrl.replace(/^http/, "ws").replace(/\/api\/v1$/, "");
  return `${base}/api/v1/chat/ws/${tenantId}`;
}

export function useChat(tenantId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);

  const store = useChatStore;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!tenantId || !mountedRef.current) return;

    cleanup();

    const url = getWsUrl(tenantId);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      attemptRef.current = 0;
      store.getState().setIsConnected(true);

      // Start keepalive pings
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(event.data as string);
      } catch {
        return;
      }

      const state = store.getState();
      switch (data.type) {
        case "chunk":
          state.appendToLastMessage(data.content as string);
          break;

        case "sources":
          state.updateLastMessage({
            sources: data.data as {
              source_id: string;
              source_filename: string;
              chunk_content: string;
              relevance_score: number;
            }[],
          });
          break;

        case "done":
          state.updateLastMessage({ isStreaming: false });
          state.setIsStreaming(false);
          if (data.conversation_id) {
            state.setConversationId(data.conversation_id as string);
          }
          break;

        case "error":
          state.updateLastMessage({
            isStreaming: false,
            content: "Sorry, something went wrong. Please try again.",
          });
          state.setIsStreaming(false);
          toast.error((data.detail as string) || "Chat error");
          break;

        case "pong":
          // keepalive response
          break;
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      store.getState().setIsConnected(false);

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Reconnect with exponential backoff
      if (attemptRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30_000);
        attemptRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      } else {
        toast.error("Connection lost. Please refresh the page.");
      }
    };

    ws.onerror = () => {
      // Let onclose handle reconnect
    };
  }, [tenantId, cleanup, store]);

  const reconnect = useCallback(() => {
    attemptRef.current = 0;
    connect();
  }, [connect]);

  const sendMessage = useCallback(
    (content: string) => {
      const state = store.getState();

      // Add user message
      state.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date(),
      });

      // Add placeholder assistant message
      state.addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        isStreaming: true,
        createdAt: new Date(),
      });

      state.setIsStreaming(true);

      // Send via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "message",
            content,
            conversation_id: state.currentConversationId,
          })
        );
      } else {
        state.updateLastMessage({
          isStreaming: false,
          content: "Not connected. Please wait for reconnection.",
        });
        state.setIsStreaming(false);
        toast.error("WebSocket not connected");
      }
    },
    [store]
  );

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    if (tenantId) connect();

    return () => {
      mountedRef.current = false;
      cleanup();
      store.getState().setIsConnected(false);
    };
  }, [tenantId, connect, cleanup, store]);

  return {
    sendMessage,
    isConnected: useChatStore((s) => s.isConnected),
    isStreaming: useChatStore((s) => s.isStreaming),
    reconnect,
  };
}
