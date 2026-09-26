"use client";

import React from "react";
import { useEditorBridgeContext } from "@/context/EditorBridgeProvider";
import { MinimalBlockRenderer } from "@/themes/default-minimal/components/MinimalBlocks";
import BlockRenderer from "@/components/builder/BlockRenderer";
import pagesSchema from "@/config/pages-schema.json";

const DEFAULT_WORK_BLOCKS = [
  {
    id: "block-work-hero",
    type: "hero",
    hidden: false,
    settings: {
      line1: "{{title}}",
      line2: "{{category}}",
      quote: "Հեղինակ՝ {{author}} • Ստեղծվել է՝ {{date}}"
    }
  },
  {
    id: "block-work-details",
    type: "text",
    hidden: false,
    settings: {
      title: "Նախագծի Մասին",
      content: "{{content}}"
    }
  },
  {
    id: "block-work-cta",
    type: "cta",
    hidden: false,
    settings: {
      title: "Ցանկանու՞մ եք նմանատիպ արդյունք Ձեր բրենդի համար",
      subtitle: "Մենք պատրաստ ենք իրականացնել ամենահամարձակ դիզայներական մտքերը:",
      btn_text: "Պատվիրել Քննարկում",
      btn_url: "/contact"
    }
  }
];

export default function WorkMasterTemplatePage() {
  const { mockData, activeThemeId } = useEditorBridgeContext();

  const workPageDef = pagesSchema.pages.find((p) => p.id === "master-work");
  const fallbackData = workPageDef?.mockDatasets?.[0]?.data || {
    title: "Pasta House Identity & Packaging System",
    category: "Բրենդավորում և Փաթեթավորում",
    author: "Հրանտ Հակոբյան",
    date: "2026",
    cover_image: "/brandings/pasta/pasta1.png",
    content: "Իտալական խոհանոցի հայկական ռեստորանի բրենդային նույնականացում..."
  };

  const currentData = { ...fallbackData, ...mockData };

  return (
    <div className="dynamic-master-template-wrapper min-h-screen">
      <div style={{ background: "rgba(168, 85, 247, 0.08)", borderBottom: "1px solid rgba(168, 85, 247, 0.2)", padding: "8px 24px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#9333ea", fontWeight: 600 }}>
        <span>🎨 Work Master Template (Ցանկացած փոփոխություն կկիրառվի բոլոր պորտֆոլիո էջերի վրա)</span>
        <span>Mock Data: {currentData.title?.slice(0, 30)}...</span>
      </div>

      <main style={{ padding: "40px 0" }}>
        {DEFAULT_WORK_BLOCKS.map((block) =>
          activeThemeId === "default-minimal" ? (
            <MinimalBlockRenderer key={block.id} block={block as any} instanceData={currentData} isBuilderMode={true} />
          ) : (
            <BlockRenderer key={block.id} block={block as any} instanceData={currentData} isBuilderMode={true} />
          )
        )}
      </main>
    </div>
  );
}
