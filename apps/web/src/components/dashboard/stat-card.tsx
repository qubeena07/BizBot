"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatCardSkeleton } from "@/components/shared/loading-skeleton";

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

interface StatCardProps {
  label: string;
  value: number;
  changePct?: number;
  icon: LucideIcon;
  color: string;
  suffix?: string;
  isLoading?: boolean;
}

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className="text-3xl font-bold text-[#FAFAF9]">
      <motion.span>{display}</motion.span>
      {suffix && <span className="ml-0.5 text-xl text-[#A1A1AA]">{suffix}</span>}
    </motion.span>
  );
}

export function StatCard({
  label,
  value,
  changePct,
  icon: Icon,
  color,
  suffix,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  const isPositive = changePct !== undefined && changePct >= 0;

  return (
    <motion.div
      variants={cardVariants}
      className="group rounded-xl border border-[#27272A] bg-[#141416] p-5 transition-all duration-300 hover:border-[#3F3F46]"
      style={{
        boxShadow: "none",
      }}
      whileHover={{
        boxShadow: `0 0 30px ${color}0D`,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1A` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {changePct !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(changePct)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      <p className="mt-1 text-sm text-[#A1A1AA]">{label}</p>
    </motion.div>
  );
}
