"use client";

import React, { useState, useRef } from "react";

interface SoftwareTooltipProps {
  name: string;
  children: React.ReactNode;
}

export default function SoftwareTooltip({ name, children }: SoftwareTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Calculate if there is enough space above the element (e.g. 45px) in viewport
      if (rect.top < 45) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            ...(position === 'top'
              ? { bottom: "100%", marginBottom: "7px" }
              : { top: "100%", marginTop: "7px" }),
            backgroundColor: "#000000",
            color: "#ffffff",
            padding: "4px 9px",
            borderRadius: "6px",
            fontSize: "0.72rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
            pointerEvents: "none",
            animation: "fadeIn 0.15s ease-in-out"
          }}
        >
          {name}
          {/* Centered triangle pointing towards the trigger element */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              ...(position === 'top'
                ? {
                    top: "100%",
                    borderTop: "5px solid #000000"
                  }
                : {
                    bottom: "100%",
                    borderBottom: "5px solid #000000"
                  })
            }}
          />
        </div>
      )}
    </div>
  );
}
