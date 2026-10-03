"use client";

import { useEffect } from "react";
import { startAutoSync } from "@/lib/sync/queue";

export function SyncRegistrar() {
  useEffect(() => startAutoSync(), []);

  return null;
}
