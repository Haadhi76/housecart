"use client";

import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useRealtimeLists(householdId: string | null) {
  const [status, setStatus] = useState<string>("CLOSED");
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!householdId) {
      setStatus("CLOSED");
      return;
    }

    const channel = supabase
      .channel(`shopping-lists-${householdId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_lists",
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["lists"] });
        }
      )
      .subscribe((s) => {
        setStatus(s);
      });

    return () => {
      supabase.removeChannel(channel);
      setStatus("CLOSED");
    };
  }, [householdId, queryClient, supabase]);

  return status;
}
