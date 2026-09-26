import React from "react";
import BlockRenderer from "@/components/builder/BlockRenderer";
import siteData from "@/config/site-data.json";

export const dynamic = "force-dynamic";

const DEFAULT_404_BLOCKS = [
  {
    id: "system-block-404",
    type: "system_status",
    hidden: false,
    settings: {
      status_code: "404",
      title: "Էջը Չի Գտնվել (404)",
      subtitle: "Ձեր հայցած էջը չի գտնվել, ջնջվել է կամ հասցեն սխալ է մուտքագրվել:",
      btn_text: "Վերադառնալ Գլխավոր Էջ",
      btn_url: "/"
    }
  }
];

export default function NotFound() {
  const systemPages = (siteData as any)?.systemPages || {};
  const page = systemPages["404"];
  const blocks = page?.blocks && page.blocks.length > 0 ? page.blocks : DEFAULT_404_BLOCKS;

  return (
    <main className="min-h-screen flex flex-col justify-center" style={{ background: "var(--theme-bg, #ffffff)", color: "var(--theme-text, #111827)" }}>
      {blocks.map((block: any) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </main>
  );
}
