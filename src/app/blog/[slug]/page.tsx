"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import BlockRenderer from "@/components/builder/BlockRenderer";
import siteData from "@/config/site-data.json";

export default function BlogPostPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "first-post";

  // 1. Get universal Blog Template
  const template = siteData.templates.blog;
  const blocks = template?.blocks || [];

  // 2. Get specific instance data (or fallback)
  const instanceData = useMemo(() => {
    const found = (siteData.instances.blog as Record<string, any>)?.[slug];
    if (found) return found;

    // Fallback instance if editing the generic template or unknown slug
    return {
      id: "preview-instance",
      slug,
      title: slug === "template" ? "Բլոգի Նմուշային Հոդված" : `Հոդված: ${slug}`,
      author: "Հրանտ Հակոբյան",
      date: "24 Սեպտեմբեր 2026",
      category: "Design & Development",
      excerpt: "Այս հոդվածը ցուցադրում է ունիվերսալ Blog Template-ի և կոնկրետ instance-ի միաձուլումը:",
      content: "Բովանդակությունը դինամիկ կերպով տեղադրվում է template-ի մեջ: Երբ Visual Builder-ում փոփոխում եք Template-ը, այն անմիջապես ազդում է բոլոր հոդվածների կառուցվածքի վրա:"
    };
  }, [slug]);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {blocks.map((block: any) => (
        <BlockRenderer key={block.id} block={block} instanceData={instanceData} />
      ))}
    </main>
  );
}
