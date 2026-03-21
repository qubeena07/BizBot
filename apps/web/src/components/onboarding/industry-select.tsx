"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import {
  UtensilsCrossed,
  Heart,
  Scale,
  Home,
  Scissors,
  Car,
  Dumbbell,
  ShoppingBag,
  GraduationCap,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Heart,
  Scale,
  Home,
  Scissors,
  Car,
  Dumbbell,
  ShoppingBag,
  GraduationCap,
  Building2,
};

const INDUSTRIES = [
  { id: "restaurant", label: "Restaurant / Café", icon: "UtensilsCrossed" },
  { id: "healthcare", label: "Healthcare / Clinic", icon: "Heart" },
  { id: "legal", label: "Law Firm", icon: "Scale" },
  { id: "realestate", label: "Real Estate", icon: "Home" },
  { id: "salon", label: "Salon / Spa", icon: "Scissors" },
  { id: "automotive", label: "Auto Shop / Dealer", icon: "Car" },
  { id: "fitness", label: "Gym / Fitness", icon: "Dumbbell" },
  { id: "ecommerce", label: "E-commerce / Retail", icon: "ShoppingBag" },
  { id: "education", label: "Education / Tutoring", icon: "GraduationCap" },
  { id: "other", label: "Other", icon: "Building2" },
];

interface IndustrySelectProps {
  value: string | null;
  onChange: (id: string) => void;
}

export function IndustrySelect({ value, onChange }: IndustrySelectProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {INDUSTRIES.map((industry) => {
        const Icon = ICON_MAP[industry.icon];
        const isSelected = value === industry.id;

        return (
          <motion.button
            key={industry.id}
            type="button"
            onClick={() => onChange(industry.id)}
            whileTap={{ scale: 0.95 }}
            animate={
              isSelected
                ? { scale: [0.95, 1.02, 1.0] }
                : { scale: 1 }
            }
            transition={{ duration: 0.2 }}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 cursor-pointer",
              isSelected
                ? "border-[#E07A5F] bg-[#E07A5F]/5"
                : "border-[#27272A] bg-[#141416] hover:border-[#3F3F46] hover:bg-[#1C1C1F]"
            )}
          >
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E07A5F]"
                >
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            <Icon
              className={cn(
                "h-6 w-6 transition-colors duration-200",
                isSelected
                  ? "text-[#E07A5F]"
                  : "text-[#71717A] group-hover:text-[#A1A1AA]"
              )}
            />
            <span
              className={cn(
                "text-center text-sm transition-colors duration-200",
                isSelected ? "text-[#FAFAF9]" : "text-[#A1A1AA]"
              )}
            >
              {industry.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
