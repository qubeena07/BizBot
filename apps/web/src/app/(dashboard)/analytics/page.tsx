"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  MessagesSquare,
  BookOpen,
  Zap,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { useAnalyticsOverview, useAnalyticsChart } from "@/hooks/use-analytics";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/shared/loading-skeleton";
import { ChartContainer } from "@/components/analytics/chart-container";
import { CustomTooltip } from "@/components/analytics/custom-tooltip";

const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

function formatXAxisDate(date: string, period: Period) {
  const d = new Date(date);
  if (period === "7d") {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isAllZeros(data: Array<{ value: number }>): boolean {
  return data.every((d) => d.value === 0);
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7d");

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useAnalyticsOverview();

  const {
    data: convChart,
    isLoading: convLoading,
    error: convError,
    refetch: refetchConv,
  } = useAnalyticsChart("conversations", period);

  const {
    data: msgChart,
    isLoading: msgLoading,
    error: msgError,
    refetch: refetchMsg,
  } = useAnalyticsChart("messages", period);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#FAFAF9]">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-[#71717A]">
            Track your chatbot&apos;s performance and usage metrics.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 rounded-lg border border-[#27272A] bg-[#141416] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                period === p.value
                  ? "border border-[#E07A5F]/30 bg-[#E07A5F]/10 text-[#E07A5F]"
                  : "border border-transparent text-[#A1A1AA] hover:text-[#FAFAF9]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      {overviewLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : overviewError ? (
        <div className="rounded-xl border border-[#27272A] bg-[#141416] p-6 text-center">
          <p className="text-sm text-[#A1A1AA]">Failed to load metrics.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm font-medium text-[#E07A5F] hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            label="Conversations Today"
            value={overview?.conversations_today?.value ?? 0}
            changePct={overview?.conversations_today?.change_pct}
            icon={MessageSquare}
            color="#E07A5F"
          />
          <StatCard
            label="Total Messages"
            value={overview?.total_messages?.value ?? 0}
            changePct={overview?.total_messages?.change_pct}
            icon={MessagesSquare}
            color="#3D8B7A"
          />
          <StatCard
            label="Active Sources"
            value={overview?.active_knowledge_sources?.value ?? 0}
            icon={BookOpen}
            color="#6366F1"
          />
          <StatCard
            label="Avg Response Time"
            value={overview?.avg_response_time_ms?.value ?? 0}
            suffix="ms"
            icon={Zap}
            color="#F59E0B"
          />
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conversations line chart */}
        <ChartContainer
          title="Conversations"
          total={convChart?.total}
          isLoading={convLoading}
          error={convError ?? undefined}
          onRetry={() => refetchConv()}
        >
          {convChart?.data && isAllZeros(convChart.data) ? (
            <div
              className="flex items-center justify-center"
              style={{ height: 300 }}
            >
              <div className="text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-[#27272A]" />
                <p className="mt-2 text-sm text-[#71717A]">
                  No data for this period yet
                </p>
              </div>
            </div>
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={convChart?.data ?? []}>
                  <defs>
                    <linearGradient
                      id="conversationGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#E07A5F"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="100%"
                        stopColor="#E07A5F"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272A"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#71717A"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d) => formatXAxisDate(d, period)}
                  />
                  <YAxis
                    stroke="#71717A"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip metricLabel="conversations" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#E07A5F"
                    strokeWidth={2}
                    fill="url(#conversationGradient)"
                    dot={{ fill: "#E07A5F", r: 4, strokeWidth: 0 }}
                    activeDot={{
                      r: 6,
                      stroke: "#E07A5F",
                      strokeWidth: 2,
                      fill: "#0A0A0B",
                    }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartContainer>

        {/* Messages bar chart */}
        <ChartContainer
          title="Messages"
          total={msgChart?.total}
          isLoading={msgLoading}
          error={msgError ?? undefined}
          onRetry={() => refetchMsg()}
        >
          {msgChart?.data && isAllZeros(msgChart.data) ? (
            <div
              className="flex items-center justify-center"
              style={{ height: 300 }}
            >
              <div className="text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-[#27272A]" />
                <p className="mt-2 text-sm text-[#71717A]">
                  No data for this period yet
                </p>
              </div>
            </div>
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={msgChart?.data ?? []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272A"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#71717A"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d) => formatXAxisDate(d, period)}
                  />
                  <YAxis
                    stroke="#71717A"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip metricLabel="messages" />}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3D8B7A"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartContainer>
      </div>
    </motion.div>
  );
}
