"use client";

import { useEffect, useState, useRef } from "react";

interface SectionBackgroundProps {
  color: string;
  className: string;
  type: "about" | "footer";
}

export default function SectionBackground({ color, className, type }: SectionBackgroundProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;
    
    // Set initial size
    setSize({
      width: ref.current.clientWidth,
      height: ref.current.clientHeight
    });

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSize({
          width: entry.target.clientWidth,
          height: entry.target.clientHeight
        });
      }
    });

    observer.observe(ref.current);

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          revealObserver.disconnect();
        }
      });
    }, { threshold: 0.1 });

    revealObserver.observe(ref.current);

    return () => {
      observer.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  const { width, height } = size;

  // Generate path only when size is measured
  let pathData = "";
  let imageClipPath = "";
  let imgRenderWidth = 0;

  if (width > 0 && height > 0) {
    if (type === "about") {
      pathData = `M 78 72 
                  L ${width - 88} 72 
                  A 80 80 0 0 0 ${width} 0 
                  L ${width + 1} ${height - 80} 
                  A 80 80 0 0 1 ${width - 79} ${height} 
                  L 80 ${height} 
                  A 80 80 0 0 1 0 ${height - 80} 
                  L 0 0 
                  A 80 80 0 0 0 78 72 
                  Z`;

      // Profile image clipping mask:
      // Flush to top edge (y=72, with concave arc from (0,0)), left (x=0),
      // bottom edge (y=height, with convex arc to (0, height-80)),
      // and right side has a smooth rounded arch connecting top and bottom.
      const col1Right = 105 + ((width - 258) * 1.5) / 2.7;
      const bulgeX = Math.round(Math.min(Math.max(col1Right + 35, 680), 830));
      const s = Math.round(Math.min(bulgeX * 0.33, 255));
      const topEndX = bulgeX - s;
      const bottomEndX = bulgeX - s;
      const h = (height - 72) / 2;
      const R = Math.round((h * h + s * s) / (2 * s));

      imageClipPath = `M 0 0 
                       A 80 80 0 0 0 78 72 
                       L ${topEndX} 72 
                       A ${R} ${R} 0 0 1 ${bottomEndX} ${height} 
                       L 80 ${height} 
                       A 80 80 0 0 1 0 ${height - 80} 
                       L 0 0 
                       Z`;

      // New 4:3 (1024x768) image uncropped width
      imgRenderWidth = Math.round(height * (1024 / 768));
    } else {
      // Footer exact Figma path coordinates, parameterized with flat bottom
      pathData = `M 78 72 
                  L ${width - 88} 72 
                  A 80 80 0 0 0 ${width} 0 
                  L ${width + 2} ${height} 
                  L 0 ${height} 
                  L 0 0 
                  A 80 80 0 0 0 78 72 
                  Z`;
    }
  }

  return (
    <div ref={ref} className={className} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {width > 0 && height > 0 && (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", top: 0, left: 0 }}>
          {type === "about" && (
            <defs>
              <clipPath id="about-image-mask">
                <path d={imageClipPath} />
              </clipPath>
            </defs>
          )}
          <path d={pathData} fill={color} />
          {type === "about" && (
            <g
              className="about-profile-svg-image"
              style={{
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed ? "translateX(0)" : "translateX(-30px)",
                transition: "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <image
                href="/profile_hrant.jpg"
                x="0"
                y="0"
                width={imgRenderWidth}
                height={height}
                preserveAspectRatio="xMinYMid slice"
                clipPath="url(#about-image-mask)"
                style={{ pointerEvents: "auto" }}
              />
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
