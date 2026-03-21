"use client";

import { create } from "zustand";

export interface SourceReference {
  source_id: string;
  source_filename: string;
  chunk_content: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  isStreaming?: boolean;
  responseTimeMs?: number;
  tokensUsed?: number;
  createdAt: Date;
}

interface ChatState {
  messages: ChatMessage[];
  currentConversationId: string | null;
  isConnected: boolean;
  isStreaming: boolean;

  addMessage: (msg: ChatMessage) => void;
  appendToLastMessage: (chunk: string) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  setConversationId: (id: string) => void;
  setIsConnected: (v: boolean) => void;
  setIsStreaming: (v: boolean) => void;
  clearChat: () => void;
  loadConversation: (messages: ChatMessage[], conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentConversationId: null,
  isConnected: false,
  isStreaming: false,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendToLastMessage: (chunk) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
      }
      return { messages: msgs };
    }),

  updateLastMessage: (updates) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, ...updates };
      }
      return { messages: msgs };
    }),

  setConversationId: (id) => set({ currentConversationId: id }),
  setIsConnected: (v) => set({ isConnected: v }),
  setIsStreaming: (v) => set({ isStreaming: v }),

  clearChat: () =>
    set({ messages: [], currentConversationId: null, isStreaming: false }),

  loadConversation: (messages, conversationId) =>
    set({ messages, currentConversationId: conversationId, isStreaming: false }),
}));
