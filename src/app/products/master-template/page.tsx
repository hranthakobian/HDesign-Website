"use client";

import React from "react";
import { useEditorBridgeContext } from "@/context/EditorBridgeProvider";
import { MinimalBlockRenderer } from "@/themes/default-minimal/components/MinimalBlocks";
import BlockRenderer from "@/components/builder/BlockRenderer";
import pagesSchema from "@/config/pages-schema.json";

const DEFAULT_PRODUCT_BLOCKS = [
  {
    id: "block-product-main",
    type: "product_details",
    hidden: false,
    settings: {
      category: "{{category}}",
      title: "{{title}}",
      price: "{{price}}",
      author: "{{author}}",
      date: "{{date}}",
      cover_image: "{{cover_image}}",
      content: "{{content}}"
    }
  },
  {
    id: "block-product-cta",
    type: "cta",
    hidden: false,
    settings: {
      title: "Ցանկանու՞մ եք պատվիրել հատուկ լիցենզիա",
      subtitle: "Մեր թիմը կարող է ադապտացնել ցանկացած տառատեսակ կամ պատկերակային համակարգ Ձեր բրենդի համար:",
      btn_text: "Կապվել Հիմնադրի հետ",
      btn_url: "/contact"
    }
  }
];

export default function ProductMasterTemplatePage() {
  const { mockData, activeThemeId } = useEditorBridgeContext();

  const prodPageDef = pagesSchema.pages.find((p) => p.id === "master-product");
  const fallbackData = prodPageDef?.mockDatasets?.[0]?.data || {
    title: "HDesign Armenian Pro Font Family",
    category: "Տառատեսակների Փաթեթ",
    price: "֏ 24,000",
    author: "HDesign Foundry",
    date: "2026-09-15",
    cover_image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
    content: "Ամբողջական հայերեն և լատիներեն տառատեսակային ընտանիք..."
  };

  const currentData = { ...fallbackData, ...mockData };

  return (
    <div className="dynamic-master-template-wrapper min-h-screen">
      <div style={{ background: "rgba(14, 165, 233, 0.08)", borderBottom: "1px solid rgba(14, 165, 233, 0.2)", padding: "8px 24px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#0284c7", fontWeight: 600 }}>
        <span>📦 Product Master Template (Ցանկացած փոփոխություն կկիրառվի բոլոր ապրանքների վրա)</span>
        <span>Mock Data: {currentData.title?.slice(0, 30)}...</span>
      </div>

      <main style={{ padding: "40px 0" }}>
        {DEFAULT_PRODUCT_BLOCKS.map((block) =>
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
