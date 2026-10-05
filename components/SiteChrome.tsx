"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the public site's header/footer/quick actions everywhere except
 * /admin, which has its own shell. Lets the root layout (and the 404 page
 * that relies on it) stay exactly as before for every public route.
 */
export default function SiteChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return <>{children}</>;
  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
