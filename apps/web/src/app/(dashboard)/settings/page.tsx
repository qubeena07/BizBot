"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Palette,
  Key,
  Copy,
  Check,
  MessageSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  useTenantSettings,
  useUpdateTenantSettings,
  useWidgetConfig,
  useUpdateWidgetConfig,
} from "@/hooks/use-tenant";
import { ToneSelector } from "@/components/onboarding/tone-selector";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils";

// --- Constants ---

const INDUSTRIES = [
  { id: "restaurant", label: "Restaurant / Café" },
  { id: "healthcare", label: "Healthcare / Clinic" },
  { id: "legal", label: "Law Firm" },
  { id: "realestate", label: "Real Estate" },
  { id: "salon", label: "Salon / Spa" },
  { id: "automotive", label: "Auto Shop / Dealer" },
  { id: "fitness", label: "Gym / Fitness" },
  { id: "ecommerce", label: "E-commerce / Retail" },
  { id: "education", label: "Education / Tutoring" },
  { id: "other", label: "Other" },
];

const TIMEZONES = [
  "US/Eastern",
  "US/Central",
  "US/Mountain",
  "US/Pacific",
  "US/Alaska",
  "US/Hawaii",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
];

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const TIME_OPTIONS = (() => {
  const times: string[] = [];
  for (let h = 6; h <= 23; h++) {
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const suffix = h >= 12 ? "PM" : "AM";
    times.push(`${hour12}:00 ${suffix}`);
    times.push(`${hour12}:30 ${suffix}`);
  }
  return times;
})();

const PRESET_COLORS = [
  "#E07A5F",
  "#3D8B7A",
  "#6366F1",
  "#EF4444",
  "#F59E0B",
  "#8B5CF6",
];

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "widget", label: "Widget", icon: Palette },
  { id: "api", label: "API & Usage", icon: Key },
] as const;

type TabId = (typeof TABS)[number]["id"];

// --- General Tab ---

function GeneralTab() {
  const { data: settings, isLoading } = useTenantSettings();
  const { updateSettings, isUpdating } = useUpdateTenantSettings();

  const [form, setForm] = useState({
    business_name: "",
    industry: "",
    description: "",
    bot_name: "",
    tone: "" as string | null,
    timezone: "US/Eastern",
    operating_hours: {} as Record<
      string,
      { open: string; close: string; closed: boolean }
    >,
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setForm({
        business_name: settings.business_name ?? "",
        industry: settings.industry ?? "",
        description: settings.description ?? "",
        bot_name: settings.bot_name ?? "",
        tone: settings.tone ?? null,
        timezone: settings.timezone ?? "US/Eastern",
        operating_hours: settings.operating_hours ?? {},
      });
      setInitialized(true);
    }
  }, [settings, initialized]);

  const handleSave = useCallback(async () => {
    try {
      await updateSettings({
        business_name: form.business_name,
        industry: form.industry || null,
        description: form.description,
        bot_name: form.bot_name,
        tone: form.tone,
        timezone: form.timezone,
        operating_hours: form.operating_hours,
      } as Record<string, unknown>);
    } catch {
      // Error handled by mutation
    }
  }, [form, updateSettings]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const hasHours = Object.keys(form.operating_hours).length > 0;

  return (
    <div className="space-y-6">
      {/* Business name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
          Business Name
        </label>
        <input
          type="text"
          value={form.business_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, business_name: e.target.value }))
          }
          className="w-full rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 text-sm text-[#FAFAF9] placeholder:text-[#71717A] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
        />
      </div>

      {/* Industry */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
          Industry
        </label>
        <select
          value={form.industry}
          onChange={(e) =>
            setForm((f) => ({ ...f, industry: e.target.value }))
          }
          className="w-full rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 text-sm text-[#FAFAF9] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
        >
          <option value="">Select industry</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind.id} value={ind.id}>
              {ind.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={3}
          className="w-full resize-none rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 text-sm text-[#FAFAF9] placeholder:text-[#71717A] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
        />
      </div>

      {/* Bot name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
          Bot Name
        </label>
        <input
          type="text"
          value={form.bot_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, bot_name: e.target.value }))
          }
          className="w-full rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 text-sm text-[#FAFAF9] placeholder:text-[#71717A] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
        />
      </div>

      {/* Tone */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[#FAFAF9]">
          Tone
        </label>
        <ToneSelector
          value={form.tone}
          onChange={(tone) => setForm((f) => ({ ...f, tone }))}
        />
      </div>

      {/* Operating hours */}
      {hasHours && (
        <div>
          <label className="mb-3 block text-sm font-medium text-[#FAFAF9]">
            Operating Hours
          </label>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const hours = form.operating_hours[day];
              if (!hours) return null;
              return (
                <div
                  key={day}
                  className="flex items-center gap-3 rounded-lg border border-[#27272A] bg-[#141416] px-3 py-2"
                >
                  <span className="w-10 text-sm font-medium text-[#A1A1AA]">
                    {DAY_LABELS[day]}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        operating_hours: {
                          ...f.operating_hours,
                          [day]: {
                            ...f.operating_hours[day],
                            closed: !f.operating_hours[day].closed,
                          },
                        },
                      }))
                    }
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      hours.closed ? "bg-[#27272A]" : "bg-[#3D8B7A]"
                    }`}
                  >
                    <motion.div
                      animate={{ x: hours.closed ? 2 : 18 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
                    />
                  </button>
                  <select
                    value={hours.open}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        operating_hours: {
                          ...f.operating_hours,
                          [day]: { ...f.operating_hours[day], open: e.target.value },
                        },
                      }))
                    }
                    disabled={hours.closed}
                    className="rounded border border-[#27272A] bg-[#1C1C1F] px-2 py-1 text-xs text-[#FAFAF9] disabled:opacity-30 focus:border-[#E07A5F] focus:outline-none"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-[#71717A]">–</span>
                  <select
                    value={hours.close}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        operating_hours: {
                          ...f.operating_hours,
                          [day]: {
                            ...f.operating_hours[day],
                            close: e.target.value,
                          },
                        },
                      }))
                    }
                    disabled={hours.closed}
                    className="rounded border border-[#27272A] bg-[#1C1C1F] px-2 py-1 text-xs text-[#FAFAF9] disabled:opacity-30 focus:border-[#E07A5F] focus:outline-none"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timezone */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
          Timezone
        </label>
        <select
          value={form.timezone}
          onChange={(e) =>
            setForm((f) => ({ ...f, timezone: e.target.value }))
          }
          className="w-full rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 text-sm text-[#FAFAF9] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="flex items-center gap-2 rounded-lg bg-[#E07A5F] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E07A5F]/90 disabled:opacity-50"
        >
          {isUpdating && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
            />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}

// --- Widget Tab ---

function WidgetPreview({
  color,
  position,
  welcomeMessage,
  botName,
}: {
  color: string;
  position: "bottom-right" | "bottom-left";
  welcomeMessage: string;
  botName: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative h-[400px] w-[320px] rounded-xl border border-[#27272A] bg-[#0A0A0B] p-4">
      <p className="mb-3 text-center text-xs text-[#71717A]">Live Preview</p>

      <div className="relative h-[340px]">
        {/* Chat window preview */}
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
              "absolute bottom-16 w-[280px] overflow-hidden rounded-xl border border-[#27272A] bg-[#141416] shadow-2xl",
              position === "bottom-right" ? "right-0" : "left-0"
            )}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ backgroundColor: color }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                  {botName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">
                  {botName}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="space-y-3 p-3">
              <div className="max-w-[200px] rounded-lg rounded-tl-none bg-[#1C1C1F] px-3 py-2">
                <p className="text-xs text-[#FAFAF9]">
                  {welcomeMessage || "Hello! How can I help you today?"}
                </p>
              </div>
              <div className="flex justify-end">
                <div
                  className="max-w-[200px] rounded-lg rounded-tr-none px-3 py-2"
                  style={{ backgroundColor: color }}
                >
                  <p className="text-xs text-white">
                    What are your hours?
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-[#27272A] px-3 py-2">
              <div className="rounded-lg bg-[#1C1C1F] px-3 py-2 text-xs text-[#71717A]">
                Type a message...
              </div>
            </div>
          </motion.div>
        )}

        {/* Bubble */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "absolute bottom-0 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105",
            position === "bottom-right" ? "right-0" : "left-0"
          )}
          style={{ backgroundColor: color }}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  );
}

function WidgetTab() {
  const {
    config,
    embedCode,
    tenantId,
    isLoading,
  } = useWidgetConfig();
  const { updateWidget, isUpdating } = useUpdateWidgetConfig();

  const [form, setForm] = useState({
    primary_color: "#E07A5F",
    position: "bottom-right" as "bottom-right" | "bottom-left",
    welcome_message: "",
  });
  const [botName, setBotName] = useState("AI Assistant");
  const [copied, setCopied] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Get bot name from tenant settings
  const { data: tenantSettings } = useTenantSettings();

  useEffect(() => {
    if (config && !initialized) {
      setForm({
        primary_color: config.primary_color || "#E07A5F",
        position: config.position || "bottom-right",
        welcome_message: config.welcome_message || "",
      });
      setInitialized(true);
    }
  }, [config, initialized]);

  useEffect(() => {
    if (tenantSettings?.bot_name) {
      setBotName(tenantSettings.bot_name);
    }
  }, [tenantSettings]);

  const handleSave = useCallback(async () => {
    try {
      await updateWidget({
        primary_color: form.primary_color,
        position: form.position,
        welcome_message: form.welcome_message,
      });
    } catch {
      // Error handled by mutation
    }
  }, [form, updateWidget]);

  const handleCopyCode = useCallback(async () => {
    const code =
      embedCode ||
      `<script src="https://cdn.bizbot.ai/w/${tenantId}.js" async></script>`;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Embed code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success("Embed code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [embedCode, tenantId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-64 w-full" />
        <LoadingSkeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Form side */}
        <div className="space-y-6">
          {/* Primary color */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={form.primary_color}
                onChange={(e) =>
                  setForm((f) => ({ ...f, primary_color: e.target.value }))
                }
                placeholder="#E07A5F"
                className="w-32 rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 font-mono text-sm text-[#FAFAF9] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
              />
              <div
                className="h-10 w-10 rounded-lg border border-[#27272A]"
                style={{ backgroundColor: form.primary_color }}
              />
            </div>
            <div className="mt-3 flex gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setForm((f) => ({ ...f, primary_color: color }))
                  }
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                    form.primary_color === color
                      ? "border-white scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
              Position
            </label>
            <div className="flex gap-2">
              {(
                [
                  ["bottom-right", "Bottom Right"],
                  ["bottom-left", "Bottom Left"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() =>
                    setForm((f) => ({ ...f, position: val }))
                  }
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    form.position === val
                      ? "border-[#E07A5F] bg-[#E07A5F]/10 text-[#E07A5F]"
                      : "border-[#27272A] bg-[#141416] text-[#A1A1AA] hover:border-[#3F3F46]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Welcome message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
              Welcome Message
            </label>
            <textarea
              value={form.welcome_message}
              onChange={(e) =>
                setForm((f) => ({ ...f, welcome_message: e.target.value }))
              }
              rows={3}
              placeholder="Hello! How can I help you today?"
              className="w-full resize-none rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 text-sm text-[#FAFAF9] placeholder:text-[#71717A] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="flex items-center gap-2 rounded-lg bg-[#E07A5F] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E07A5F]/90 disabled:opacity-50"
          >
            {isUpdating && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
              />
            )}
            Save Widget
          </button>
        </div>

        {/* Preview side */}
        <div className="flex justify-center lg:justify-end">
          <WidgetPreview
            color={form.primary_color}
            position={form.position}
            welcomeMessage={form.welcome_message}
            botName={botName}
          />
        </div>
      </div>

      {/* Embed code */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[#FAFAF9]">
          Embed Code
        </label>
        <div className="rounded-lg border border-[#27272A] bg-[#0A0A0B] p-4">
          <code className="block font-mono text-sm text-[#A1A1AA]">
            {embedCode ||
              `<script src="https://cdn.bizbot.ai/w/${tenantId}.js" async></script>`}
          </code>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 rounded-lg border border-[#E07A5F] px-4 py-2 text-sm font-medium text-[#E07A5F] transition-colors hover:bg-[#E07A5F]/10"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Code
              </>
            )}
          </button>
          <p className="text-xs text-[#71717A]">
            Add this code before the closing &lt;/body&gt; tag of your website.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- API & Usage Tab ---

function ApiTab() {
  const { tenant } = useAuth();
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = useCallback(async () => {
    if (!tenant?.id) return;
    try {
      await navigator.clipboard.writeText(tenant.id);
      setCopiedId(true);
      toast.success("Tenant ID copied");
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = tenant.id;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(true);
      toast.success("Tenant ID copied");
      setTimeout(() => setCopiedId(false), 2000);
    }
  }, [tenant?.id]);

  // Placeholder usage values
  const plan = tenant?.plan ?? "free";
  const isPro = plan === "pro";
  const messagesUsed = 247;
  const messagesLimit = isPro ? 10000 : 500;
  const sourcesUsed = 3;
  const sourcesLimit = isPro ? 50 : 5;
  const teamUsed = 1;
  const teamLimit = isPro ? 10 : 1;
  const usagePct = (messagesUsed / messagesLimit) * 100;
  const isHighUsage = usagePct > 80;

  return (
    <div className="space-y-8">
      {/* Plan info */}
      <div className="rounded-xl border border-[#27272A] bg-[#141416] p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-heading text-xl font-semibold text-[#FAFAF9]">
                {isPro ? "Pro" : "Free"} Plan
              </h3>
              <span
                className={cn(
                  "rounded-full px-3 py-0.5 text-xs font-medium",
                  isPro
                    ? "bg-[#6366F1]/10 text-[#6366F1]"
                    : "bg-[#27272A] text-[#A1A1AA]"
                )}
              >
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>
            {!isPro && (
              <p className="mt-1 text-sm text-[#71717A]">
                Upgrade to Pro for more messages and features
              </p>
            )}
          </div>
          {!isPro && (
            <button className="rounded-lg bg-[#E07A5F] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E07A5F]/90">
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Usage metrics */}
      <div className="rounded-xl border border-[#27272A] bg-[#141416] p-6">
        <h3 className="mb-6 font-heading text-base font-semibold text-[#FAFAF9]">
          Usage
        </h3>
        <div className="space-y-6">
          {/* Messages */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-[#A1A1AA]">Messages this month</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  isHighUsage ? "text-[#F59E0B]" : "text-[#FAFAF9]"
                )}
              >
                {messagesUsed.toLocaleString()} / {messagesLimit.toLocaleString()}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[#27272A]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(usagePct, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  isHighUsage
                    ? "bg-gradient-to-r from-[#F59E0B] to-[#EF4444]"
                    : "bg-gradient-to-r from-[#E07A5F] to-[#3D8B7A]"
                )}
              />
            </div>
            {isHighUsage && (
              <p className="mt-1 text-xs text-[#F59E0B]">
                You&apos;re approaching your message limit. Consider upgrading.
              </p>
            )}
          </div>

          {/* Knowledge sources */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A1A1AA]">Knowledge sources</span>
            <span className="text-sm font-medium text-[#FAFAF9]">
              {sourcesUsed} / {sourcesLimit} documents
            </span>
          </div>

          {/* Team members */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A1A1AA]">Team members</span>
            <span className="text-sm font-medium text-[#FAFAF9]">
              {teamUsed} / {teamLimit}
            </span>
          </div>
        </div>
      </div>

      {/* Tenant ID */}
      <div className="rounded-xl border border-[#27272A] bg-[#141416] p-6">
        <label className="mb-2 block text-sm font-medium text-[#FAFAF9]">
          Your Tenant ID
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg bg-[#0A0A0B] px-4 py-2 font-mono text-sm text-[#A1A1AA]">
            {tenant?.id ?? "—"}
          </div>
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1.5 rounded-lg border border-[#27272A] px-3 py-2 text-sm text-[#A1A1AA] transition-colors hover:border-[#3F3F46] hover:text-[#FAFAF9]"
          >
            {copiedId ? (
              <Check className="h-4 w-4 text-[#3D8B7A]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Settings Page ---

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-heading text-2xl font-semibold text-[#FAFAF9]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#71717A]">
          Configure your bot, widget, and account.
        </p>
      </div>

      {/* Tab bar */}
      <div className="relative border-b border-[#27272A]">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-6 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-[#FAFAF9]"
                  : "text-[#71717A] hover:text-[#A1A1AA]"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="settings-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E07A5F]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — no re-mount, use display toggle */}
      <div>
        <div className={activeTab === "general" ? "block" : "hidden"}>
          <GeneralTab />
        </div>
        <div className={activeTab === "widget" ? "block" : "hidden"}>
          <WidgetTab />
        </div>
        <div className={activeTab === "api" ? "block" : "hidden"}>
          <ApiTab />
        </div>
      </div>
    </motion.div>
  );
}
