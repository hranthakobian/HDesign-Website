"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const generateSessionId = () => {
  return "session_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const sessionStarted = useRef(false);
  const currentSessionId = useRef<string | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    let sessionId = sessionStorage.getItem("hdesign_analytics_session");
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem("hdesign_analytics_session", sessionId);
    }
    currentSessionId.current = sessionId;

    // Send initial page visit
    const recordVisit = async () => {
      try {
        await fetch("/api/analytics/visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            referrer: document.referrer || "Direct",
            landingPage: window.location.pathname,
          }),
        });
      } catch (err) {
        console.error("Failed to send analytics visit:", err);
      }
    };

    recordVisit();

    // Setup 15 seconds heartbeat interval
    const interval = setInterval(async () => {
      if (!currentSessionId.current) return;
      try {
        await fetch(`/api/analytics/heartbeat?sessionId=${currentSessionId.current}`);
      } catch (err) {
        console.error("Failed to send heartbeat:", err);
      }
    }, 15000);

    // Unload handler using sendBeacon for robust closing stay duration calculation
    const handleUnload = () => {
      if (!currentSessionId.current) return;
      navigator.sendBeacon(`/api/analytics/heartbeat?sessionId=${currentSessionId.current}`);
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // Track page change inside the session
  useEffect(() => {
    if (!currentSessionId.current) return;
    
    // We can ping the heartbeat when changing pages to mark activity and capture the new pathname
    fetch(`/api/analytics/heartbeat?sessionId=${currentSessionId.current}`)
      .catch((err) => console.error("Failed to send page transition activity:", err));

    // Send Google Analytics page_view event on route change
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_path: pathname,
        page_location: window.location.href,
      });
    }
  }, [pathname]);

  return null;
}
