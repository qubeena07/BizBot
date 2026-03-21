"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  MessagesSquare,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

const mainNav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/playground", label: "Playground", icon: MessageSquare },
  { href: "/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const settingsNav = [
  { href: "/settings", label: "Settings", icon: Settings },
];

const sidebarItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

interface NavItemProps {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  isActive: boolean;
  collapsed: boolean;
}

function NavItem({ href, label, icon: Icon, isActive, collapsed }: NavItemProps) {
  return (
    <motion.div variants={sidebarItemVariants}>
      <Link
        href={href}
        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-[#1C1C1F] text-[#FAFAF9]"
            : "text-[#A1A1AA] hover:bg-[#1C1C1F] hover:text-[#FAFAF9]"
        } ${collapsed ? "justify-center" : ""}`}
        style={
          isActive
            ? {
                boxShadow: "0 0 20px rgba(224,122,95,0.1)",
              }
            : undefined
        }
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active-indicator"
            className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-[#E07A5F]"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}

function NavSection({
  label,
  items,
  pathname,
  collapsed,
}: {
  label: string;
  items: typeof mainNav;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div>
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#71717A]"
          >
            {label}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-0.5"
      >
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              collapsed={collapsed}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[#27272A] bg-[#141416]/80 backdrop-blur-xl lg:flex"
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-[#27272A] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E07A5F] font-heading text-sm font-bold text-white">
            BB
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap font-heading text-lg font-bold text-[#FAFAF9]"
              >
                BizBot AI
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4 scrollbar-thin">
          <NavSection label="Main" items={mainNav} pathname={pathname} collapsed={collapsed} />
          <NavSection label="Settings" items={settingsNav} pathname={pathname} collapsed={collapsed} />
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-[#27272A] p-3">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-[#71717A] transition-colors hover:bg-[#1C1C1F] hover:text-[#A1A1AA]"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
        </div>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <MobileSidebar pathname={pathname} />
    </>
  );
}

function MobileSidebar({ pathname }: { pathname: string }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <AnimatePresence>
      {!collapsed && (
        <>
          {/* Backdrop — only visible on mobile when sidebar is toggled open via topbar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-[#27272A] bg-[#141416] lg:hidden"
          >
            <div className="flex h-16 items-center gap-3 border-b border-[#27272A] px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E07A5F] font-heading text-sm font-bold text-white">
                BB
              </div>
              <span className="font-heading text-lg font-bold text-[#FAFAF9]">
                BizBot AI
              </span>
            </div>

            <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4 scrollbar-thin">
              <NavSection label="Main" items={mainNav} pathname={pathname} collapsed={false} />
              <NavSection label="Settings" items={settingsNav} pathname={pathname} collapsed={false} />
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
