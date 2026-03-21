"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sheet,
  Layers,
  HardDrive,
  Clock,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { useDeleteSource, useSourceDetail } from "@/hooks/use-knowledge";
import type { KnowledgeSource } from "@/hooks/use-knowledge";
import { ProcessingStatus } from "@/components/knowledge/processing-status";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { formatFileSize, formatRelativeTime } from "@/lib/utils";

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

interface SourceListProps {
  sources: KnowledgeSource[];
}

function getFileIcon(fileType: string) {
  const ext = fileType.toLowerCase();
  if (ext.includes("csv") || ext.includes("spreadsheet")) {
    return { Icon: Sheet, bg: "bg-green-500/10", text: "text-green-400" };
  }
  if (ext.includes("pdf")) {
    return { Icon: FileText, bg: "bg-red-500/10", text: "text-red-400" };
  }
  if (ext.includes("doc") || ext.includes("word")) {
    return { Icon: FileText, bg: "bg-blue-500/10", text: "text-blue-400" };
  }
  return { Icon: FileText, bg: "bg-zinc-500/10", text: "text-zinc-400" };
}

function StatusBadge({ status }: { status: KnowledgeSource["status"] }) {
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Processing
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Ready
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
      <AlertCircle className="h-3 w-3" />
      Error
    </span>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

interface DeleteDialogProps {
  source: KnowledgeSource;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteDialog({ source, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-md rounded-xl border border-[#27272A] bg-[#1C1C1F] p-6 shadow-2xl"
      >
        <h3 className="font-heading text-lg font-semibold text-[#FAFAF9]">
          Delete document?
        </h3>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          This will permanently remove &ldquo;{source.original_filename}&rdquo; and
          all its {source.chunk_count} knowledge chunks. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#A1A1AA] transition-colors hover:bg-[#27272A] hover:text-[#FAFAF9]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Source Detail Drawer ─────────────────────────────────────────────────────

interface DetailDrawerProps {
  sourceId: string;
  onClose: () => void;
}

function DetailDrawer({ sourceId, onClose }: DetailDrawerProps) {
  const { source, chunks, isLoading } = useSourceDetail(sourceId);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());

  const toggleChunk = (index: number) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col border-l border-[#27272A] bg-[#0A0A0B]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-4">
          <h3 className="font-heading text-lg font-semibold text-[#FAFAF9]">
            Source Details
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#71717A] transition-colors hover:bg-[#1C1C1F] hover:text-[#FAFAF9]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <LoadingSkeleton className="h-6 w-48" />
            <LoadingSkeleton className="h-4 w-32" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : source ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* Metadata */}
            <div className="border-b border-[#27272A] px-6 py-4">
              <p className="text-sm font-medium text-[#FAFAF9]">
                {source.original_filename}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#71717A]">
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {source.chunk_count} chunks
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {formatFileSize(source.file_size)}
                </span>
                <span>{source.total_tokens.toLocaleString()} tokens</span>
              </div>
              <div className="mt-2">
                <StatusBadge status={source.status} />
              </div>
              {source.status === "processing" && (
                <div className="mt-3">
                  <ProcessingStatus
                    filename={source.original_filename}
                    status={source.status}
                  />
                </div>
              )}
            </div>

            {/* Chunks list */}
            <div className="px-6 py-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#71717A]">
                Chunks ({chunks.length})
              </h4>
              <div className="space-y-2">
                {chunks.map((chunk) => {
                  const isExpanded = expandedChunks.has(chunk.chunk_index);
                  const content = chunk.content;
                  const truncated = content.length > 500;
                  const displayContent =
                    truncated && !isExpanded
                      ? content.slice(0, 500) + "..."
                      : content;

                  return (
                    <div
                      key={chunk.id}
                      className={`rounded-lg p-4 ${
                        chunk.chunk_index % 2 === 0
                          ? "bg-[#141416]"
                          : "bg-[#1C1C1F]"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#71717A]">
                          Chunk #{chunk.chunk_index + 1}
                        </span>
                        <span className="rounded bg-[#27272A] px-1.5 py-0.5 text-[10px] font-medium text-[#A1A1AA]">
                          {chunk.token_count} tokens
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#A1A1AA]">
                        {displayContent}
                      </p>
                      {truncated && (
                        <button
                          onClick={() => toggleChunk(chunk.chunk_index)}
                          className="mt-2 text-xs font-medium text-[#E07A5F] hover:underline"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-[#71717A]">Source not found.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Source Card ───────────────────────────────────────────────────────────────

interface SourceCardProps {
  source: KnowledgeSource;
  onViewChunks: (id: string) => void;
  onDelete: (source: KnowledgeSource) => void;
}

function SourceCard({ source, onViewChunks, onDelete }: SourceCardProps) {
  const fileInfo = getFileIcon(source.file_type);

  return (
    <motion.div
      variants={cardVariants}
      className="group rounded-xl border border-[#27272A] bg-[#141416] p-5 transition-all duration-300 hover:border-[#3F3F46] hover:shadow-lg hover:shadow-black/20"
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${fileInfo.bg}`}
        >
          <fileInfo.Icon className={`h-5 w-5 ${fileInfo.text}`} />
        </div>
        <StatusBadge status={source.status} />
      </div>

      {/* Filename */}
      <p className="mt-3 truncate text-sm font-medium text-[#FAFAF9]">
        {source.original_filename}
      </p>

      {/* Metadata */}
      <div className="mt-2 flex gap-4 text-xs text-[#71717A]">
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3" />
          {source.chunk_count} chunks
        </span>
        <span className="flex items-center gap-1">
          <HardDrive className="h-3 w-3" />
          {formatFileSize(source.file_size)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(source.created_at)}
        </span>
      </div>

      {/* Error message */}
      {source.status === "error" && source.error_message && (
        <p className="mt-2 line-clamp-2 text-xs text-red-400">
          {source.error_message}
        </p>
      )}

      {/* Processing inline status */}
      {source.status === "processing" && (
        <div className="mt-3">
          <ProcessingStatus
            filename={source.original_filename}
            status={source.status}
          />
        </div>
      )}

      {/* Actions (visible on hover) */}
      <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onViewChunks(source.id)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:bg-[#1C1C1F] hover:text-[#FAFAF9]"
        >
          <Eye className="h-3.5 w-3.5" />
          View chunks
        </button>
        <button
          onClick={() => onDelete(source)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

// ─── Source List ───────────────────────────────────────────────────────────────

export function SourceList({ sources }: SourceListProps) {
  const { deleteSource } = useDeleteSource();
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeSource | null>(null);
  const [detailSourceId, setDetailSourceId] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await deleteSource(target.id);
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            onViewChunks={setDetailSourceId}
            onDelete={setDeleteTarget}
          />
        ))}
      </motion.div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteDialog
            source={deleteTarget}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Detail drawer */}
      <AnimatePresence>
        {detailSourceId && (
          <DetailDrawer
            sourceId={detailSourceId}
            onClose={() => setDetailSourceId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
