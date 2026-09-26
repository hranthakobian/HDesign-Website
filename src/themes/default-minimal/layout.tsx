"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

interface MinimalThemeLayoutProps {
  children: ReactNode;
  siteTitle?: { hy: string; en: string };
  navigationLinks?: Array<{ href: string; label: string }>;
  footerText?: string;
}

export default function MinimalThemeLayout({
  children,
  siteTitle = { hy: "HDesign Minimal", en: "HDesign Minimal" },
  navigationLinks = [
    { href: "/", label: "Գլխավոր" },
    { href: "/about", label: "Մասին" },
    { href: "/works", label: "Աշխատանքներ" },
    { href: "/contact", label: "Կապ" },
    { href: "/blog/master-template", label: "Բլոգ" }
  ],
  footerText = "© 2026 HDesign Studio. Բոլոր իրավունքները պաշտպանված են:"
}: MinimalThemeLayoutProps) {
  return (
    <div className="theme-default-minimal">
      {/* Minimal Sticky Header */}
      <header className="minimal-header">
        <div className="minimal-container">
          <div className="minimal-header-inner">
            <Link href="/" className="minimal-logo">
              <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "var(--theme-accent)" }}></span>
              <span>{siteTitle.hy || "HDesign"}</span>
            </Link>

            <nav className="minimal-nav">
              {navigationLinks.map((link, idx) => (
                <Link key={idx} href={link.href} className="minimal-nav-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main style={{ minHeight: "calc(100vh - 160px)" }}>
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="minimal-footer">
        <div className="minimal-container">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "4px" }}>{siteTitle.hy || "HDesign"}</div>
              <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>{footerText}</div>
            </div>
            <div style={{ display: "flex", gap: "24px", fontSize: "0.875rem" }}>
              <Link href="/about">Մասին</Link>
              <Link href="/works">Աշխատանքներ</Link>
              <Link href="/contact">Կապ</Link>
              <Link href="/404">404 Էջ</Link>
              <Link href="/500">500 Էջ</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
