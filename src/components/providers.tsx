"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/client";

// Tables to watch + which query keys to invalidate on changes
const REALTIME_TABLES: Array<{ table: string; queryKeys: string[] }> = [
  { table: "clients",         queryKeys: ["clients"] },
  { table: "client_contacts", queryKeys: ["clients"] },
  { table: "invoices",        queryKeys: ["invoices", "dashboard-kpis"] },
  { table: "projects",        queryKeys: ["projects"] },
  { table: "transactions",    queryKeys: ["transactions", "dashboard-kpis"] },
  { table: "expenses",        queryKeys: ["expenses"] },
  { table: "payments",        queryKeys: ["invoices", "payments", "dashboard-kpis"] },
];

function RealtimeSync({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel("wodo-realtime");

    REALTIME_TABLES.forEach(({ table, queryKeys }) => {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table },
        () => {
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: [key] });
          });
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSync queryClient={queryClient} />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(18, 18, 26, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "rgba(255, 255, 255, 0.92)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
