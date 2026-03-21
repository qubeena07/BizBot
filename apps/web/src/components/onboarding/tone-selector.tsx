"use client";

import { motion } from "framer-motion";
import { Briefcase, Smile, Coffee, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToneOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const TONES: ToneOption[] = [
  {
    id: "professional",
    title: "Professional",
    description:
      "Clear, helpful, and business-appropriate. Great for most businesses.",
    icon: Briefcase,
  },
  {
    id: "friendly",
    title: "Friendly",
    description:
      "Warm and approachable, like chatting with a helpful neighbor.",
    icon: Smile,
  },
  {
    id: "casual",
    title: "Casual",
    description:
      "Relaxed and conversational. Perfect for cafés, gyms, and creative businesses.",
    icon: Coffee,
  },
  {
    id: "formal",
    title: "Formal",
    description:
      "Polished and respectful. Ideal for law firms, finance, and luxury brands.",
    icon: Crown,
  },
];

interface ToneSelectorProps {
  value: string | null;
  onChange: (tone: string) => void;
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {TONES.map((tone) => {
        const isSelected = value === tone.id;

        return (
          <motion.button
            key={tone.id}
            type="button"
            onClick={() => onChange(tone.id)}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer",
              isSelected
                ? "border-[#E07A5F] bg-[#E07A5F]/5 border-l-2"
                : "border-[#27272A] bg-[#141416] hover:border-[#3F3F46]"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                isSelected ? "bg-[#E07A5F]/15" : "bg-[#1C1C1F]"
              )}
            >
              <tone.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isSelected ? "text-[#E07A5F]" : "text-[#71717A]"
                )}
              />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "font-medium transition-colors",
                  isSelected ? "text-[#FAFAF9]" : "text-[#A1A1AA]"
                )}
              >
                {tone.title}
              </p>
              <p className="mt-0.5 text-xs text-[#71717A]">
                {tone.description}
              </p>
            </div>

            {isSelected && (
              <motion.div
                layoutId="tone-indicator"
                className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-[#E07A5F]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
