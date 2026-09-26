"use client";

import React, { useEffect } from "react";
import BlockRenderer from "@/components/builder/BlockRenderer";
import siteData from "@/config/site-data.json";

const DEFAULT_500_BLOCKS = [
  {
    id: "system-block-500",
    type: "system_status",
    hidden: false,
    settings: {
      status_code: "500",
      title: "Սերվերի Սխալ (500)",
      subtitle: "Տեղի է ունեցել համակարգային սխալ: Մեր մասնագետներն արդեն աշխատում են դրա լուծման ուղղությամբ:",
      btn_text: "Վերադառնալ Գլխավոր",
      btn_url: "/"
    }
  }
];

export default function GlobalErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global system error:", error);
  }, [error]);

  const systemPages = (siteData as any)?.systemPages || {};
  const page = systemPages["500"];
  const blocks = page?.blocks && page.blocks.length > 0 ? page.blocks : DEFAULT_500_BLOCKS;

  return (
    <main className="min-h-screen flex flex-col justify-center" style={{ background: "var(--theme-bg, #ffffff)", color: "var(--theme-text, #111827)" }}>
      {blocks.map((block: any) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </main>
  );
}
