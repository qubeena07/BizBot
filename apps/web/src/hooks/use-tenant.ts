"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface TenantSettings {
  id: string;
  business_name: string;
  bot_name: string;
  welcome_message: string;
  primary_color: string;
  widget_position: "bottom-right" | "bottom-left";
  industry: string | null;
  timezone: string;
  description?: string;
  tone?: string;
  operating_hours?: Record<
    string,
    { open: string; close: string; closed: boolean }
  >;
}

interface OnboardingPayload {
  business_name: string;
  industry: string;
  description: string;
  operating_hours: Record<
    string,
    { open: string; close: string; closed: boolean }
  >;
  timezone: string;
  website_url?: string;
  tone: string;
  bot_name: string;
}

interface OnboardingResponse {
  tenant: TenantSettings;
}

interface WidgetConfig {
  primary_color: string;
  position: "bottom-right" | "bottom-left";
  welcome_message: string;
  avatar_url: string | null;
}

interface WidgetConfigResponse {
  config: WidgetConfig;
  embed_code: string;
  tenant_id: string;
}

export function useOnboarding() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: OnboardingPayload) =>
      apiClient.post<OnboardingResponse>("/tenant/onboarding", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Setup complete!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Onboarding failed");
    },
  });

  return {
    submitOnboarding: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
}

export function useTenantSettings() {
  return useQuery({
    queryKey: ["tenant", "settings"],
    queryFn: () => apiClient.get<TenantSettings>("/tenant/settings"),
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<TenantSettings>) =>
      apiClient.put<TenantSettings>("/tenant/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", "settings"] });
      toast.success("Settings saved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  return {
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useWidgetConfig() {
  const query = useQuery({
    queryKey: ["tenant", "widget-config"],
    queryFn: () => apiClient.get<WidgetConfigResponse>("/tenant/widget-config"),
  });

  return {
    config: query.data?.config ?? null,
    embedCode: query.data?.embed_code ?? "",
    tenantId: query.data?.tenant_id ?? "",
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useUpdateWidgetConfig() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<WidgetConfig>) =>
      apiClient.put<WidgetConfigResponse>("/tenant/widget-config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "widget-config"] });
      toast.success("Widget updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update widget");
    },
  });

  return {
    updateWidget: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
