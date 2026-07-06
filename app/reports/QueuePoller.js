"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { advanceReportQueue } from "./actions";

export default function QueuePoller({ hasProcessing }) {
  const router = useRouter();

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(async () => {
      await advanceReportQueue();
      router.refresh();
    }, 1500);
    return () => clearInterval(interval);
  }, [hasProcessing, router]);

  return null;
}
