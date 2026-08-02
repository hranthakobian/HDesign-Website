"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [transitionState, setTransitionState] = useState<"in" | "out">("in");
  const isNavigatingRef = useRef(false);
  const currentPathRef = useRef(pathname);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When pathname or route changes, trigger fade-in
  useEffect(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (pathname !== currentPathRef.current) {
      currentPathRef.current = pathname;
    }

    isNavigatingRef.current = false;
    setTransitionState("in");

    // Scroll to top on page change
    if (typeof window !== "undefined") {
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [pathname]);

  // Intercept internal link clicks for smooth fade out before navigation
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      // Ignore non-primary or modified clicks (Ctrl, Cmd, Shift, Alt, middle-click)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      // Ignore links with target="_blank", download, or non-http protocols
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref) return;

      if (
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:") ||
        rawHref.startsWith("blob:") ||
        rawHref.startsWith("data:")
      ) {
        return;
      }

      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(anchor.href, window.location.href);

        // Ignore external domains
        if (targetUrl.origin !== currentUrl.origin) return;

        // Same page anchor link (e.g. /about#team)
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search &&
          targetUrl.hash
        ) {
          return;
        }

        // Exact same URL without hash change
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          e.preventDefault();
          if (typeof window !== "undefined") {
            if ((window as any).lenis) {
              (window as any).lenis.scrollTo(0);
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }
          return;
        }

        // Prevent default immediate navigation
        e.preventDefault();

        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;

        // Start fade out animation
        setTransitionState("out");

        const targetPath = targetUrl.pathname + targetUrl.search + targetUrl.hash;

        // Execute route change after fade-out transition duration (220ms)
        setTimeout(() => {
          router.push(targetPath);
        }, 220);

        // Safety fallback: reset to "in" after 3s if route change stalls
        fallbackTimerRef.current = setTimeout(() => {
          isNavigatingRef.current = false;
          setTransitionState("in");
        }, 3000);
      } catch (err) {
        // Fallback to default browser navigation on parse error
      }
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [router]);

  return (
    <div
      ref={wrapperRef}
      className={`page-transition-wrapper ${
        transitionState === "out" ? "page-fade-out" : "page-fade-in"
      }`}
    >
      {children}
    </div>
  );
}

