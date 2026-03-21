"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, PanelRightClose, PanelRightOpen, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useChatStore } from "@/stores/chat-store";
import { ChatWindow } from "@/components/playground/chat-window";

export default function PlaygroundPage() {
  const { tenant } = useAuth();
  const { sendMessage, isConnected, reconnect } = useChat(tenant?.id ?? "");
  const messages = useChatStore((s) => s.messages);
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const clearChat = useChatStore((s) => s.clearChat);
  const [sourcesOpen, setSourcesOpen] = useState(true);

  // Get sources from the last assistant message
  const lastSources = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && messages[i].sources?.length) {
        return messages[i].sources!;
      }
    }
    return [];
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={clearChat}
            className="flex items-center gap-2 rounded-lg border border-[#27272A] bg-transparent px-3 py-1.5 text-sm text-[#A1A1AA] transition-colors hover:border-[#3F3F46] hover:text-[#FAFAF9]"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-[#3D8B7A]" : "bg-[#EF4444]"
              }`}
            />
            <span className="text-xs text-[#71717A]">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            {!isConnected && (
              <button
                onClick={reconnect}
                className="text-xs text-[#E07A5F] hover:underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentConversationId && (
            <span className="font-mono text-xs text-[#3F3F46]">
              {currentConversationId.slice(0, 8)}…
            </span>
          )}
          <button
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="rounded-lg p-1.5 text-[#71717A] transition-colors hover:bg-[#1C1C1F] hover:text-[#A1A1AA]"
          >
            {sourcesOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="flex-1">
          <ChatWindow onSendMessage={sendMessage} />
        </div>

        {/* Sources panel */}
        <AnimatePresence initial={false}>
          {sourcesOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-l border-[#27272A]"
            >
              <div className="flex h-full w-[300px] flex-col">
                <div className="border-b border-[#27272A] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[#FAFAF9]">
                    Sources
                  </h3>
                  <p className="text-xs text-[#71717A]">
                    References from the last response
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {lastSources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-8 w-8 text-[#27272A]" />
                      <p className="mt-3 text-xs text-[#71717A]">
                        Source references will appear here when the assistant
                        uses your knowledge base.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lastSources.map((src) => (
                        <motion.div
                          key={src.source_id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-[#27272A] bg-[#141416] p-3"
                        >
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E07A5F]" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-[#FAFAF9]">
                                {src.source_filename}
                              </p>
                              <p className="mt-0.5 text-[10px] text-[#3D8B7A]">
                                {Math.round(src.relevance_score * 100)}%
                                relevant
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 line-clamp-4 text-[11px] leading-relaxed text-[#A1A1AA]">
                            {src.chunk_content}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
