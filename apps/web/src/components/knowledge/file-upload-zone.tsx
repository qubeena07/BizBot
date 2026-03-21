"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText } from "lucide-react";
import { toast } from "sonner";
import { useUploadFile } from "@/hooks/use-knowledge";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".csv"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileUploadZoneProps {
  compact?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
}

function getFileExtension(name: string): string {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

function isValidFile(file: File): { valid: boolean; error?: string } {
  const ext = getFileExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
    return { valid: false, error: `"${file.name}" is not a supported file type` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File too large. Max 10MB on free plan." };
  }
  return { valid: true };
}

function getFileColor(name: string): string {
  const ext = getFileExtension(name);
  switch (ext) {
    case ".pdf":
      return "#EF4444";
    case ".docx":
      return "#3B82F6";
    case ".csv":
      return "#22C55E";
    default:
      return "#71717A";
  }
}

function CircularProgress({ progress, size = 48 }: { progress: number; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#27272A"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E07A5F"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-90 fill-[#FAFAF9] text-[10px] font-medium"
        style={{ transformOrigin: "center" }}
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
}

function SuccessCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3D8B7A]/10"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M5 13l4 4L19 7"
          stroke="#3D8B7A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        />
      </svg>
    </motion.div>
  );
}

export function FileUploadZone({ compact = false }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const { uploadFile } = useUploadFile();

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];

      for (const file of fileArray) {
        const result = isValidFile(file);
        if (!result.valid) {
          toast.error(result.error);
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      // Upload sequentially
      for (const file of validFiles) {
        const entry: UploadingFile = { file, progress: 0, status: "uploading" };
        setUploadingFiles((prev) => [...prev, entry]);

        // Simulate progress since fetch doesn't provide upload progress natively
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file && f.status === "uploading" && f.progress < 90
                ? { ...f, progress: f.progress + Math.random() * 15 }
                : f
            )
          );
        }, 200);

        try {
          await uploadFile(file);

          clearInterval(progressInterval);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, progress: 100, status: "success" } : f
            )
          );

          // Remove from uploading list after 1.5s
          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
          }, 1500);
        } catch {
          clearInterval(progressInterval);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, status: "error" } : f
            )
          );
          // Remove error entry after 3s
          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
          }, 3000);
        }
      }
    },
    [uploadFile]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      // Only set false if leaving the container, not entering a child
      if (zoneRef.current && !zoneRef.current.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        // Reset input so same file can be selected again
        e.target.value = "";
      }
    },
    [processFiles]
  );

  const isUploading = uploadingFiles.length > 0;

  return (
    <motion.div
      ref={zoneRef}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        borderColor: isDragOver ? "#E07A5F" : "#27272A",
        backgroundColor: isDragOver ? "rgba(224,122,95,0.05)" : "rgba(20,20,22,0.5)",
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed",
        compact ? "h-[120px]" : "min-h-[300px]",
        isDragOver && "border-solid"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.csv"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-4"
          >
            {uploadingFiles.map((entry) => (
              <motion.div
                key={entry.file.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-4"
              >
                {entry.status === "success" ? (
                  <SuccessCheckmark />
                ) : (
                  <CircularProgress progress={Math.min(entry.progress, 99)} />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <FileText
                      className="h-4 w-4"
                      style={{ color: getFileColor(entry.file.name) }}
                    />
                    <span className="text-sm font-medium text-[#FAFAF9]">
                      {entry.file.name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#71717A]">
                    {entry.status === "success"
                      ? "Uploaded!"
                      : entry.status === "error"
                        ? "Upload failed"
                        : `Uploading...`}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-3"
          >
            {!compact && (
              <motion.div
                animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <UploadCloud className="h-12 w-12 text-[#3F3F46]" />
              </motion.div>
            )}
            {!compact && (
              <p className="text-lg font-medium text-[#A1A1AA]">
                Drag & drop your files here
              </p>
            )}
            <div className="flex items-center gap-3">
              {!compact && <span className="text-xs text-[#71717A]">or</span>}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-[#E07A5F] px-4 py-2 text-sm font-medium text-[#E07A5F] transition-colors hover:bg-[#E07A5F]/10"
              >
                Browse files
              </button>
            </div>
            <p className="text-xs text-[#71717A]">
              .pdf, .docx, .txt, .csv — Max 10MB
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
