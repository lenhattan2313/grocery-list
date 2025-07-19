"use client";

import { useHydration } from "@/hooks/use-hydration";
import { formatDistanceToNow } from "date-fns";

interface ClientRelativeTimeProps {
  date: Date | number;
}

export function ClientRelativeTime({ date }: ClientRelativeTimeProps) {
  const hydrated = useHydration();

  if (!hydrated) {
    return null;
  }

  const timeAgo = formatDistanceToNow(date, {
    addSuffix: true,
  });

  return <span>{timeAgo}</span>;
}
