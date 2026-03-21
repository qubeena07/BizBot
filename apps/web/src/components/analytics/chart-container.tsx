"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

interface ChartContainerProps {
  title: string;
  total?: number;
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function ChartContainer({
  title,
  total,
  isLoading,
  error,
  onRetry,
  children,
}: ChartContainerProps) {
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#141416] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#FAFAF9]">{title}</h3>
        {total !== undefined && !isLoading && !error && (
          <span className="rounded-full bg-[#1C1C1F] px-3 py-0.5 text-sm text-[#A1A1AA]">
            {total.toLocaleString()}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3" style={{ height: 300 }}>
          <LoadingSkeleton className="h-full w-full rounded-lg" />
        </div>
      ) : error ? (
        <div
          className="flex flex-col items-center justify-center gap-3"
          style={{ height: 300 }}
        >
          <AlertCircle className="h-8 w-8 text-[#EF4444]" />
          <p className="text-sm text-[#A1A1AA]">Failed to load chart</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 rounded-lg border border-[#27272A] px-3 py-1.5 text-sm text-[#A1A1AA] transition-colors hover:border-[#3F3F46] hover:text-[#FAFAF9]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
