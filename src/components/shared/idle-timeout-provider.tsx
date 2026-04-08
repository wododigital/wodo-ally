"use client";

import { useIdleTimeout } from "@/lib/hooks/use-idle-timeout";

/**
 * Client component that activates the idle session timeout.
 * Renders nothing - just runs the hook.
 */
export function IdleTimeoutProvider() {
  useIdleTimeout();
  return null;
}
