"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { locale } = useI18n();

  useEffect(() => {
    document.title = locale === "en" ? "404 - Page Not Found | HDesign" : "404 - Էջը չի գտնվել | HDesign";
  }, [locale]);

  return (
    <main
      className="shell"
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          flexWrap: "wrap"
        }}
      >
        <span
          style={{
            fontSize: "3.5rem",
            fontWeight: 800,
            color: "var(--text)",
            lineHeight: 1,
            letterSpacing: "-0.02em"
          }}
        >
          404
        </span>

        <span
          style={{
            width: "1px",
            height: "48px",
            background: "var(--panel-border)",
            display: "inline-block"
          }}
        />

        <span
          style={{
            fontSize: "1.15rem",
            color: "var(--muted)",
            fontWeight: 500
          }}
        >
          {locale === "en" ? "This page could not be found." : "Էջը չի գտնվել:"}
        </span>
      </div>

      <div style={{ marginTop: "32px" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 22px",
            borderRadius: "10px",
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            color: "var(--text)",
            fontSize: "0.95rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "var(--shadow)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--panel-border)";
            e.currentTarget.style.color = "var(--text)";
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>←</span>
          <span>{locale === "en" ? "Return to Home" : "Վերադառնալ Գլխավոր Էջ"}</span>
        </Link>
      </div>
    </main>
  );
}
