"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll({ initialEnabled = false }: { initialEnabled?: boolean }) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(initialEnabled);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  useEffect(() => {
    const handleSettingChange = (e: any) => {
      if (e?.detail?.smooth_scroll_enabled !== undefined) {
        setEnabled(!!e.detail.smooth_scroll_enabled);
      }
    };
    window.addEventListener("hdesign-smooth-scroll-change", handleSettingChange);
    return () => {
      window.removeEventListener("hdesign-smooth-scroll-change", handleSettingChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      if ((window as any).lenis) {
        try {
          (window as any).lenis.destroy();
        } catch (e) {}
        (window as any).lenis = null;
      }
      return;
    }
    if (pathname?.startsWith("/admin")) return;

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential out easing
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.95, // gentle, not too fast
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Make lenis globally accessible if other scripts need to interact with it
    (window as any).lenis = lenis;

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      (window as any).lenis = null;
    };
  }, [pathname, enabled]);

  return null;
}

