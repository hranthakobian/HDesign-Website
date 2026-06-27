"use client";

import { useEffect, useState } from "react";

interface RatingSystemProps {
  id: string;
  locale: "hy" | "en";
}

const STAR_PATH_GROUPS = [
  {
    x: 5.25,
    paths: [
      "M4 24.25V22.25C4 21.5596 4.55964 21 5.25 21C5.94036 21 6.5 21.5596 6.5 22.25V24.25C6.5 24.9404 5.94036 25.5 5.25 25.5C4.55964 25.5 4 24.9404 4 24.25Z"
    ]
  },
  {
    x: 11.25,
    paths: [
      "M10 27.25V22.25C10 21.5596 10.5596 21 11.25 21C11.9404 21 12.5 21.5596 12.5 22.25V27.25C12.5 27.9404 11.9404 28.5 11.25 28.5C10.5596 28.5 10 27.9404 10 27.25Z",
      "M10 52.25V48.25C10 47.5596 10.5596 47 11.25 47C11.9404 47 12.5 47.5596 12.5 48.25V52.25C12.5 52.9404 11.9404 53.5 11.25 53.5C10.5596 53.5 10 52.9404 10 52.25Z"
    ]
  },
  {
    x: 17.25,
    paths: [
      "M16 32.25V22.25C16 21.5596 16.5596 21 17.25 21C17.9404 21 18.5 21.5596 18.5 22.25V32.25C18.5 32.9404 17.9404 33.5 17.25 33.5C16.5596 33.5 16 32.9404 16 32.25Z",
      "M16 48.25V36.25C16 35.5596 16.5596 35 17.25 35C17.9404 35 18.5 35.5596 18.5 36.25V48.25C18.5 48.9404 17.9404 49.5 17.25 49.5C16.5596 49.5 16 48.9404 16 48.25Z"
    ]
  },
  {
    x: 23.25,
    paths: [
      "M22 44.25V16.25C22 15.5596 22.5596 15 23.25 15C23.9404 15 24.5 15.5596 24.5 16.25V44.25C24.5 44.9404 23.9404 45.5 23.25 45.5C22.5596 45.5 22 44.9404 22 44.25Z"
    ]
  },
  {
    x: 29.25,
    paths: [
      "M28 40.25V5.25C28 4.55964 28.5596 4 29.25 4C29.9404 4 30.5 4.55964 30.5 5.25V40.25C30.5 40.9404 29.9404 41.5 29.25 41.5C28.5596 41.5 28 40.9404 28 40.25Z"
    ]
  },
  {
    x: 35.25,
    paths: [
      "M34 43.25V16.25C34 15.5596 34.5596 15 35.25 15C35.9404 15 36.5 15.5596 36.5 16.25V43.25C36.5 43.9404 35.9404 44.5 35.25 44.5C34.5596 44.5 34 43.9404 34 43.25Z"
    ]
  },
  {
    x: 41.25,
    paths: [
      "M40 32.25V22.25C40 21.5596 40.5596 21 41.25 21C41.9404 21 42.5 21.5596 42.5 22.25V32.25C42.5 32.9404 41.9404 33.5 41.25 33.5C40.5596 33.5 40 32.9404 40 32.25Z",
      "M40 47.25V36.25C40 35.5596 40.5596 35 41.25 35C41.9404 35 42.5 35.5596 42.5 36.25V47.25C42.5 47.9404 41.9404 48.5 41.25 48.5C40.5596 48.5 40 47.9404 40 47.25Z"
    ]
  },
  {
    x: 47.25,
    paths: [
      "M46 28.25V22.25C46 21.5596 46.5596 21 47.25 21C47.9404 21 48.5 21.5596 48.5 22.25V28.25C48.5 28.9404 47.9404 29.5 47.25 29.5C46.5596 29.5 46 28.9404 46 28.25Z",
      "M46 52.25V48.25C46 47.5596 46.5596 47 47.25 47C47.9404 47 48.5 47.5596 48.5 48.25V52.25C48.5 52.9404 47.9404 53.5 47.25 53.5C46.5596 53.5 46 52.9404 46 52.25Z"
    ]
  },
  {
    x: 53.25,
    paths: [
      "M52 24.25V22.25C52 21.5596 52.5596 21 53.25 21C53.9404 21 54.5 21.5596 54.5 22.25V24.25C54.5 24.9404 53.9404 25.5 53.25 25.5C52.5596 25.5 52 24.9404 52 24.25Z"
    ]
  }
];

export default function RatingSystem({ id, locale }: RatingSystemProps) {
  const [sum, setSum] = useState(0);
  const [count, setCount] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [userId, setUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let uid = localStorage.getItem("hdesign_rating_user_id");
      if (!uid) {
        uid = "r_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("hdesign_rating_user_id", uid);
      }
      setUserId(uid);

      fetch("/api/ratings")
        .then((r) => r.json())
        .then((data) => {
          const item = data[id];
          if (item) {
            setSum(item.sum || 0);
            setCount(item.count || 0);
            if (item.users) {
              if (Array.isArray(item.users)) {
                if (item.users.includes(uid)) setHasRated(true);
              } else if (typeof item.users === 'object' && uid in item.users) {
                setHasRated(true);
              }
            }
          }
        })
        .catch((err) => console.warn("Failed to load rating stats:", err));
    }
  }, [id]);

  const handleRate = async (ratingIdx: number) => {
    if (submitting || !userId) return;
    setSubmitting(true);

    const rating = parseFloat(((ratingIdx + 1) / 45 * 5).toFixed(2));

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, rating, userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSum(data.sum);
        setCount(data.count);
        setHasRated(true);
      } else {
        alert(locale === "hy" ? "Գնահատումը չհաջողվեց" : "Rating submission failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const avg = count > 0 ? (sum / count) : 0;
  const linesCount = Math.round((avg / 5) * 45);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "16px 20px",
        background: "rgba(10, 10, 15, 0.5)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--panel-border)",
        borderRadius: 16,
        maxWidth: 340,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: "0.78rem", color: "#ffffff", opacity: 0.7, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
          {locale === "hy" ? "Գնահատում" : "Rating"}
        </span>
        <span style={{ fontSize: "0.82rem", color: "#ffcc00", fontWeight: 700 }}>
          ★ {avg.toFixed(1)} / 5 ({count} {locale === "hy" ? "ձայն" : "votes"})
        </span>
      </div>

      <div 
        style={{ display: "flex", alignItems: "center", gap: 4, margin: "4px 0" }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {[0, 1, 2, 3, 4].map((starIdx) => (
          <svg
            key={starIdx}
            width="42"
            height="42"
            viewBox="0 0 57 57"
            style={{ overflow: "visible" }}
          >
            {STAR_PATH_GROUPS.map((col, i) => {
              const globalIdx = starIdx * 9 + i;
              const active = hoverIdx !== null ? globalIdx <= hoverIdx : globalIdx < linesCount;
              
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoverIdx(globalIdx)}
                  onClick={() => handleRate(globalIdx)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Invisible thick background rect for easy mouse hover targeting */}
                  <rect
                    x={col.x - 3}
                    y={0}
                    width={6}
                    height={57}
                    fill="transparent"
                  />
                  
                  {/* Vector Paths representing the star lines */}
                  {col.paths.map((d, pIdx) => (
                    <path
                      key={pIdx}
                      d={d}
                      fill={active ? "#ffcc00" : "rgba(255,255,255,0.15)"}
                      style={{ transition: "fill 0.15s" }}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        ))}
      </div>
    </div>
  );
}
