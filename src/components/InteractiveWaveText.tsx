"use client";

import React, { useEffect, useRef } from "react";

interface InteractiveWaveTextProps {
  lines: string[];
  className?: string;
  style?: React.CSSProperties;
  minWeight?: number;
  maxWeight?: number;
  minSlant?: number;
  maxSlant?: number;
  minItal?: number;
  maxItal?: number;
}

interface CharRefData {
  element: HTMLElement;
  index: number;
  centerX: number;
  centerY: number;
  currentWeight: number;
  currentSlant: number;
  currentItal: number;
}

export default function InteractiveWaveText({
  lines,
  className,
  style,
  minWeight = 200,
  maxWeight = 800,
  minSlant = 0,
  maxSlant = -15,
  minItal = 0,
  maxItal = 1
}: InteractiveWaveTextProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const charRefs = useRef<CharRefData[]>([]);

  // Clear character refs on render so we don't hold onto stale refs,
  // but modify the array in-place to preserve reference identity.
  charRefs.current.length = 0;
  let charIndexCounter = 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Measure character centers relative to the page
    const updatePositions = () => {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      charRefs.current.forEach((char) => {
        if (!char || !char.element) return;
        const rect = char.element.getBoundingClientRect();
        char.centerX = rect.left + rect.width / 2 + scrollX;
        char.centerY = rect.top + rect.height / 2 + scrollY;
      });
    };

    // Delay slightly to ensure fonts have loaded and layout is settled
    const initialTimeout = setTimeout(updatePositions, 150);

    window.addEventListener("resize", updatePositions);
    window.addEventListener("scroll", updatePositions);

    let mouseX = 0;
    let mouseY = 0;
    let isNearContainer = false;
    let targetHoverFactor = 0;
    let currentHoverFactor = 0;

    const handleMouseEnter = () => {
      isNearContainer = true;
      targetHoverFactor = 1;
    };

    const handleMouseLeave = () => {
      isNearContainer = false;
      targetHoverFactor = 0;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.pageX;
      mouseY = e.pageY;
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousemove", handleMouseMove);

    // Animation constants
    const speed = 3; // continuous wave speed (a balanced, natural tempo)
    const waveSpacing = 0.15; // delay spacing between letters (closer spacing for smoother wave)
    const radius = 220; // mouse influence radius (in pixels)
    const lerpFactor = 0.1; // smoothness factor

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      // Smoothly blend the hover state (0 = wave, 1 = mouse follow)
      currentHoverFactor += (targetHoverFactor - currentHoverFactor) * lerpFactor;

      const timeSec = timestamp / 1000;

      // Defensive layout measurement if not done yet
      if (charRefs.current.length > 0 && charRefs.current[0] && charRefs.current[0].centerX === 0) {
        updatePositions();
      }

      charRefs.current.forEach((char) => {
        if (!char || !char.element) return;

        // 1. Calculate wave weight (starts thickening from 1st letter and flows left-to-right)
        const angle = timeSec * speed - char.index * waveSpacing;
        const waveValue = (Math.sin(angle) + 1) / 2; // 0 to 1
        const waveWeight = minWeight + waveValue * (maxWeight - minWeight);
        const waveSlant = minSlant;
        const waveItal = minItal;

        // 2. Calculate mouse proximity weight, slant and italic
        let mouseWeight = minWeight;
        let mouseSlant = minSlant;
        let mouseItal = minItal;
        if (isNearContainer) {
          const dx = mouseX - char.centerX;
          const dy = mouseY - char.centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius) {
            // Power factor of 1.5 gives a beautiful smooth exponential curve
            const influence = Math.pow(1 - dist / radius, 1.5);
            mouseWeight = minWeight + influence * (maxWeight - minWeight);
            mouseSlant = minSlant + influence * (maxSlant - minSlant);
            mouseItal = minItal + influence * (maxItal - minItal);
          }
        }

        // 3. Blend wave and mouse targets
        const targetWeight = (1 - currentHoverFactor) * waveWeight + currentHoverFactor * mouseWeight;
        const targetSlant = (1 - currentHoverFactor) * waveSlant + currentHoverFactor * mouseSlant;
        const targetItal = (1 - currentHoverFactor) * waveItal + currentHoverFactor * mouseItal;

        // 4. Smoothly lerp towards target values
        char.currentWeight += (targetWeight - char.currentWeight) * lerpFactor;
        char.currentSlant += (targetSlant - char.currentSlant) * lerpFactor;
        char.currentItal += (targetItal - char.currentItal) * lerpFactor;

        // 5. Apply style directly (bypassing React re-renders)
        const roundedWeight = Math.round(char.currentWeight);
        const roundedSlant = Math.round(char.currentSlant * 10) / 10;
        const roundedItal = Math.round(char.currentItal * 100) / 100;
        
        char.element.style.fontWeight = roundedWeight.toString();
        char.element.style.fontVariationSettings = `'wght' ${roundedWeight}, 'slnt' ${roundedSlant}, 'ital' ${roundedItal}`;
        char.element.style.transform = `skewX(${roundedSlant}deg)`;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", updatePositions);
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const splitLineIntoChars = (line: string) => {
    const words = line.split(" ");
    return words.map((word, wordIdx) => {
      const chars = word.split("");
      return (
        <span
          key={wordIdx}
          style={{ 
            display: "inline-block", 
            whiteSpace: "nowrap",
            lineHeight: "0"
          }}
        >
          {chars.map((char) => {
            const currentIndex = charIndexCounter++;
            return (
              <span
                key={currentIndex}
                ref={(el) => {
                  if (el) {
                    charRefs.current.push({
                      element: el,
                      index: currentIndex,
                      centerX: 0,
                      centerY: 0,
                      currentWeight: minWeight,
                      currentSlant: minSlant,
                      currentItal: minItal
                    });
                  }
                }}
                style={{
                  display: "inline-block",
                  fontFamily: "HDesign",
                  transition: "color 0.3s ease",
                  userSelect: "none",
                  lineHeight: "0",
                  transformOrigin: "bottom center",
                  willChange: "font-weight, font-variation-settings, transform"
                }}
              >
                {char}
              </span>
            );
          })}
          {/* Add a space between words in a line */}
          {wordIdx < words.length - 1 && (
            <span style={{ 
              display: "inline-block", 
              userSelect: "none",
              lineHeight: "0"
            }}>
              &nbsp;
            </span>
          )}
        </span>
      );
    });
  };

  return (
    <h1
      ref={containerRef}
      className={className}
      style={{
        fontSize: "clamp(3.5rem, 8.5vw, 6rem)",
        fontWeight: "900",
        color: "var(--text)",
        margin: "0 0 40px 0",
        letterSpacing: "-2px",
        lineHeight: "1.05",
        textAlign: "left",
        ...style
      }}
    >
      {lines.map((line, lineIdx) => (
        <React.Fragment key={lineIdx}>
          {splitLineIntoChars(line)}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </h1>
  );
}
