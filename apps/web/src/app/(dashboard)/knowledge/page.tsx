"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { useKnowledgeSources } from "@/hooks/use-knowledge";
import { FileUploadZone } from "@/components/knowledge/file-upload-zone";
import { SourceList } from "@/components/knowledge/source-list";
import { SourceCardSkeleton } from "@/components/shared/loading-skeleton";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function KnowledgePage() {
  const { sources, isLoading, error, refetch } = useKnowledgeSources();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSources = sources.length > 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-[#FAFAF9]">
            Knowledge Base
          </h2>
          <p className="mt-1 text-sm text-[#71717A]">
            Train your AI with your business documents
          </p>
        </div>
        {hasSources && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-[#E07A5F] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E07A5F]/90"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        )}
      </div>

      {/* Hidden file input for the header button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.csv"
        multiple
        onChange={() => {}}
        className="hidden"
      />

      {/* Error state */}
      {error ? (
        <div className="rounded-xl border border-[#27272A] bg-[#141416] p-8 text-center">
          <p className="text-sm text-[#A1A1AA]">Failed to load knowledge sources.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm font-medium text-[#E07A5F] hover:underline"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        /* Loading skeleton grid */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SourceCardSkeleton key={i} />
          ))}
        </div>
      ) : !hasSources ? (
        /* Empty state: large hero upload zone */
        <div className="space-y-6">
          <FileUploadZone compact={false} />
          <div className="rounded-xl border border-[#27272A] bg-[#141416] p-6">
            <h3 className="font-heading text-sm font-semibold text-[#FAFAF9]">
              Getting started
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Supported formats",
                  desc: "PDF, DOCX, TXT, and CSV files",
                },
                {
                  title: "Max file size",
                  desc: "10MB per file on the free plan",
                },
                {
                  title: "Auto-processing",
                  desc: "Files are chunked and embedded automatically",
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="rounded-lg bg-[#1C1C1F] p-4"
                >
                  <p className="text-sm font-medium text-[#FAFAF9]">{tip.title}</p>
                  <p className="mt-1 text-xs text-[#71717A]">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Has sources: compact upload strip + source grid */
        <div className="space-y-6">
          <FileUploadZone compact />
          <SourceList sources={sources} />
        </div>
      )}
    </motion.div>
  );
}
