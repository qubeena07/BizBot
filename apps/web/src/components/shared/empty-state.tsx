"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C1C1F]">
        <Icon className="h-8 w-8 text-[#3F3F46]" />
      </div>
      <h3 className="mt-4 font-heading text-lg font-medium text-[#FAFAF9]">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[#71717A]">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-lg bg-[#E07A5F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E07A5F]/90"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
