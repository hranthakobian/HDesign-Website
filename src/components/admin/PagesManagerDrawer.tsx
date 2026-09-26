"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageSchema, BlockItem } from "@/lib/themeTypes";

interface PagesManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlug: string;
  onSelectPage: (slug: string) => void;
  onPagesUpdated?: () => void;
}

export default function PagesManagerDrawer({
  isOpen,
  onClose,
  activeSlug,
  onSelectPage,
  onPagesUpdated
}: PagesManagerDrawerProps) {
  const [pages, setPages] = useState<PageSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search & Categories Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "main" | "system" | "templates" | "works" | "apps">("all");

  // New Page form state
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newMetaDesc, setNewMetaDesc] = useState("");
  const [newTemplate, setNewTemplate] = useState<"empty" | "text_features" | "clone_home">("text_features");
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Editing existing page state
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMetaDesc, setEditMetaDesc] = useState("");
  const [editPublished, setEditPublished] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/builder/pages?action=list");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.pages)) {
          setPages(data.pages);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch pages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      // Dropdown Cleaning: Never show individual dynamic instance posts/products/cases
      if (p.slug.startsWith("works/") && p.slug !== "works" && p.slug !== "templates/work") return false;
      if (p.slug.startsWith("blog/") && p.slug !== "blog" && p.slug !== "templates/blog") return false;
      if (p.slug.startsWith("products/") && p.slug !== "products" && p.slug !== "templates/product") return false;

      // Category filter
      if (activeTab === "main") {
        if (
          p.slug.startsWith("apps/") ||
          p.slug === "ocr" ||
          p.slug === "hdesign" ||
          p.slug === "404" ||
          p.slug === "500" ||
          p.slug.startsWith("templates/") ||
          p.slug.includes("template")
        ) {
          return false;
        }
      } else if (activeTab === "system") {
        if (p.slug !== "404" && p.slug !== "500") return false;
      } else if (activeTab === "templates") {
        if (!p.slug.startsWith("templates/") && !p.slug.includes("template")) return false;
      } else if (activeTab === "works") {
        if (p.slug !== "works" && p.slug !== "templates/work") return false;
      } else if (activeTab === "apps") {
        if (!p.slug.startsWith("apps/") && p.slug !== "apps" && p.slug !== "ocr" && p.slug !== "hdesign") return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (p.title || "").toLowerCase().includes(q);
        const matchSlug = (p.slug || "").toLowerCase().includes(q);
        return matchTitle || matchSlug;
      }

      return true;
    });
  }, [pages, activeTab, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchPages();
    }
  }, [isOpen, fetchPages]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) {
      showToast("⚠️ Լրացրեք վերնագիրը և slug-ը");
      return;
    }

    const cleanSlug = slugify(newSlug);
    if (pages.some((p) => p.slug === cleanSlug)) {
      showToast("⚠️ Այս հասցեով էջ արդեն կա");
      return;
    }

    setSubmittingCreate(true);
    try {
      let initialBlocks: BlockItem[] = [];
      if (newTemplate === "text_features") {
        initialBlocks = [
          {
            id: `block-text-${Date.now()}`,
            type: "text",
            hidden: false,
            settings: {
              title: newTitle,
              content: "Այստեղ կարող եք ավելացնել էջի հիմնական նկարագրությունը կամ ցանկացած տեքստային տեղեկատվություն:"
            }
          },
          {
            id: `block-features-${Date.now() + 1}`,
            type: "features",
            hidden: false,
            settings: {
              title: "Առավելություններ",
              subtitle: "Հիմնական հնարավորությունները",
              items: [
                { title: "Հնարավորություն 1", desc: "Նկարագրություն 1", icon: "✨" },
                { title: "Հնարավորություն 2", desc: "Նկարագրություն 2", icon: "⚡" },
                { title: "Հնարավորություն 3", desc: "Նկարագրություն 3", icon: "🎯" }
              ]
            }
          }
        ];
      } else if (newTemplate === "clone_home") {
        const homePage = pages.find((p) => p.slug === "index");
        if (homePage?.blocks) {
          initialBlocks = JSON.parse(JSON.stringify(homePage.blocks)).map((b: BlockItem, idx: number) => ({
            ...b,
            id: `block-${b.type}-${Date.now()}-${idx}`
          }));
        }
      }

      const newPage: PageSchema = {
        slug: cleanSlug,
        title: newTitle.trim(),
        is_published: true,
        meta: {
          meta_title: `${newTitle.trim()} | HDesign`,
          meta_description: newMetaDesc.trim() || `${newTitle.trim()} էջ`
        },
        blocks: initialBlocks
      };

      const res = await fetch("/api/builder/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: newPage })
      });

      if (res.ok) {
        showToast("✓ Էջը հաջողությամբ ստեղծվեց");
        setNewTitle("");
        setNewSlug("");
        setNewMetaDesc("");
        setIsCreating(false);
        await fetchPages();
        onPagesUpdated?.();
        onSelectPage(cleanSlug);
      } else {
        showToast("⚠️ Սխալ էջը ստեղծելիս");
      }
    } catch {
      showToast("⚠️ Կապի խնդիր");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleStartEdit = (page: PageSchema) => {
    setEditingSlug(page.slug);
    setEditTitle(page.title);
    setEditMetaDesc(page.meta?.meta_description || "");
    setEditPublished(page.is_published !== false);
  };

  const handleSaveEdit = async (page: PageSchema) => {
    setSavingEdit(true);
    try {
      const updatedPage: PageSchema = {
        ...page,
        title: editTitle.trim(),
        is_published: editPublished,
        meta: {
          ...page.meta,
          meta_title: `${editTitle.trim()} | HDesign`,
          meta_description: editMetaDesc.trim()
        }
      };

      const res = await fetch("/api/builder/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: updatedPage })
      });

      if (res.ok) {
        showToast("✓ Էջի կարգավորումները պահպանվեցին");
        setEditingSlug(null);
        await fetchPages();
        onPagesUpdated?.();
      } else {
        showToast("⚠️ Սխալ պահպանելիս");
      }
    } catch {
      showToast("⚠️ Կապի խնդիր");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePage = async (slug: string) => {
    if (slug === "index") {
      alert("Գլխավոր էջը (Home) հնարավոր չէ ջնջել:");
      return;
    }
    if (!confirm(`Իսկապե՞ս ցանկանում եք ջնջել «${slug}» էջը:`)) return;

    try {
      const res = await fetch(`/api/builder/pages?action=delete&slug=${encodeURIComponent(slug)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        showToast("✓ Էջը ջնջվեց");
        if (activeSlug === slug) {
          onSelectPage("index");
        }
        await fetchPages();
        onPagesUpdated?.();
      } else {
        showToast("⚠️ Չհաջողվեց ջնջել էջը");
      }
    } catch {
      showToast("⚠️ Կապի խնդիր");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "70px",
        left: "20px",
        width: "440px",
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "calc(100vh - 90px)",
        background: "rgba(15, 23, 42, 0.94)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(20, 184, 166, 0.35)",
        borderRadius: "20px",
        boxShadow: "0 25px 65px rgba(0, 0, 0, 0.65), 0 0 25px rgba(20, 184, 166, 0.12)",
        zIndex: 10001,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "fadeInSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 255, 255, 0.02)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.4rem" }}>📄</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#f8fafc" }}>
              Էջերի Կառավարում
            </div>
            <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
              Լողացող փեղկ • {pages.length} Էջ
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "none",
            borderRadius: "8px",
            color: "#94a3b8",
            width: "30px",
            height: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: 700,
            transition: "all 0.15s"
          }}
          title="Փակել փեղկը"
        >
          ✕
        </button>
      </div>

      {/* ── ACTION BAR ── */}
      <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(0,0,0,0.2)" }}>
        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          style={{
            width: "100%",
            background: isCreating ? "#334155" : "#14b8a6",
            color: isCreating ? "#fff" : "#042f2e",
            border: "none",
            borderRadius: "8px",
            padding: "8px",
            fontWeight: 800,
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <span>{isCreating ? "✕ Չեղարկել Ստեղծումը" : "➕ Ստեղծել Նոր Էջ"}</span>
        </button>
      </div>

      {/* ── CREATE NEW PAGE FORM ── */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          style={{
            background: "rgba(20, 184, 166, 0.05)",
            borderBottom: "1px solid rgba(20, 184, 166, 0.2)",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#14b8a6" }}>
            Նոր Էջի Տվյալներ
          </div>

          <div>
            <label style={{ fontSize: "0.74rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
              Էջի Վերնագիր (Title)
            </label>
            <input
              type="text"
              placeholder="Օրինակ՝ Ծառայություններ"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (!newSlug || newSlug === slugify(newTitle)) {
                  setNewSlug(slugify(e.target.value));
                }
              }}
              style={{ width: "100%", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.74rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
              URL Հասցե (Slug)
            </label>
            <input
              type="text"
              placeholder="services"
              value={newSlug}
              onChange={(e) => setNewSlug(slugify(e.target.value))}
              style={{ width: "100%", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.74rem", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
              Նախնական Կաղապար (Template)
            </label>
            <select
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value as any)}
              style={{ width: "100%", background: "#1e293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem", outline: "none" }}
            >
              <option value="text_features">Տեքստ + Առավելություններ</option>
              <option value="empty">Մաքուր Էջ (Առանց բլոկների)</option>
              <option value="clone_home">Գլխավորի Կրկնօրինակ</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submittingCreate}
            style={{
              background: "#14b8a6",
              color: "#042f2e",
              border: "none",
              borderRadius: "8px",
              padding: "8px",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: submittingCreate ? "wait" : "pointer",
              marginTop: "4px"
            }}
          >
            {submittingCreate ? "Ստեղծվում է..." : "Ստեղծել և Խմբագրել Էջը"}
          </button>
        </form>
      )}

      {/* ── SEARCH & CATEGORY FILTER BAR ── */}
      <div style={{ padding: "10px 18px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "8px" }}>
        <input
          type="text"
          placeholder="🔍 Որոնել էջ (օր. pasta, about, contact)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            background: "#0f172a",
            color: "#f8fafc",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "0.82rem",
            outline: "none"
          }}
        />

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "Բոլորը" },
            { id: "main", label: "Հիմնական" },
            { id: "system", label: "⚙️ Համակարգ" },
            { id: "templates", label: "📑 Կաղապար" },
            { id: "works", label: "🎨 Քեյսեր" },
            { id: "apps", label: "🚀 Apps" }
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: "1 1 calc(33.33% - 6px)",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: isTabActive ? "1px solid #14b8a6" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: isTabActive ? "rgba(20, 184, 166, 0.2)" : "rgba(255, 255, 255, 0.03)",
                  color: isTabActive ? "#14b8a6" : "#94a3b8",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                  textAlign: "center"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PAGES LIST ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
            Բեռնվում են էջերը...
          </div>
        ) : filteredPages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
            Էջեր չեն գտնվել այս ֆիլտրով
          </div>
        ) : (
          filteredPages.map((p) => {
            const isCurrent = p.slug === activeSlug;
            const isEditing = editingSlug === p.slug;
            const isSystemPage = p.slug === "404" || p.slug === "500";
            const isTemplate = p.slug.includes("template");
            const isInstance = p.slug.startsWith("blog/") || p.slug.startsWith("products/");
            const isDynamicCase = p.slug.startsWith("works/");
            const isDynamicApp = p.slug.startsWith("apps/") || p.slug === "ocr" || p.slug === "hdesign";

            const badgeLabel = isSystemPage
              ? "⚙️ System"
              : isTemplate
              ? "📑 Template"
              : isInstance
              ? "📝 Instance"
              : isDynamicCase
              ? "🎨 Քեյս"
              : isDynamicApp
              ? "🚀 App"
              : "📌 Ստատիկ";

            const badgeBg = isSystemPage
              ? "rgba(239, 68, 68, 0.2)"
              : isTemplate
              ? "rgba(168, 85, 247, 0.2)"
              : isInstance
              ? "rgba(59, 130, 246, 0.2)"
              : isDynamicCase
              ? "rgba(234, 179, 8, 0.2)"
              : isDynamicApp
              ? "rgba(56, 189, 248, 0.2)"
              : "rgba(255, 255, 255, 0.08)";

            const badgeColor = isSystemPage
              ? "#f87171"
              : isTemplate
              ? "#c084fc"
              : isInstance
              ? "#60a5fa"
              : isDynamicCase
              ? "#facc15"
              : isDynamicApp
              ? "#38bdf8"
              : "#94a3b8";

            return (
              <div
                key={p.slug}
                style={{
                  background: isCurrent ? "rgba(20, 184, 166, 0.12)" : "#1e293b",
                  border: isCurrent ? "1.5px solid #14b8a6" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.92rem", color: isCurrent ? "#14b8a6" : "#f8fafc" }}>
                        {p.title}
                      </span>
                      <span style={{
                        fontSize: "0.62rem",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        background: badgeBg,
                        color: badgeColor
                      }}>
                        {badgeLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                      /{p.slug === "index" ? "" : p.slug} • {p.blocks?.length || 0} բլոկ
                    </div>
                  </div>

                  {isCurrent && (
                    <span style={{ background: "#14b8a6", color: "#000", fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px", borderRadius: "4px" }}>
                      ԱԿՏԻՎ
                    </span>
                  )}
                </div>

                {/* Inline Editing Form */}
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "8px" }}>
                    <input
                      type="text"
                      placeholder="Էջի վերնագիր"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{ width: "100%", background: "#0f172a", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "6px 10px", borderRadius: "6px", fontSize: "0.82rem", outline: "none" }}
                    />
                    <textarea
                      rows={2}
                      placeholder="SEO Նկարագրություն"
                      value={editMetaDesc}
                      onChange={(e) => setEditMetaDesc(e.target.value)}
                      style={{ width: "100%", background: "#0f172a", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", padding: "6px 10px", borderRadius: "6px", fontSize: "0.82rem", outline: "none", resize: "vertical" }}
                    />
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#cbd5e1", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={editPublished}
                        onChange={(e) => setEditPublished(e.target.checked)}
                      />
                      Հրապարակված է
                    </label>

                    <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(p)}
                        disabled={savingEdit}
                        style={{ flex: 1, background: "#14b8a6", color: "#042f2e", border: "none", borderRadius: "6px", padding: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        {savingEdit ? "Պահպանվում է..." : "💾 Պահպանել"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSlug(null)}
                        style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.78rem", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPage(p.slug);
                          onClose();
                        }}
                        style={{
                          flex: 1,
                          background: "#14b8a6",
                          color: "#042f2e",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        ✏️ Խմբագրել Կտավում
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(p)}
                      title="Կարգավորել էջը"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "#94a3b8",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "0.82rem",
                        cursor: "pointer"
                      }}
                    >
                      ⚙️
                    </button>
                    {p.slug !== "index" && (
                      <button
                        type="button"
                        onClick={() => handleDeletePage(p.slug)}
                        title="Ջնջել էջը"
                        style={{
                          background: "rgba(239, 68, 68, 0.12)",
                          color: "#ef4444",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "0.82rem",
                          cursor: "pointer"
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0, 0, 0, 0.25)"
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
          Ընդհանուր՝ {pages.length} էջ
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Փակել
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#14b8a6",
            color: "#042f2e",
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.82rem",
            boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
            zIndex: 10
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
