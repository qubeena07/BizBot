"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "@/stores/chat-store";

const bubbleVariants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
};

interface MessageBubbleProps {
  message: ChatMessage;
  isLast?: boolean;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = message.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      className={`group flex ${isUser ? "justify-end" : "justify-start gap-3"} px-6 py-1.5`}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#27272A] bg-[#141416]">
          <span className="text-xs font-bold text-[#E07A5F]">BB</span>
        </div>
      )}

      <div className={`max-w-[70%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Bubble */}
        <div
          className={
            isUser
              ? "rounded-2xl rounded-br-md bg-[#E07A5F] px-4 py-3 text-white"
              : "rounded-2xl rounded-bl-md border border-[#27272A] bg-[#141416] px-4 py-3 text-[#FAFAF9]"
          }
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
            {/* Streaming cursor */}
            {message.isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[#E07A5F]" />
            )}
          </p>
        </div>

        {/* Source pills */}
        {!message.isStreaming && message.sources && message.sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-2 flex flex-wrap gap-1.5"
          >
            {message.sources.map((src) => (
              <span
                key={src.source_id}
                title={`${src.source_filename} — ${Math.round(src.relevance_score * 100)}% relevant`}
                className="inline-flex items-center gap-1 rounded-full border border-[#27272A] bg-[#1C1C1F] px-2.5 py-1 text-[10px] text-[#A1A1AA] transition-colors hover:border-[#3F3F46]"
              >
                <FileText className="h-3 w-3" />
                {src.source_filename.length > 20
                  ? src.source_filename.slice(0, 20) + "…"
                  : src.source_filename}
              </span>
            ))}
          </motion.div>
        )}

        {/* Hover actions: time + copy */}
        <div
          className={`mt-1 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
            isUser ? "flex-row-reverse" : ""
          }`}
        >
          <span className="text-[10px] text-[#71717A]">
            {formatTime(message.createdAt)}
          </span>
          {message.content && (
            <button
              onClick={handleCopy}
              className="rounded p-0.5 text-[#71717A] transition-colors hover:text-[#A1A1AA]"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[#3D8B7A]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Response metrics */}
        {!isUser && !message.isStreaming && (message.responseTimeMs || message.tokensUsed) && (
          <p className="mt-0.5 text-[10px] text-[#3F3F46]">
            {message.responseTimeMs && `${message.responseTimeMs}ms`}
            {message.responseTimeMs && message.tokensUsed && " · "}
            {message.tokensUsed && `${message.tokensUsed} tokens`}
          </p>
        )}
      </div>
    </motion.div>
  );
}
