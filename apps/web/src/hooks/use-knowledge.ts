"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";

export interface KnowledgeSource {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: "processing" | "ready" | "error";
  error_message: string | null;
  chunk_count: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

interface SourcesResponse {
  sources: KnowledgeSource[];
  total: number;
}

interface UploadResponse {
  source_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  chunk_count: number;
}

interface SourceDetailResponse {
  source: KnowledgeSource;
  chunks: SourceChunk[];
}

export interface SourceChunk {
  id: string;
  chunk_index: number;
  content: string;
  token_count: number;
}

export function useKnowledgeSources() {
  const query = useQuery({
    queryKey: ["knowledge-sources"],
    queryFn: () => apiClient.get<SourcesResponse>("/knowledge/sources"),
    refetchInterval: 5000,
  });

  return {
    sources: query.data?.sources ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/knowledge/upload`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new ApiError(res.status, body.detail || "Upload failed");
      }

      return res.json() as Promise<UploadResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-sources"] });
      toast.success(`"${data.filename}" uploaded successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Upload failed");
    },
  });

  return {
    uploadFile: mutation.mutateAsync,
    isUploading: mutation.isPending,
  };
}

export function useDeleteSource() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/knowledge/sources/${id}`),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["knowledge-sources"] });

      const previous = queryClient.getQueryData<SourcesResponse>([
        "knowledge-sources",
      ]);

      queryClient.setQueryData<SourcesResponse>(["knowledge-sources"], (old) => {
        if (!old) return old;
        return {
          ...old,
          sources: old.sources.filter((s) => s.id !== deletedId),
          total: old.total - 1,
        };
      });

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["knowledge-sources"], context.previous);
      }
      toast.error("Failed to delete document");
    },
    onSuccess: () => {
      toast.success("Document deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-sources"] });
    },
  });

  return {
    deleteSource: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

export function useSourceDetail(sourceId: string) {
  const query = useQuery({
    queryKey: ["knowledge-source", sourceId],
    queryFn: () =>
      apiClient.get<SourceDetailResponse>(`/knowledge/sources/${sourceId}`),
    enabled: !!sourceId,
  });

  return {
    source: query.data?.source ?? null,
    chunks: query.data?.chunks ?? [],
    isLoading: query.isLoading,
  };
}
