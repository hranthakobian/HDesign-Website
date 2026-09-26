"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FigmaCanvas from "@/components/builder/FigmaCanvas";
import ThemesTab from "@/components/admin/ThemesTab";

function BuilderContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const initialSlug = searchParams.get("slug") || "index";
  const drawerParam = searchParams.get("drawer") as "personalization" | "pages" | null;
  const initialDrawer = drawerParam === "personalization" || drawerParam === "pages" ? drawerParam : null;

  // If view=classic is requested, render classic inspector tabs, otherwise render FigmaCanvas
  if (view === "classic") {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "#ffffff", margin: 0, padding: 0 }}>
        <ThemesTab
          initialPageSlug={initialSlug}
          initialActiveDrawer={initialDrawer}
          standaloneMode={true}
          initialSubTab="builder"
        />
      </div>
    );
  }

  return <FigmaCanvas />;
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "3rem", textAlign: "center", color: "#64748b", background: "#090d16", minHeight: "100vh" }}>
          Բեռնվում է Figma-Style Visual Canvas-ը...
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
