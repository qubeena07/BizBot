"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface MetricValue {
  value: number;
  change_pct: number;
  label: string;
}

export interface AnalyticsOverviewResponse {
  total_conversations: MetricValue;
  total_messages: MetricValue;
  active_knowledge_sources: MetricValue;
  total_chunks: MetricValue;
  avg_response_time_ms: MetricValue;
  conversations_today: MetricValue;
  messages_today: MetricValue;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface AnalyticsChartResponse {
  data: ChartDataPoint[];
  metric: string;
  period: string;
  total: number;
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => apiClient.get<AnalyticsOverviewResponse>("/analytics/overview"),
    staleTime: 30 * 1000,
  });
}

export function useAnalyticsChart(metric: string, period: string) {
  return useQuery({
    queryKey: ["analytics", "chart", metric, period],
    queryFn: () =>
      apiClient.get<AnalyticsChartResponse>(
        `/analytics/chart?metric=${metric}&period=${period}`
      ),
    staleTime: 30 * 1000,
  });
}
