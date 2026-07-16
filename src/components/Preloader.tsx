"use client";

import { useEffect, useRef, useState } from "react";
import animationData from "@/assets/loading-animation.json";

export default function Preloader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    // 1. Disable scroll immediately
    document.documentElement.classList.add("preloader-active");
    if (typeof window !== "undefined" && (window as any).lenis) {
      (window as any).lenis.stop();
    }

    let isMounted = true;

    // 2. Initialize Lottie animation
    import("lottie-web").then((lottieModule) => {
      if (!isMounted || !containerRef.current) return;
      const lottie = lottieModule.default;

      if (animRef.current) {
        animRef.current.destroy();
      }

      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: animationData,
      });
    });

    // 3. Coordinate page readiness checks
    let fontsReady = false;
    let pageReady = false;
    let imagesReady = false;
    let minTimeReady = false;

    const checkAndHide = () => {
      if (fontsReady && pageReady && imagesReady && minTimeReady && isMounted) {
        setIsLoaded(true);
        // Re-enable scrolling
        document.documentElement.classList.remove("preloader-active");
        if (typeof window !== "undefined" && (window as any).lenis) {
          (window as any).lenis.start();
        }
      }
    };

    // A. Minimum visual duration (1.5 seconds) to show the premium loading animation
    const minTimer = setTimeout(() => {
      minTimeReady = true;
      checkAndHide();
    }, 1500);

    // B. Page loaded check
    if (document.readyState === "complete") {
      pageReady = true;
      checkAndHide();
    } else {
      const handleLoad = () => {
        pageReady = true;
        checkAndHide();
      };
      window.addEventListener("load", handleLoad);
    }

    // C. Custom fonts loaded check (ensures HDesign is rendered correctly)
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready
        .then(() => {
          fontsReady = true;
          checkAndHide();
        })
        .catch(() => {
          fontsReady = true;
          checkAndHide();
        });
    } else {
      fontsReady = true;
      checkAndHide();
    }

    // D. Images loaded check (tracks dynamically rendered images)
    const imageInterval = setInterval(() => {
      if (!isMounted) return;
      const imgs = Array.from(document.images);
      const pending = imgs.filter(img => !img.complete && img.src);
      
      if (pending.length === 0) {
        imagesReady = true;
        checkAndHide();
      } else {
        imagesReady = false;
      }
    }, 100);

    // E. Safe fallback timer (max 4.5 seconds) in case of slow resources
    const fallbackTimer = setTimeout(() => {
      if (!isLoaded && isMounted) {
        setIsLoaded(true);
        document.documentElement.classList.remove("preloader-active");
        if (typeof window !== "undefined" && (window as any).lenis) {
          (window as any).lenis.start();
        }
      }
    }, 4500);

    return () => {
      isMounted = false;
      clearTimeout(minTimer);
      clearTimeout(fallbackTimer);
      clearInterval(imageInterval);
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
      document.documentElement.classList.remove("preloader-active");
      if (typeof window !== "undefined" && (window as any).lenis) {
        (window as any).lenis.start();
      }
    };
  }, []);

  // When fadeout finishes, completely remove preloader component from DOM
  useEffect(() => {
    if (isLoaded) {
      const cleanupTimer = setTimeout(() => {
        setIsRemoved(true);
      }, 800); // Matches CSS transition duration
      return () => clearTimeout(cleanupTimer);
    }
  }, [isLoaded]);

  if (isRemoved) return null;

  return (
    <div className={`site-preloader ${isLoaded ? "preloader-fade-out" : ""}`}>
      <div className="preloader-content">
        <div ref={containerRef} className="preloader-lottie" />
        <div className="preloader-bar">
          <div className="preloader-progress" />
        </div>
      </div>
    </div>
  );
}
