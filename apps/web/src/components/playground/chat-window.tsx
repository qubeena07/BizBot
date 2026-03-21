"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { MessageBubble } from "@/components/playground/message-bubble";
import { TypingIndicator } from "@/components/playground/typing-indicator";
import { ChatInput } from "@/components/playground/chat-input";

const suggestedQuestions = [
  "What services do you offer?",
  "What are your business hours?",
  "How can I contact you?",
];

const pillVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
};

interface ChatWindowProps {
  onSendMessage: (content: string) => void;
}

export function ChatWindow({ onSendMessage }: ChatWindowProps) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Track if user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Always scroll for new user messages or if already near bottom
    const lastMessage = messages[messages.length - 1];
    const shouldScroll =
      isNearBottomRef.current || lastMessage?.role === "user";

    if (shouldScroll) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  const showTyping =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant" &&
    messages[messages.length - 1]?.content === "";

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#27272A] bg-[#141416]">
              <Bot className="h-8 w-8 text-[#E07A5F]" />
            </div>
            <h3 className="mt-5 font-heading text-xl font-semibold text-[#FAFAF9]">
              Hi! I&apos;m your AI assistant
            </h3>
            <p className="mt-2 max-w-sm text-center text-sm text-[#71717A]">
              Upload documents to my knowledge base, then ask me anything about
              your business.
            </p>

            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="mt-6 flex flex-wrap justify-center gap-2"
            >
              {suggestedQuestions.map((q) => (
                <motion.button
                  key={q}
                  variants={pillVariants}
                  onClick={() => onSendMessage(q)}
                  className="rounded-full border border-[#27272A] bg-[#141416] px-4 py-2 text-sm text-[#A1A1AA] transition-colors hover:border-[#E07A5F] hover:text-[#FAFAF9]"
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLast={i === messages.length - 1}
              />
            ))}

            <AnimatePresence>{showTyping && <TypingIndicator />}</AnimatePresence>
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput onSend={onSendMessage} disabled={isStreaming} />
    </div>
  );
}
