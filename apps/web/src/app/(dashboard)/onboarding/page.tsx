"use client";

import { useState, useReducer, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-tenant";
import { useChat } from "@/hooks/use-chat";
import { useChatStore } from "@/stores/chat-store";
import { IndustrySelect } from "@/components/onboarding/industry-select";
import { ToneSelector } from "@/components/onboarding/tone-selector";
import { FileUploadZone } from "@/components/knowledge/file-upload-zone";
import { ChatWindow } from "@/components/playground/chat-window";

// --- Types & Constants ---

const STEP_LABELS = ["Business Info", "Hours & Tone", "First Document", "Test Your Bot"];

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
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

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface OnboardingData {
  business_name: string;
  industry: string | null;
  description: string;
  operating_hours: Record<string, DayHours>;
  timezone: string;
  bot_name: string;
  tone: string | null;
}

type Action =
  | { type: "SET_FIELD"; field: keyof OnboardingData; value: string | null }
  | { type: "SET_DAY_HOURS"; day: string; hours: Partial<DayHours> };

function createDefaultHours(): Record<string, DayHours> {
  const hours: Record<string, DayHours> = {};
  for (const day of DAYS) {
    hours[day] =
      day === "sat" || day === "sun"
        ? { open: "9:00 AM", close: "5:00 PM", closed: true }
        : { open: "9:00 AM", close: "5:00 PM", closed: false };
  }
  return hours;
}

function reducer(state: OnboardingData, action: Action): OnboardingData {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_DAY_HOURS":
      return {
        ...state,
        operating_hours: {
          ...state.operating_hours,
          [action.day]: {
            ...state.operating_hours[action.day],
            ...action.hours,
          },
        },
      };
    default:
      return state;
  }
}

// --- Confetti ---

function ConfettiPiece({ index }: { index: number }) {
  const colors = ["#E07A5F", "#3D8B7A", "#6366F1", "#F59E0B"];
  const color = colors[index % colors.length];
  const isCircle = index % 3 === 0;
  const size = 6 + Math.random() * 6;
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const xDrift = (Math.random() - 0.5) * 200;
  const rotation = Math.random() * 720 - 360;

  return (
    <motion.div
      initial={{
        opacity: 1,
        y: 0,
        x: 0,
        rotate: 0,
        scale: 0,
      }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -80, 400],
        x: [0, xDrift * 0.5, xDrift],
        rotate: [0, rotation / 2, rotation],
        scale: [0, 1, 0.5],
      }}
      transition={{
        duration: 2,
        delay,
        ease: "easeOut",
      }}
      className="pointer-events-none absolute"
      style={{
        left: `${left}%`,
        top: "50%",
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: isCircle ? "50%" : "2px",
      }}
    />
  );
}

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 50 }, (_, i) => i),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>
  );
}

// --- Step Components ---

function StepBusiness({
  data,
  dispatch,
}: {
  data: OnboardingData;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
          Business Name <span className="text-[#EF4444]">*</span>
        </label>
        <input
          type="text"
          value={data.business_name}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              field: "business_name",
              value: e.target.value,
            })
          }
          placeholder="Acme Coffee Co."
          className="w-full rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 text-sm text-[#FAFAF9] placeholder:text-[#71717A] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
        />
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-[#FAFAF9]">
          Industry <span className="text-[#EF4444]">*</span>
        </label>
        <IndustrySelect
          value={data.industry}
          onChange={(id) =>
            dispatch({ type: "SET_FIELD", field: "industry", value: id })
          }
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              field: "description",
              value: e.target.value,
            })
          }
          maxLength={2000}
          rows={4}
          placeholder="Tell us about your business so your AI can represent you accurately"
          className="w-full resize-none rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 text-sm text-[#FAFAF9] placeholder:text-[#71717A] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
        />
        <p className="mt-1 text-right text-xs text-[#71717A]">
          {data.description.length}/2000
        </p>
      </div>
    </div>
  );
}

function StepHours({
  data,
  dispatch,
}: {
  data: OnboardingData;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="space-y-6">
      {/* Operating hours */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[#FAFAF9]">
          Operating Hours
        </label>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const hours = data.operating_hours[day];
            return (
              <div
                key={day}
                className="flex items-center gap-3 rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5"
              >
                <span className="w-20 text-sm font-medium text-[#A1A1AA]">
                  {DAY_LABELS[day]}
                </span>

                {/* Closed toggle */}
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "SET_DAY_HOURS",
                      day,
                      hours: { closed: !hours.closed },
                    })
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    hours.closed ? "bg-[#27272A]" : "bg-[#3D8B7A]"
                  }`}
                >
                  <motion.div
                    animate={{ x: hours.closed ? 2 : 22 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-4 w-4 rounded-full bg-white"
                  />
                </button>
                <span className="w-12 text-xs text-[#71717A]">
                  {hours.closed ? "Closed" : "Open"}
                </span>

                {/* Time pickers */}
                <select
                  value={hours.open}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_DAY_HOURS",
                      day,
                      hours: { open: e.target.value },
                    })
                  }
                  disabled={hours.closed}
                  className="rounded-md border border-[#27272A] bg-[#1C1C1F] px-2 py-1 text-xs text-[#FAFAF9] disabled:opacity-30 disabled:cursor-not-allowed focus:border-[#E07A5F] focus:outline-none"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-[#71717A]">to</span>
                <select
                  value={hours.close}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_DAY_HOURS",
                      day,
                      hours: { close: e.target.value },
                    })
                  }
                  disabled={hours.closed}
                  className="rounded-md border border-[#27272A] bg-[#1C1C1F] px-2 py-1 text-xs text-[#FAFAF9] disabled:opacity-30 disabled:cursor-not-allowed focus:border-[#E07A5F] focus:outline-none"
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

      {/* Timezone */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
          Timezone
        </label>
        <select
          value={data.timezone}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              field: "timezone",
              value: e.target.value,
            })
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

      {/* Bot name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#FAFAF9]">
          Bot Name
        </label>
        <input
          type="text"
          value={data.bot_name}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              field: "bot_name",
              value: e.target.value,
            })
          }
          placeholder="What should your bot be called?"
          className="w-full rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2.5 text-sm text-[#FAFAF9] placeholder:text-[#71717A] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
        />
      </div>

      {/* Tone */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[#FAFAF9]">
          Tone <span className="text-[#EF4444]">*</span>
        </label>
        <ToneSelector
          value={data.tone}
          onChange={(tone) =>
            dispatch({ type: "SET_FIELD", field: "tone", value: tone })
          }
        />
      </div>
    </div>
  );
}

function StepDocument() {
  return (
    <div className="space-y-4">
      <FileUploadZone />
      <p className="text-center text-sm text-[#71717A]">
        You can also add more documents later from the Knowledge Base page.
      </p>
    </div>
  );
}

function StepTest({
  onSendMessage,
}: {
  onSendMessage: (msg: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="h-[400px] overflow-hidden rounded-xl border border-[#27272A] bg-[#0A0A0B]">
        <ChatWindow onSendMessage={onSendMessage} />
      </div>
    </div>
  );
}

// --- Main Page ---

export default function OnboardingPage() {
  const router = useRouter();
  const { tenant } = useAuth();
  const { submitOnboarding, isSubmitting } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isComplete, setIsComplete] = useState(false);

  const [data, dispatch] = useReducer(reducer, {
    business_name: tenant?.name ?? "",
    industry: null,
    description: "",
    operating_hours: createDefaultHours(),
    timezone: "US/Eastern",
    bot_name: "AI Assistant",
    tone: null,
  });

  // Chat for step 4
  const { sendMessage } = useChat(tenant?.id ?? "");
  const clearChat = useChatStore((s) => s.clearChat);

  // Pre-load welcome message for step 4
  const addMessage = useChatStore((s) => s.addMessage);
  const messages = useChatStore((s) => s.messages);

  useEffect(() => {
    if (currentStep === 3 && messages.length === 0) {
      addMessage({
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm ${data.bot_name}, your AI assistant for ${data.business_name || "your business"}. Ask me anything!`,
        createdAt: new Date(),
      });
    }
  }, [currentStep, messages.length, addMessage, data.bot_name, data.business_name]);

  // Validation
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return data.business_name.trim().length > 0 && data.industry !== null;
      case 1:
        return data.tone !== null;
      case 2:
        return true; // skip allowed
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, data.business_name, data.industry, data.tone]);

  const goNext = useCallback(() => {
    if (currentStep < 3) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    if (!data.industry || !data.tone) return;

    try {
      await submitOnboarding({
        business_name: data.business_name,
        industry: data.industry,
        description: data.description,
        operating_hours: data.operating_hours,
        timezone: data.timezone,
        tone: data.tone,
        bot_name: data.bot_name,
      });
      setIsComplete(true);
      clearChat();

      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch {
      // Error handled by mutation
    }
  }, [data, submitOnboarding, clearChat, router]);

  const handleSendMessage = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage]
  );

  // Completion screen
  if (isComplete) {
    return (
      <div className="relative flex min-h-[80vh] items-center justify-center">
        <Confetti />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="z-10 flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 15,
              delay: 0.2,
            }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3D8B7A]/15"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <motion.path
                d="M10 22l7 7L30 13"
                stroke="#3D8B7A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              />
            </svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 font-heading text-2xl font-bold text-[#FAFAF9]"
          >
            You&apos;re all set!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-2 text-sm text-[#71717A]"
          >
            Your AI receptionist is ready to help your customers.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#27272A]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#E07A5F] to-[#3D8B7A]"
            animate={{ width: `${((currentStep + 1) / 4) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Step indicators */}
        <div className="mt-6 flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;

            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{
                    scale: isCurrent ? 1 : 1,
                    backgroundColor: isCompleted || isCurrent ? "#E07A5F" : "#27272A",
                  }}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full text-sm"
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span
                      className={
                        isCurrent ? "text-white font-medium" : "text-[#71717A]"
                      }
                    >
                      {i + 1}
                    </span>
                  )}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-[#E07A5F]"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.div>
                <span
                  className={`hidden text-xs sm:block ${
                    isCurrent ? "text-[#FAFAF9] font-medium" : "text-[#71717A]"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {currentStep === 0 && (
              <div>
                <h2 className="mb-1 font-heading text-xl font-semibold text-[#FAFAF9]">
                  Your Business
                </h2>
                <p className="mb-6 text-sm text-[#71717A]">
                  Tell us about your business so we can configure your AI assistant.
                </p>
                <StepBusiness data={data} dispatch={dispatch} />
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <h2 className="mb-1 font-heading text-xl font-semibold text-[#FAFAF9]">
                  Hours & Tone
                </h2>
                <p className="mb-6 text-sm text-[#71717A]">
                  Set your operating hours and choose how your bot communicates.
                </p>
                <StepHours data={data} dispatch={dispatch} />
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="mb-1 font-heading text-xl font-semibold text-[#FAFAF9]">
                  First Document
                </h2>
                <p className="mb-6 text-sm text-[#71717A]">
                  Upload a document to train your AI. Menus, FAQs, service lists —
                  anything your customers ask about.
                </p>
                <StepDocument />
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="mb-1 font-heading text-xl font-semibold text-[#FAFAF9]">
                  Test Your Bot
                </h2>
                <p className="mb-6 text-sm text-[#71717A]">
                  Try chatting with your AI assistant before going live.
                </p>
                <StepTest onSendMessage={handleSendMessage} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#27272A] bg-[#0A0A0B]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          {currentStep > 0 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-[#A1A1AA] transition-colors hover:text-[#FAFAF9]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <span className="text-sm text-[#71717A]">
            Step {currentStep + 1} of 4
          </span>

          {currentStep === 3 ? (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-[#E07A5F] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E07A5F]/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : currentStep === 2 ? (
            <div className="flex items-center gap-3">
              <button
                onClick={goNext}
                className="text-sm text-[#71717A] underline-offset-2 transition-colors hover:text-[#A1A1AA] hover:underline"
              >
                Skip this step
              </button>
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 rounded-lg bg-[#E07A5F] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E07A5F]/90"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 rounded-lg bg-[#E07A5F] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#E07A5F]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
