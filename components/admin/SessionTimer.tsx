"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { IDLE_LIMIT_MS } from "@/lib/admin/session";

/**
 * Ends the session in a tab left open: once the 48-hour maximum is reached or
 * the tab has been idle for 24 hours, it reloads, and the middleware then
 * signs out and shows the login page. The server is what enforces the limits;
 * this only makes an unattended tab act on them. `remainingMs` comes from the
 * server, so the device's clock setting doesn't matter.
 */
export default function SessionTimer({ remainingMs }: { remainingMs: number }) {
  const pathname = usePathname();
  const lastActive = useRef(Date.now());

  useEffect(() => { lastActive.current = Date.now(); }, [pathname]);

  useEffect(() => {
    const loadedAt = Date.now();
    const onActive = () => { lastActive.current = Date.now(); };
    const check = () => {
      const now = Date.now();
      if (now - loadedAt >= remainingMs || now - lastActive.current >= IDLE_LIMIT_MS) window.location.reload();
    };
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    const timer = window.setInterval(check, 60_000);
    window.addEventListener("click", onActive);
    window.addEventListener("keydown", onActive);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("click", onActive);
      window.removeEventListener("keydown", onActive);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [remainingMs]);

  return null;
}
