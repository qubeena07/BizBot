"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ProcessingStatusProps {
  filename: string;
  status: "processing" | "ready" | "error";
}

function BouncingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

function AnimatedCheckmark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <motion.path
        d="M3 8.5L6.5 12L13 4"
        stroke="#3D8B7A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export function ProcessingStatus({ filename, status }: ProcessingStatusProps) {
  return (
    <AnimatePresence mode="wait">
      {status === "processing" && (
        <motion.div
          key="processing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2"
        >
          <BouncingDots />
          <span className="text-xs text-amber-400">
            Processing {filename}...
          </span>
        </motion.div>
      )}

      {status === "ready" && (
        <motion.div
          key="ready"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5"
        >
          <AnimatedCheckmark />
          <span className="text-xs text-[#3D8B7A]">Ready</span>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5"
        >
          <AlertCircle className="h-3.5 w-3.5 text-[#EF4444]" />
          <span className="text-xs text-[#EF4444]">Failed</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
