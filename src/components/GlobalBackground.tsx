"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function GlobalBackground() {
  const pathname = usePathname();
  
  // Parallax layers refs
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);
  const layer4Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scrollTarget = 0;
    let scrollCurrent = 0;
    let rafId: number;

    const handleScroll = () => {
      const sy = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      scrollTarget = sy;
    };

    const updateParallax = () => {
      // Lerp logic: current = current + (target - current) * 0.08
      const diff = scrollTarget - scrollCurrent;
      if (Math.abs(diff) > 0.01) {
        scrollCurrent += diff * 0.08;
        
        // Apply GPU-accelerated transforms to avoid layout thrashing
        if (layer1Ref.current) layer1Ref.current.style.transform = `translateY(${scrollCurrent * 0.6}px) translateZ(0)`;
        if (layer2Ref.current) layer2Ref.current.style.transform = `translateY(${scrollCurrent * 0.5}px) translateZ(0)`;
        if (layer3Ref.current) layer3Ref.current.style.transform = `translateY(${scrollCurrent * 0.4}px) translateZ(0)`;
        if (layer4Ref.current) layer4Ref.current.style.transform = `translateY(${scrollCurrent * 0.2}px) translateZ(0)`;
      } else if (scrollCurrent !== scrollTarget) {
        scrollCurrent = scrollTarget;
        if (layer1Ref.current) layer1Ref.current.style.transform = `translateY(${scrollCurrent * 0.6}px) translateZ(0)`;
        if (layer2Ref.current) layer2Ref.current.style.transform = `translateY(${scrollCurrent * 0.5}px) translateZ(0)`;
        if (layer3Ref.current) layer3Ref.current.style.transform = `translateY(${scrollCurrent * 0.4}px) translateZ(0)`;
        if (layer4Ref.current) layer4Ref.current.style.transform = `translateY(${scrollCurrent * 0.2}px) translateZ(0)`;
      }

      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Set initial values
    const initialScroll = window.scrollY || document.documentElement.scrollTop || 0;
    scrollTarget = initialScroll;
    scrollCurrent = initialScroll;
    
    // Start animation loop
    updateParallax();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Exclude background from admin dashboard pages
  const isAdmin = pathname && pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <div className="parallax-bg" style={{ pointerEvents: "none" }}>
      {/* Layer 1: Slowest Scroll / Greatest Lag (translateY multiplier +0.38) */}
      <div ref={layer1Ref} className="parallax-layer">
        {/* Thick Stripes */}
        <div className="parallax-stripe pastel-green" style={{ width: "60px", height: "800px", top: "500px", left: "3%" }} />
        <div className="parallax-stripe pastel-purple" style={{ width: "45px", height: "600px", top: "950px", left: "12%" }} />
        <div className="parallax-stripe pastel-teal" style={{ width: "80px", height: "900px", top: "1750px", left: "8%" }} />
        <div className="parallax-stripe pastel-beige" style={{ width: "50px", height: "750px", top: "2850px", left: "15%" }} />
        <div className="parallax-stripe pastel-pink" style={{ width: "70px", height: "700px", top: "400px", right: "4%" }} />
        <div className="parallax-stripe pastel-blue" style={{ width: "50px", height: "650px", top: "1200px", right: "14%" }} />
        <div className="parallax-stripe pastel-purple" style={{ width: "85px", height: "900px", top: "2100px", right: "7%" }} />
        <div className="parallax-stripe pastel-green" style={{ width: "55px", height: "800px", top: "3100px", right: "12%" }} />
        <div className="parallax-stripe pastel-teal" style={{ width: "75px", height: "850px", top: "3900px", left: "6%" }} />
        <div className="parallax-stripe pastel-beige" style={{ width: "60px", height: "700px", top: "4400px", right: "8%" }} />
        {/* Extra Top-Section Stripes (Layer 1) */}
        <div className="parallax-stripe pastel-pink" style={{ width: "35px", height: "600px", top: "-60px", left: "19%" }} />
        <div className="parallax-stripe pastel-blue" style={{ width: "50px", height: "700px", top: "-30px", left: "36%" }} />
      </div>

      {/* Layer 2: Medium-Slow Scroll / Medium-High Lag (translateY multiplier +0.26) */}
      <div ref={layer2Ref} className="parallax-layer">
        {/* Thick Stripes */}
        <div className="parallax-stripe pastel-purple" style={{ width: "50px", height: "700px", top: "300px", left: "22%" }} />
        <div className="parallax-stripe pastel-beige" style={{ width: "75px", height: "800px", top: "1100px", left: "28%" }} />
        <div className="parallax-stripe pastel-pink" style={{ width: "60px", height: "650px", top: "2000px", left: "20%" }} />
        <div className="parallax-stripe pastel-green" style={{ width: "70px", height: "750px", top: "2900px", left: "26%" }} />
        <div className="parallax-stripe pastel-blue" style={{ width: "65px", height: "600px", top: "200px", right: "24%" }} />
        <div className="parallax-stripe pastel-teal" style={{ width: "55px", height: "700px", top: "900px", right: "18%" }} />
        <div className="parallax-stripe pastel-purple" style={{ width: "80px", height: "850px", top: "1800px", right: "22%" }} />
        <div className="parallax-stripe pastel-beige" style={{ width: "45px", height: "650px", top: "2750px", right: "26%" }} />
        <div className="parallax-stripe pastel-pink" style={{ width: "70px", height: "750px", top: "3700px", right: "20%" }} />
        <div className="parallax-stripe pastel-blue" style={{ width: "55px", height: "650px", top: "4300px", left: "25%" }} />
        {/* Extra Top-Section Stripes (Layer 2) */}
        <div className="parallax-stripe pastel-teal" style={{ width: "42px", height: "580px", top: "-70px", left: "6%" }} />
        <div className="parallax-stripe pastel-beige" style={{ width: "34px", height: "490px", top: "-55px", left: "80%" }} />
      </div>

      {/* Layer 3: Medium-Fast Scroll / Medium-Low Lag (translateY multiplier +0.14) */}
      <div ref={layer3Ref} className="parallax-layer">
        {/* Thick Stripes */}
        <div className="parallax-stripe pastel-teal" style={{ width: "40px", height: "500px", top: "100px", left: "45%" }} />
        <div className="parallax-stripe pastel-blue" style={{ width: "55px", height: "650px", top: "850px", left: "48%" }} />
        <div className="parallax-stripe pastel-pink" style={{ width: "60px", height: "600px", top: "1600px", left: "42%" }} />
        <div className="parallax-stripe pastel-purple" style={{ width: "75px", height: "800px", top: "2400px", left: "46%" }} />
        <div className="parallax-stripe pastel-green" style={{ width: "50px", height: "700px", top: "3200px", left: "52%" }} />
        <div className="parallax-stripe pastel-beige" style={{ width: "65px", height: "550px", top: "500px", right: "45%" }} />
        <div className="parallax-stripe pastel-teal" style={{ width: "50px", height: "650px", top: "1300px", right: "48%" }} />
        <div className="parallax-stripe pastel-blue" style={{ width: "70px", height: "700px", top: "2100px", right: "42%" }} />
        <div className="parallax-stripe pastel-pink" style={{ width: "55px", height: "600px", top: "2900px", right: "46%" }} />
        <div className="parallax-stripe pastel-purple" style={{ width: "65px", height: "800px", top: "3800px", left: "45%" }} />
        <div className="parallax-stripe pastel-green" style={{ width: "50px", height: "700px", top: "4500px", right: "43%" }} />
        {/* Extra Top-Section Stripes (Layer 3) */}
        <div className="parallax-stripe pastel-green" style={{ width: "38px", height: "560px", top: "-80px", left: "1%" }} />
        <div className="parallax-stripe pastel-teal" style={{ width: "54px", height: "670px", top: "-60px", left: "68%" }} />
      </div>

      {/* Layer 4: Fastest Scroll / Slowest Lag (translateY multiplier +0.05) */}
      <div ref={layer4Ref} className="parallax-layer">
        {/* Thick Stripes */}
        <div className="parallax-stripe pastel-beige" style={{ width: "50px", height: "650px", top: "400px", left: "33%" }} />
        <div className="parallax-stripe pastel-pink" style={{ width: "45px", height: "700px", top: "1450px", left: "35%" }} />
        <div className="parallax-stripe pastel-teal" style={{ width: "50px", height: "600px", top: "2700px", left: "32%" }} />
        <div className="parallax-stripe pastel-green" style={{ width: "55px", height: "700px", top: "650px", right: "32%" }} />
        <div className="parallax-stripe pastel-purple" style={{ width: "45px", height: "650px", top: "1850px", right: "35%" }} />
        <div className="parallax-stripe pastel-blue" style={{ width: "50px", height: "750px", top: "3300px", right: "33%" }} />
        {/* Extra Top-Section Stripes (Layer 4) */}
        <div className="parallax-stripe pastel-blue" style={{ width: "37px", height: "530px", top: "-30px", left: "23%" }} />
        <div className="parallax-stripe pastel-beige" style={{ width: "47px", height: "610px", top: "-15px", right: "9%" }} />
      </div>
    </div>
  );
}
