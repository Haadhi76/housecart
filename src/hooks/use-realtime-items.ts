"use client";

import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useRealtimeItems(listId: string | null) {
  const [status, setStatus] = useState<string>("CLOSED");
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!listId) {
      setStatus("CLOSED");
      return;
    }

    const channel = supabase
      .channel(`list-items-${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${listId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["items", listId] });
        }
      )
      .subscribe((s) => {
        setStatus(s);
      });

    return () => {
      supabase.removeChannel(channel);
      setStatus("CLOSED");
    };
  }, [listId, queryClient, supabase]);

  return status;
}
