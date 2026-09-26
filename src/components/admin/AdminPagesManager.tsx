"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageSchema, BlockItem } from '@/lib/themeTypes';

interface AdminPagesManagerProps {
  onOpenBuilder: (pageSlug: string) => void;
}

export default function AdminPagesManager({ onOpenBuilder }: AdminPagesManagerProps) {
  const [pages, setPages] = useState<PageSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Page Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newMetaDesc, setNewMetaDesc] = useState('');
  const [newTemplate, setNewTemplate] = useState<'empty' | 'text_features' | 'clone_home'>('text_features');
  const [creating, setCreating] = useState(false);

  // Edit Page Settings Modal State
  const [editingPage, setEditingPage] = useState<PageSchema | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [editPublished, setEditPublished] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/builder/pages?action=list');
      const data = await res.json();
      if (data.success && Array.isArray(data.pages)) {
        setPages(data.pages);
      } else {
        setError(data.error || 'Էջերը բեռնել չհաջողվեց');
      }
    } catch (err: any) {
      setError(err.message || 'Կապի խնդիր');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    if (!newSlug || newSlug === slugify(newTitle)) {
      setNewSlug(slugify(val));
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) {
      alert('Խնդրում ենք լրացնել էջի անվանումը և URL հասցեն (slug):');
      return;
    }

    const cleanSlug = slugify(newSlug);
    if (pages.some(p => p.slug === cleanSlug)) {
      alert('Այս հասցեով (slug) էջ արդեն գոյություն ունի: Ընտրեք այլ հասցե:');
      return;
    }

    setCreating(true);

    let initialBlocks: BlockItem[] = [];
    if (newTemplate === 'text_features') {
      initialBlocks = [
        {
          id: `block-text-${Date.now()}`,
          type: 'text',
          hidden: false,
          settings: {
            title: newTitle,
            content: 'Այստեղ կարող եք ավելացնել էջի հիմնական նկարագրությունը կամ ցանկացած տեքստային տեղեկատվություն:'
          }
        },
        {
          id: `block-features-${Date.now() + 1}`,
          type: 'features',
          hidden: false,
          settings: {
            title: 'Հիմնական Ուղղություններ',
            subtitle: 'Ծառայություններ և հնարավորություններ',
            items: [
              { icon: 'icon-Pattern', title: 'Ծառայություն 1', desc: 'Մանրամասն նկարագրություն:' },
              { icon: 'icon-Monitor', title: 'Ծառայություն 2', desc: 'Մանրամասն նկարագրություն:' }
            ]
          }
        }
      ];
    } else if (newTemplate === 'clone_home') {
      const homePage = pages.find(p => p.slug === 'index');
      if (homePage?.blocks) {
        initialBlocks = JSON.parse(JSON.stringify(homePage.blocks)).map((b: BlockItem) => ({
          ...b,
          id: `block-${b.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        }));
      }
    }

    const payload: Partial<PageSchema> & { slug: string } = {
      slug: cleanSlug,
      title: newTitle.trim(),
      theme_id: 'default',
      is_published: true,
      meta: {
        meta_description: newMetaDesc.trim()
      },
      blocks: initialBlocks
    };

    try {
      const res = await fetch('/api/builder/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: payload })
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewSlug('');
        setNewMetaDesc('');
        await fetchPages();
        // Offer to open immediately in builder
        if (confirm(`«${payload.title}» էջը հաջողությամբ ստեղծվեց: Բացե՞լ այն Visual Builder-ում:`)) {
          onOpenBuilder(cleanSlug);
        }
      } else {
        alert(data.error || 'Սխալ էջը ստեղծելիս');
      }
    } catch (err: any) {
      alert(err.message || 'Կապի խնդիր');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (page: PageSchema) => {
    setEditingPage(page);
    setEditTitle(page.title);
    setEditSlug(page.slug);
    setEditMetaDesc(page.meta?.meta_description || '');
    setEditPublished(page.is_published ?? true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage) return;

    setSavingEdit(true);
    const cleanSlug = editingPage.slug === 'index' ? 'index' : slugify(editSlug);

    const payload: Partial<PageSchema> & { slug: string } = {
      ...editingPage,
      slug: cleanSlug,
      title: editTitle.trim(),
      is_published: editPublished,
      meta: {
        ...(editingPage.meta || {}),
        meta_description: editMetaDesc.trim()
      }
    };

    try {
      const res = await fetch('/api/builder/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: payload })
      });
      const data = await res.json();
      if (data.success) {
        setEditingPage(null);
        await fetchPages();
      } else {
        alert(data.error || 'Սխալ պահպանելիս');
      }
    } catch (err: any) {
      alert(err.message || 'Կապի խնդիր');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePage = async (slug: string, title: string) => {
    if (slug === 'index') {
      alert('Գլխավոր էջը (index) չի կարող ջնջվել:');
      return;
    }
    if (!confirm(`Վստա՞հ եք, որ ցանկանում եք ընդմիշտ ջնջել «${title}» (${slug}) էջը:`)) {
      return;
    }

    try {
      const res = await fetch(`/api/builder/pages?slug=${slug}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchPages();
      } else {
        alert(data.error || 'Ջնջել չհաջողվեց');
      }
    } catch (err: any) {
      alert(err.message || 'Կապի խնդիր');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--panel, #ffffff)',
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        border: '1px solid var(--panel-border, #e2e8f0)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text, #0f172a)' }}>
            📄 Դինամիկ Էջերի Կառավարում (Pages)
          </h2>
          <p style={{ color: 'var(--muted, #64748b)', margin: '0.35rem 0 0 0', fontSize: '0.92rem' }}>
            Ստեղծեք, խմբագրեք և կարգավորեք կայքի բոլոր էջերը: Կառուցեք դրանք Visual Builder-ով:
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            background: 'var(--primary-color, #083f39)',
            color: '#ffffff',
            border: 'none',
            padding: '0.75rem 1.6rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(8, 63, 57, 0.25)'
          }}
        >
          <span>+</span> Ստեղծել Նոր Էջ
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div style={{ padding: '1rem 1.5rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px' }}>
          {error}
        </div>
      )}

      {/* Pages Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--muted)' }}>
          Բեռնվում են դինամիկ էջերը...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}>
          {pages.map((p) => {
            const isHome = p.slug === 'index';
            const pageUrl = isHome ? '/' : `/${p.slug}`;
            const blockCount = (p.blocks || []).length;
            const isPublished = p.is_published ?? true;

            return (
              <div
                key={p.id || p.slug}
                style={{
                  background: 'var(--panel, #ffffff)',
                  border: '1px solid var(--panel-border, #e2e8f0)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                        {p.title}
                      </h3>
                      {isHome && (
                        <span style={{
                          background: 'rgba(8, 63, 57, 0.1)',
                          color: 'var(--primary-color, #083f39)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px'
                        }}>
                          ԳԼԽԱՎՈՐ
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                      {pageUrl}
                    </span>
                  </div>

                  <span style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: isPublished ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                    color: isPublished ? '#15803d' : '#64748b'
                  }}>
                    {isPublished ? '● Հրապարակված' : '○ Սևագիր'}
                  </span>
                </div>

                {/* Page Stats */}
                <div style={{
                  background: 'var(--input-bg, #f8fafc)',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  color: 'var(--text)'
                }}>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Բլոկներ՝ </span>
                    <strong>{blockCount} բլոկ</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Թեմա՝ </span>
                    <strong>{p.theme_id || 'default'}</strong>
                  </div>
                </div>

                {p.meta?.meta_description && (
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--muted)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {p.meta.meta_description}
                  </p>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Primary: Dedicated /builder page */}
                  <Link
                    href={`/builder?slug=${encodeURIComponent(p.slug)}`}
                    style={{ flex: '1 1 auto', textDecoration: 'none' }}
                  >
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        background: 'var(--primary-color, #083f39)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 6px rgba(8, 63, 57, 0.2)'
                      }}
                    >
                      <span>⚡</span> Visual Builder (Էջով)
                    </button>
                  </Link>

                  {/* Secondary: Embedded in Admin */}
                  <button
                    type="button"
                    onClick={() => onOpenBuilder(p.slug)}
                    title="Բացել ներկառուցված կառուցիչը վարիչի ներսում"
                    style={{
                      background: 'rgba(20, 184, 166, 0.1)',
                      color: 'var(--primary-color, #083f39)',
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>📐</span> Վարիչում
                  </button>

                  {/* Settings */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    style={{
                      background: 'var(--input-bg, #f1f5f9)',
                      color: 'var(--text, #0f172a)',
                      border: '1px solid var(--panel-border, #cbd5e1)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                    title="Էջի կարգավորումներ"
                  >
                    ⚙️
                  </button>

                  {/* View live */}
                  <a
                    href={pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'var(--input-bg, #f1f5f9)',
                      color: 'var(--text, #0f172a)',
                      border: '1px solid var(--panel-border, #cbd5e1)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Դիտել կայքում"
                  >
                    👁️
                  </a>

                  {/* Delete (only for non-home pages) */}
                  {!isHome && (
                    <button
                      type="button"
                      onClick={() => handleDeletePage(p.slug, p.title)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                      title="Ջնջել էջը"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE NEW PAGE */}
      {/* ────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--panel, #ffffff)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '540px',
            padding: '2rem',
            border: '1px solid var(--panel-border, #cbd5e1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                ➕ Ստեղծել Նոր Դինամիկ Էջ
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePage} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Էջի Վերնագիր *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Օրինակ՝ Ծառայություններ"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  URL Հասցե (Slug) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>https://hakobian.am/</span>
                  <input
                    type="text"
                    required
                    placeholder="services"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border, #cbd5e1)',
                      background: 'var(--input-bg, #f8fafc)',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Սկզբնական Բլոկների Կաղապար
                </label>
                <select
                  value={newTemplate}
                  onChange={(e: any) => setNewTemplate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="text_features">Տեքստ և Ուղղություններ (Text & Features)</option>
                  <option value="empty">Դատարկ Էջ (Ավելացնել բլոկներ ինքնուրույն)</option>
                  <option value="clone_home">Գլխավոր էջի բոլոր բլոկների պատճեն (Clone Home)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  SEO Նկարագրություն (Meta Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="Էջի կարճ նկարագրություն որոնողական համակարգերի (Google) համար..."
                  value={newMetaDesc}
                  onChange={(e) => setNewMetaDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    padding: '0.7rem 1.4rem',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '0.7rem 1.8rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary-color, #083f39)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {creating ? 'Ստեղծվում է...' : 'Ստեղծել Էջը'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: EDIT PAGE SETTINGS */}
      {/* ────────────────────────────────────────────────────────── */}
      {editingPage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--panel, #ffffff)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '540px',
            padding: '2rem',
            border: '1px solid var(--panel-border, #cbd5e1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                ⚙️ Էջի Կարգավորումներ՝ {editingPage.title}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPage(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Էջի Վերնագիր *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  URL Հասցե (Slug)
                </label>
                <input
                  type="text"
                  disabled={editingPage.slug === 'index'}
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border, #cbd5e1)',
                    background: editingPage.slug === 'index' ? 'rgba(0,0,0,0.05)' : 'var(--input-bg, #f8fafc)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
                {editingPage.slug === 'index' && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Գլխավոր էջի slug-ը անփոփոխ է:</span>
                )}
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editPublished}
                    onChange={(e) => setEditPublished(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color, #083f39)' }}
                  />
                  <span>Էջը հրապարակված է կայքում (Published)</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  SEO Նկարագրություն
                </label>
                <textarea
                  rows={3}
                  value={editMetaDesc}
                  onChange={(e) => setEditMetaDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingPage(null)}
                  style={{
                    padding: '0.7rem 1.4rem',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: '0.7rem 1.8rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary-color, #083f39)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {savingEdit ? 'Պահպանվում է...' : 'Պահպանել'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
