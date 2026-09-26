"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import BlockRenderer from "@/components/builder/BlockRenderer";
import siteData from "@/config/site-data.json";

export default function ProductDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "hdesign-pro-font";

  // 1. Get universal Product Template
  const template = siteData.templates.product;
  const blocks = template?.blocks || [];

  // 2. Get specific instance data (or fallback)
  const instanceData = useMemo(() => {
    const found = (siteData.instances.products as Record<string, any>)?.[id];
    if (found) return found;

    // Fallback instance if editing the generic template or unknown id
    return {
      id,
      slug: id,
      title: id === "template" ? "Նմուշային Պրոդուկտ" : `Ապրանք: ${id}`,
      price: "50,000 AMD",
      sku: `SKU-${id.toUpperCase()}`,
      category: "Digital Assets",
      description: "Այս ապրանքը ցուցադրում է ունիվերսալ Product Template-ի և կոնկրետ instance-ի համակցումը:",
      features: "Instant Download, License Included, Free Updates, Commercial Use",
      stock_status: "Առկա է պահեստում"
    };
  }, [id]);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {blocks.map((block: any) => (
        <BlockRenderer key={block.id} block={block} instanceData={instanceData} />
      ))}
    </main>
  );
}
