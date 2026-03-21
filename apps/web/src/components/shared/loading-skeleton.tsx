"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function LoadingSkeleton({ className, style }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-[#1C1C1F]",
        className
      )}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#27272A]/40 to-transparent" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#141416] p-5">
      <div className="flex items-start justify-between">
        <LoadingSkeleton className="h-10 w-10 rounded-lg" />
        <LoadingSkeleton className="h-5 w-16 rounded-full" />
      </div>
      <LoadingSkeleton className="mt-4 h-8 w-24" />
      <LoadingSkeleton className="mt-2 h-4 w-32" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#141416] p-6">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-6 w-40" />
        <LoadingSkeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="mt-6 flex items-end gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <LoadingSkeleton
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${40 + Math.random() * 80}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SourceCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#141416] p-5">
      <div className="flex items-start justify-between">
        <LoadingSkeleton className="h-10 w-10 rounded-lg" />
        <LoadingSkeleton className="h-5 w-20 rounded-full" />
      </div>
      <LoadingSkeleton className="mt-3 h-4 w-40" />
      <div className="mt-2 flex gap-4">
        <LoadingSkeleton className="h-3 w-16" />
        <LoadingSkeleton className="h-3 w-14" />
        <LoadingSkeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg px-4 py-3">
          <LoadingSkeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-4 w-48" />
            <LoadingSkeleton className="h-3 w-24" />
          </div>
          <LoadingSkeleton className="h-5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}
