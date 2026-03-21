"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1C1C1F",
            border: "1px solid #27272A",
            color: "#FAFAF9",
          },
        }}
      />
      </QueryClientProvider>
    </SessionProvider>
  );
}
