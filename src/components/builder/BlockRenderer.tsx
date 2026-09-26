"use client";

import React from "react";
import Link from "next/link";
import { BlockItem } from "@/lib/themeTypes";

interface BlockRendererProps {
  block: BlockItem;
  instanceData?: Record<string, any>;
  isBuilderMode?: boolean;
}

/**
 * Replaces {{key}} in text with instance data values
 */
function interpolate(text: any, data?: Record<string, any>): any {
  if (typeof text !== "string" || !data) return text;
  return text.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : "";
  });
}

/**
 * Deeply interpolates an entire settings object
 */
function interpolateSettings(settings: Record<string, any>, data?: Record<string, any>): Record<string, any> {
  if (!data || !settings) return settings;
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(settings)) {
    if (typeof v === "string") {
      result[k] = interpolate(v, data);
    } else if (Array.isArray(v)) {
      result[k] = v.map((item) => (typeof item === "object" ? interpolateSettings(item, data) : interpolate(item, data)));
    } else if (typeof v === "object" && v !== null) {
      result[k] = interpolateSettings(v, data);
    } else {
      result[k] = v;
    }
  }
  return result;
}

export default function BlockRenderer({ block, instanceData, isBuilderMode = false }: BlockRendererProps) {
  if (block.hidden) return null;

  const rawSettings = block.settings || {};
  const settings = interpolateSettings(rawSettings, instanceData);
  const blockId = block.id || `block-${block.type}`;

  const containerStyle: React.CSSProperties = {
    padding: settings.padding || "60px 24px",
    backgroundColor: settings.bg_color || "transparent",
    transition: "background-color 0.2s ease",
    position: "relative"
  };

  switch (block.type) {
    case "system_status": {
      const statusCode = settings.status_code || "404";
      const is500 = statusCode === "500";
      return (
        <section
          data-block-id={blockId}
          data-block-type="system_status"
          className="hd-builder-editable-block min-h-[70vh] flex items-center justify-center text-center px-6 py-20"
          style={containerStyle}
        >
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <div
              data-editable-key="status_code"
              className="text-8xl sm:text-9xl font-black tracking-tight select-none mb-4"
              style={{
                color: is500 ? "#ef4444" : "var(--accent-color, #14b8a6)",
                textShadow: "0 10px 40px rgba(20, 184, 166, 0.2)"
              }}
            >
              {statusCode}
            </div>
            <h1
              data-editable-key="title"
              className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight text-slate-900 dark:text-slate-100"
            >
              {settings.title || (is500 ? "Սերվերի Սխալ (500)" : "Էջը Չի Գտնվել (404)")}
            </h1>
            <p
              data-editable-key="subtitle"
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed"
            >
              {settings.subtitle || "Հայցվող էջը գոյություն չունի կամ տեղափոխվել է:"}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={settings.btn_url || "/"}
                data-editable-key="btn_text"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: is500 ? "#ef4444" : "var(--accent-color, #14b8a6)"
                }}
              >
                {settings.btn_text || "Վերադառնալ Գլխավոր Էջ"}
              </Link>
              {is500 && (
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Կրկնել Հարցումը
                </button>
              )}
            </div>
          </div>
        </section>
      );
    }

    case "hero": {
      return (
        <section
          data-block-id={blockId}
          data-block-type="hero"
          className="hd-builder-editable-block relative overflow-hidden py-24 sm:py-32"
          style={containerStyle}
        >
          <div className="max-w-5xl mx-auto px-6 text-center">
            {settings.subtitle && (
              <p
                data-editable-key="subtitle"
                className="text-sm sm:text-base font-semibold tracking-wider uppercase mb-4"
                style={{ color: "var(--accent-color, #14b8a6)" }}
              >
                {settings.subtitle}
              </p>
            )}
            <h1
              data-editable-key="title"
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900 dark:text-slate-50"
            >
              {settings.title || "Վերնագիր"}
            </h1>
            {settings.description && (
              <p
                data-editable-key="description"
                className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed"
              >
                {settings.description}
              </p>
            )}
            {settings.btn_text && (
              <div>
                <Link
                  href={settings.btn_url || "#"}
                  data-editable-key="btn_text"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-medium text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ background: "var(--accent-color, #14b8a6)" }}
                >
                  {settings.btn_text}
                </Link>
              </div>
            )}
          </div>
        </section>
      );
    }

    case "text": {
      return (
        <section
          data-block-id={blockId}
          data-block-type="text"
          className="hd-builder-editable-block py-16"
          style={containerStyle}
        >
          <div className="max-w-3xl mx-auto px-6">
            {settings.title && (
              <h2
                data-editable-key="title"
                className="text-2xl sm:text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100"
              >
                {settings.title}
              </h2>
            )}
            <div
              data-editable-key="content"
              className="prose prose-slate dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300"
            >
              {settings.content}
            </div>
          </div>
        </section>
      );
    }

    case "features": {
      const items = Array.isArray(settings.items) ? settings.items : [];
      return (
        <section
          data-block-id={blockId}
          data-block-type="features"
          className="hd-builder-editable-block py-20"
          style={containerStyle}
        >
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              {settings.subtitle && (
                <p className="text-sm font-semibold tracking-wider uppercase mb-2" style={{ color: "var(--accent-color, #14b8a6)" }}>
                  {settings.subtitle}
                </p>
              )}
              <h2 data-editable-key="title" className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
                {settings.title || "Առավելություններ"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{item.icon || "✨"}</div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "product_details": {
      return (
        <section
          data-block-id={blockId}
          data-block-type="product_details"
          className="hd-builder-editable-block py-16"
          style={containerStyle}
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                <div>
                  <h2 data-editable-key="title" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {settings.title || "Ապրանքի Տվյալներ"}
                  </h2>
                  {settings.sku && (
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-mono mt-1 block">
                      SKU: {settings.sku}
                    </span>
                  )}
                </div>
                <div
                  data-editable-key="price"
                  className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400"
                >
                  {settings.price || "—"}
                </div>
              </div>

              {settings.features && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Հնարավորություններ</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{settings.features}</p>
                </div>
              )}

              {settings.stock_status && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {settings.stock_status}
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    case "contact": {
      return (
        <section
          data-block-id={blockId}
          data-block-type="contact"
          className="hd-builder-editable-block py-20"
          style={containerStyle}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 data-editable-key="title" className="text-3xl sm:text-4xl font-bold mb-10 text-slate-900 dark:text-slate-100">
              {settings.title || "Կապ Հաստատեք Մեզ Հետ"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:scale-105 transition-transform"
                >
                  <div className="text-3xl mb-2">✉️</div>
                  <div className="text-xs uppercase text-slate-400 font-bold mb-1">Էլ. Փոստ</div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold">{settings.email}</div>
                </a>
              )}
              {settings.tel && (
                <a
                  href={`tel:${settings.tel}`}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:scale-105 transition-transform"
                >
                  <div className="text-3xl mb-2">📞</div>
                  <div className="text-xs uppercase text-slate-400 font-bold mb-1">Հեռախոս</div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold">{settings.tel}</div>
                </a>
              )}
              {settings.address && (
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
                  <div className="text-3xl mb-2">📍</div>
                  <div className="text-xs uppercase text-slate-400 font-bold mb-1">Հասցե</div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold">{settings.address}</div>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    case "cta": {
      return (
        <section
          data-block-id={blockId}
          data-block-type="cta"
          className="hd-builder-editable-block py-20 text-center"
          style={containerStyle}
        >
          <div className="max-w-4xl mx-auto px-6">
            <h2 data-editable-key="title" className="text-3xl sm:text-5xl font-extrabold mb-4 text-slate-900 dark:text-slate-100">
              {settings.title || "Պատրա՞ստ եք սկսել"}
            </h2>
            {settings.subtitle && (
              <p data-editable-key="subtitle" className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                {settings.subtitle}
              </p>
            )}
            {settings.btn_text && (
              <Link
                href={settings.btn_url || "#"}
                data-editable-key="btn_text"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                style={{ background: "var(--accent-color, #14b8a6)" }}
              >
                {settings.btn_text}
              </Link>
            )}
          </div>
        </section>
      );
    }

    default: {
      return (
        <section
          data-block-id={blockId}
          data-block-type={block.type}
          className="hd-builder-editable-block py-12 px-6 max-w-4xl mx-auto"
          style={containerStyle}
        >
          <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-xs font-mono uppercase text-slate-400 mb-2">Block: {block.type} (#{blockId})</div>
            <h3 data-editable-key="title" className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {settings.title || block.type}
            </h3>
            {settings.subtitle && <p data-editable-key="subtitle" className="text-slate-500 mt-1">{settings.subtitle}</p>}
            {settings.content && <p data-editable-key="content" className="text-slate-600 dark:text-slate-400 mt-3">{settings.content}</p>}
          </div>
        </section>
      );
    }
  }
}
