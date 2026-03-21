"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  visitor_id: string;
  status: "active" | "closed";
  message_count: number;
  started_at: string;
  last_message_at?: string;
  last_message_preview?: string;
}

interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

interface ConversationDetailResponse {
  conversation: Conversation;
  messages: ConversationMessage[];
}

export function useRecentConversations() {
  return useQuery({
    queryKey: ["conversations", "recent"],
    queryFn: () =>
      apiClient.get<ConversationsResponse>("/chat/conversations?page=1&limit=5"),
    staleTime: 30 * 1000,
  });
}

export function useConversations(
  page: number = 1,
  limit: number = 20,
  status?: "active" | "closed"
) {
  return useQuery({
    queryKey: ["conversations", page, limit, status],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set("status", status);
      return apiClient.get<ConversationsResponse>(
        `/chat/conversations?${params.toString()}`
      );
    },
    staleTime: 30 * 1000,
  });
}

export function useConversationDetail(id: string | null) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () =>
      apiClient.get<ConversationDetailResponse>(
        `/chat/conversations/${id}`
      ),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
