"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  MessagesSquare,
  BookOpen,
  Zap,
  Upload,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useAnalyticsOverview, useAnalyticsChart } from "@/hooks/use-analytics";
import { useRecentConversations } from "@/hooks/use-conversations";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  StatCardSkeleton,
  ChartSkeleton,
  ConversationListSkeleton,
} from "@/components/shared/loading-skeleton";
import { formatRelativeTime } from "@/lib/utils";

const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#27272A] bg-[#1C1C1F] px-3 py-2 shadow-xl">
      <p className="text-xs text-[#71717A]">{label}</p>
      <p className="text-sm font-semibold text-[#FAFAF9]">{payload[0].value}</p>
    </div>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useAnalyticsOverview();

  const {
    data: chartData,
    isLoading: chartLoading,
    error: chartError,
  } = useAnalyticsChart("conversations", "7d");

  const {
    data: conversations,
    isLoading: convsLoading,
    error: convsError,
  } = useRecentConversations();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (overviewError) {
    toast.error("Failed to load analytics overview");
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h2 className="font-heading text-2xl font-semibold text-[#FAFAF9]">
          Welcome back, {user?.full_name ?? "there"}
        </h2>
        <p className="mt-1 text-sm text-[#71717A]">{today}</p>
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
            label="Knowledge Sources"
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

      {/* Conversations chart */}
      {chartLoading ? (
        <ChartSkeleton />
      ) : chartError ? (
        <div className="rounded-xl border border-[#27272A] bg-[#141416] p-6 text-center">
          <p className="text-sm text-[#A1A1AA]">Failed to load chart data.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm font-medium text-[#E07A5F] hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          className="rounded-xl border border-[#27272A] bg-[#141416] p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold text-[#FAFAF9]">
              Conversations — Last 7 Days
            </h3>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData?.data ?? []}>
                <defs>
                  <linearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E07A5F" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#E07A5F" stopOpacity={0} />
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
                />
                <YAxis
                  stroke="#71717A"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#E07A5F"
                  strokeWidth={2}
                  dot={{ fill: "#E07A5F", r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: "#E07A5F", r: 6, strokeWidth: 2, stroke: "#0A0A0B" }}
                  fill="url(#accentGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Recent conversations */}
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        className="rounded-xl border border-[#27272A] bg-[#141416] p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold text-[#FAFAF9]">
            Recent Conversations
          </h3>
          <button
            onClick={() => router.push("/conversations")}
            className="flex items-center gap-1 text-sm text-[#A1A1AA] transition-colors hover:text-[#FAFAF9]"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {convsLoading ? (
          <ConversationListSkeleton />
        ) : convsError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#A1A1AA]">Failed to load conversations.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm font-medium text-[#E07A5F] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : !conversations?.conversations?.length ? (
          <EmptyState
            icon={MessagesSquare}
            title="No conversations yet"
            description="Upload documents and test your bot to start seeing conversations here."
            actionLabel="Go to Knowledge"
            onAction={() => router.push("/knowledge")}
          />
        ) : (
          <div className="space-y-1">
            {conversations.conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push(`/conversations/${conv.id}`)}
                className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-[#141416]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1C1C1F]">
                  <MessageSquare className="h-4 w-4 text-[#71717A]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#FAFAF9]">
                    {conv.title || "Untitled conversation"}
                  </p>
                  <p className="text-xs text-[#71717A]">
                    {formatRelativeTime(conv.started_at)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#1C1C1F] px-2 py-0.5 text-xs font-medium text-[#A1A1AA]">
                  {conv.message_count} msgs
                </span>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            label: "Upload Document",
            description: "Add knowledge sources to train your bot",
            icon: Upload,
            href: "/knowledge",
          },
          {
            label: "Test Your Bot",
            description: "Try out your AI receptionist in the playground",
            icon: MessageSquare,
            href: "/playground",
          },
          {
            label: "View Analytics",
            description: "See detailed usage metrics and insights",
            icon: BarChart3,
            href: "/analytics",
          },
        ].map((action) => (
          <motion.button
            key={action.label}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            onClick={() => router.push(action.href)}
            className="group flex items-center gap-4 rounded-xl border border-[#27272A] bg-[#141416] p-5 text-left transition-all duration-300 hover:border-[#E07A5F]/30"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1C1C1F] transition-colors group-hover:bg-[#E07A5F]/10">
              <action.icon className="h-5 w-5 text-[#71717A] transition-colors group-hover:text-[#E07A5F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#FAFAF9]">{action.label}</p>
              <p className="mt-0.5 text-xs text-[#71717A]">{action.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
