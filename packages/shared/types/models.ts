// Domain model types

export interface Tenant {
  id: string;
  business_name: string;
  bot_name: string;
  welcome_message: string;
  primary_color: string;
  widget_position: "bottom-right" | "bottom-left";
  industry: string | null;
  timezone: string;
  plan: "free" | "pro" | "enterprise";
  is_active: boolean;
  created_at: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: "file" | "text" | "url";
  status: "processing" | "ready" | "error";
  chunk_count: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  visitor_id: string;
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  source: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_conversations: number;
  total_messages: number;
  leads_captured: number;
  avg_satisfaction: number;
  conversations_today: number;
}
