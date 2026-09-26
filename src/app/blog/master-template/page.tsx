"use client";

import React from "react";
import { useEditorBridgeContext } from "@/context/EditorBridgeProvider";
import { MinimalBlockRenderer } from "@/themes/default-minimal/components/MinimalBlocks";
import BlockRenderer from "@/components/builder/BlockRenderer";
import pagesSchema from "@/config/pages-schema.json";

const DEFAULT_BLOG_BLOCKS = [
  {
    id: "block-blog-main",
    type: "blog_post",
    hidden: false,
    settings: {
      category: "{{category}}",
      title: "{{title}}",
      author: "{{author}}",
      date: "{{date}}",
      cover_image: "{{cover_image}}",
      content: "{{content}}"
    }
  },
  {
    id: "block-blog-cta",
    type: "cta",
    hidden: false,
    settings: {
      title: "Հետաքրքրե՞ց այս հոդվածը",
      subtitle: "Բաժանորդագրվեք մեր թարմացումներին՝ նոր դիզայներական հոդվածները առաջինը կարդալու համար:",
      btn_text: "Բաժանորդագրվել",
      btn_url: "/contact"
    }
  }
];

export default function BlogMasterTemplatePage() {
  const { mockData, activeThemeId } = useEditorBridgeContext();

  const blogPageDef = pagesSchema.pages.find((p) => p.id === "master-blog");
  const fallbackData = blogPageDef?.mockDatasets?.[0]?.data || {
    title: "Հայկական Տառարվեստի և Տիպոգրաֆիկայի Ապագան 2026-ին",
    category: "Տիպոգրաֆիկա & Դիզայն",
    author: "Հրանտ Հակոբյան",
    date: "2026-09-26",
    cover_image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
    content: "Ժամանակակից թվային դարաշրջանում հայերեն գրատեսակների մշակույթը թևակոխում է նոր փուլ..."
  };

  const currentData = { ...fallbackData, ...mockData };

  return (
    <div className="dynamic-master-template-wrapper min-h-screen">
      <div style={{ background: "rgba(20, 184, 166, 0.08)", borderBottom: "1px solid rgba(20, 184, 166, 0.2)", padding: "8px 24px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#0d9488", fontWeight: 600 }}>
        <span>⚡ Blog Master Template (Ցանկացած փոփոխություն կկիրառվի բոլոր բլոգային էջերի վրա)</span>
        <span>Mock Data: {currentData.title?.slice(0, 30)}...</span>
      </div>

      <main style={{ padding: "40px 0" }}>
        {DEFAULT_BLOG_BLOCKS.map((block) =>
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
