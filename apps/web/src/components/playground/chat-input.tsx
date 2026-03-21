"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const MAX_ROWS = 5;
const ROW_HEIGHT = 24;
const BASE_HEIGHT = 44;
const MAX_HEIGHT = BASE_HEIGHT + ROW_HEIGHT * (MAX_ROWS - 1);
const MAX_CHARS = 4000;

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = `${BASE_HEIGHT}px`;
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = `${BASE_HEIGHT}px`;
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;
  const charCount = value.length;

  return (
    <div className="border-t border-[#27272A] bg-[#141416] px-6 py-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your business..."
          rows={1}
          maxLength={MAX_CHARS}
          className={`w-full resize-none overflow-hidden rounded-xl border border-[#27272A] bg-[#1C1C1F] px-4 py-3 pr-14 text-sm text-[#FAFAF9] placeholder:text-[#71717A] focus:border-[#3F3F46] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]/20 ${
            disabled ? "opacity-50" : ""
          }`}
          style={{ minHeight: `${BASE_HEIGHT}px` }}
        />

        {/* Send button */}
        <div className="absolute bottom-2.5 right-2.5">
          <motion.button
            whileTap={canSend ? { scale: 0.92 } : undefined}
            onClick={handleSend}
            disabled={!canSend}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              canSend
                ? "bg-[#E07A5F] text-white hover:bg-[#E07A5F]/90"
                : "cursor-not-allowed bg-[#27272A] text-[#71717A]"
            }`}
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Character count */}
      {charCount > 3000 && (
        <p
          className={`mt-1.5 text-right text-[10px] ${
            charCount > 3800 ? "text-[#EF4444]" : "text-[#71717A]"
          }`}
        >
          {charCount} / {MAX_CHARS}
        </p>
      )}
    </div>
  );
}
