"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  useConversations,
  useConversationDetail,
} from "@/hooks/use-conversations";
import type { Conversation } from "@/hooks/use-conversations";
import { MessageBubble } from "@/components/playground/message-bubble";
import { EmptyState } from "@/components/shared/empty-state";
import { ConversationListSkeleton } from "@/components/shared/loading-skeleton";
import { formatRelativeTime } from "@/lib/utils";

type StatusFilter = "all" | "active" | "closed";

const TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Closed", value: "closed" },
];

const LIMIT = 20;

const listItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
};

const listContainerVariants = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export default function ConversationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const status = statusFilter === "all" ? undefined : statusFilter;
  const { data, isLoading } = useConversations(page, LIMIT, status);
  const { data: detail, isLoading: detailLoading } =
    useConversationDetail(selectedId);

  const conversations = data?.conversations ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b border-[#27272A] px-6 py-4">
        <h1 className="font-heading text-xl font-semibold text-[#FAFAF9]">
          Conversations
        </h1>
        <p className="mt-1 text-sm text-[#71717A]">
          View and manage all chatbot conversations.
        </p>

        {/* Filter tabs */}
        <div className="mt-4 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                statusFilter === tab.value
                  ? "bg-[#1C1C1F] text-[#FAFAF9]"
                  : "text-[#71717A] hover:text-[#A1A1AA]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className="flex w-full flex-col overflow-hidden border-r border-[#27272A] md:w-[400px]">
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4">
                <ConversationListSkeleton />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  description="Conversations will appear here once visitors start chatting with your bot."
                />
              </div>
            ) : (
              <motion.div
                variants={listContainerVariants}
                initial="initial"
                animate="animate"
              >
                {conversations.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conversation={conv}
                    isSelected={conv.id === selectedId}
                    onClick={() => setSelectedId(conv.id)}
                  />
                ))}
              </motion.div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#27272A] px-4 py-3">
              <span className="text-xs text-[#71717A]">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded p-1 text-[#71717A] transition-colors hover:bg-[#1C1C1F] hover:text-[#A1A1AA] disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded p-1 text-[#71717A] transition-colors hover:bg-[#1C1C1F] hover:text-[#A1A1AA] disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selectedId ? (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="hidden flex-1 flex-col overflow-hidden md:flex"
            >
              {/* Detail header */}
              <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#FAFAF9]">
                    {detail?.conversation?.title ||
                      `Conversation ${selectedId.slice(0, 8)}…`}
                  </h3>
                  <p className="text-xs text-[#71717A]">
                    {detail?.conversation?.message_count ?? "—"} messages
                    {detail?.conversation?.status && (
                      <span
                        className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] ${
                          detail.conversation.status === "active"
                            ? "bg-[#3D8B7A]/10 text-[#3D8B7A]"
                            : "bg-[#3F3F46]/20 text-[#71717A]"
                        }`}
                      >
                        {detail.conversation.status}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="rounded-lg p-1.5 text-[#71717A] transition-colors hover:bg-[#1C1C1F] hover:text-[#A1A1AA]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#27272A] border-t-[#E07A5F]" />
                  </div>
                ) : detail?.messages?.length ? (
                  detail.messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={{
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        createdAt: new Date(msg.created_at),
                      }}
                    />
                  ))
                ) : (
                  <p className="text-center text-sm text-[#71717A]">
                    No messages found.
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="hidden flex-1 items-center justify-center md:flex">
              <div className="text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-[#27272A]" />
                <p className="mt-3 text-sm text-[#71717A]">
                  Select a conversation to view details
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      variants={listItemVariants}
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b border-[#27272A] px-4 py-3 text-left transition-colors ${
        isSelected
          ? "bg-[#1C1C1F]"
          : "hover:bg-[#141416]"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#27272A] bg-[#141416]">
        <MessageSquare className="h-4 w-4 text-[#71717A]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-[#FAFAF9]">
            {conversation.title || `Visitor ${conversation.visitor_id.slice(0, 8)}`}
          </p>
          <span
            className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
              conversation.status === "active"
                ? "bg-[#3D8B7A]/10 text-[#3D8B7A]"
                : "bg-[#3F3F46]/20 text-[#71717A]"
            }`}
          >
            {conversation.status}
          </span>
        </div>
        {conversation.last_message_preview && (
          <p className="mt-0.5 truncate text-xs text-[#71717A]">
            {conversation.last_message_preview}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[10px] text-[#3F3F46]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(conversation.started_at)}
          </span>
          <span>{conversation.message_count} msgs</span>
        </div>
      </div>
    </motion.button>
  );
}
