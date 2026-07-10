"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(pathname);
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    const el = wrapperRef.current;
    if (!el || isAdmin) return;

    // Trigger slide-in animation by re-applying the class
    el.classList.remove("page-slide-in");
    // Force reflow so the browser registers the removal
    void el.offsetWidth;
    el.classList.add("page-slide-in");
  }, [pathname, isAdmin]);

  return (
    <div ref={wrapperRef} className={isAdmin ? "" : "page-slide-in"}>
      {children}
    </div>
  );
}
