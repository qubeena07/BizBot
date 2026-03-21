"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/ui-store";

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/knowledge": "Knowledge Base",
  "/playground": "Playground",
  "/conversations": "Conversations",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/onboarding": "Onboarding",
};

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = pageTitles[pathname] ?? "Dashboard";

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [dropdownOpen]);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#27272A] bg-[#0A0A0B]/80 px-6 backdrop-blur-lg">
      {/* Left: Mobile menu + page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-[#71717A] transition-colors hover:bg-[#1C1C1F] hover:text-[#A1A1AA] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-heading text-lg font-semibold text-[#FAFAF9]">
          {pageTitle}
        </h1>
      </div>

      {/* Center: Command palette trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-[#27272A] bg-[#141416] px-4 py-2 transition-colors hover:border-[#3F3F46] md:flex"
      >
        <Search className="h-4 w-4 text-[#71717A]" />
        <span className="text-sm text-[#71717A]">Search...</span>
        <kbd className="rounded bg-[#1C1C1F] px-1.5 py-0.5 text-[10px] font-medium text-[#71717A]">
          ⌘K
        </kbd>
      </button>

      {/* Right: Notifications + user */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative rounded-lg p-2 text-[#71717A] transition-colors hover:bg-[#1C1C1F] hover:text-[#A1A1AA]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-[#EF4444]" />
        </button>

        {/* User dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E07A5F] text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            {initials}
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 min-w-[220px] overflow-hidden rounded-xl border border-[#27272A] bg-[#1C1C1F] shadow-2xl"
              >
                <div className="border-b border-[#27272A] px-4 py-3">
                  <p className="text-sm font-medium text-[#FAFAF9]">
                    {user?.full_name ?? "User"}
                  </p>
                  <p className="mt-0.5 text-xs text-[#71717A]">
                    {user?.email ?? ""}
                  </p>
                  <span className="mt-1.5 inline-block rounded bg-[#E07A5F]/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#E07A5F]">
                    {user?.role ?? "owner"}
                  </span>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#A1A1AA] transition-colors hover:bg-[#27272A] hover:text-[#FAFAF9]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
