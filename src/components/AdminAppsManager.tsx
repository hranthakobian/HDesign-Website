"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import MarkdownRenderer from "./MarkdownRenderer";
import { HDesignStars } from "./RatingSystem";

type AppItem = {
  id: string;
  title_am: string;
  title_en: string;
  short_desc_am?: string;
  short_desc_en?: string;
  description_md_am?: string;
  description_md_en?: string;
  host_app: string;
  host_app_icon?: string;
  app_type: 'plugin' | 'standalone';
  is_paid: boolean;
  price: number;
  currency?: string;
  download_url?: string;
  store_url?: string;
  cover_image?: string;
  gallery_images: string[];
  version: string;
  release_date: string;
  downloads_count?: number;
  created_at?: string;
  updated_at?: string;
};

type AppReview = {
  id: string;
  app_id: string;
  user_name: string;
  user_email?: string;
  is_anonymous: boolean;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

const SOFTWARE_PRESETS = [
  { name: 'Adobe Illustrator', icon: '/icons/illustrator.svg' },
  { name: 'Adobe Photoshop', icon: '/icons/photoshop.svg' },
  { name: 'Figma', icon: '/icons/figma.svg' },
  { name: 'Unity', icon: '/icons/unity.svg' },
  { name: 'After Effects', icon: '/icons/after-effects.svg' },
  { name: 'Blender', icon: '/icons/blender.svg' },
  { name: 'Adobe InDesign', icon: '/icons/indesign.svg' },
  { name: 'Adobe Premiere Pro', icon: '/icons/premiere.svg' },
  { name: 'Unreal Engine', icon: '/icons/unreal.svg' }
];

export default function AdminAppsManager({ token }: { token: string | null }) {
  const [activeSubTab, setActiveSubTab] = useState<'apps' | 'reviews'>('apps');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal / Drawer state for Create / Edit App
  const [isEditing, setIsEditing] = useState(false);
  const [customSoftwareInput, setCustomSoftwareInput] = useState("");
  const [editingApp, setEditingApp] = useState<AppItem>({
    id: "",
    title_am: "",
    title_en: "",
    short_desc_am: "",
    short_desc_en: "",
    description_md_am: "",
    description_md_en: "",
    host_app: "Adobe Illustrator",
    host_app_icon: "/icons/illustrator.svg",
    app_type: "plugin",
    is_paid: false,
    price: 0,
    currency: "AMD",
    download_url: "",
    store_url: "",
    cover_image: "",
    gallery_images: [],
    version: "v1.0.0",
    release_date: new Date().toISOString().split("T")[0],
    updated_at: new Date().toISOString().split("T")[0],
    downloads_count: 0
  });

  const [savingApp, setSavingApp] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [mdPreviewTab, setMdPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [reviewsFilter, setReviewsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isEditing]);

  const mdFileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const downloadFileInputRef = useRef<HTMLInputElement>(null);
  const hostIconInputRef = useRef<HTMLInputElement>(null);

  // Load apps & reviews
  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, revRes] = await Promise.all([
        fetch("/api/apps"),
        fetch("/api/apps/reviews?all=true", {
          headers: { Authorization: token || "" }
        })
      ]);

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApps(appsData || []);
      }

      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData || []);
      }
    } catch (e) {
      console.error("Failed to load apps/reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Open Edit or New
  const handleOpenNew = () => {
    const newId = "app-" + Math.random().toString(36).substring(2, 8);
    const today = new Date().toISOString().split("T")[0];
    setEditingApp({
      id: newId,
      title_am: "",
      title_en: "",
      short_desc_am: "",
      short_desc_en: "",
      description_md_am: "",
      description_md_en: "",
      host_app: "Adobe Illustrator",
      host_app_icon: "/icons/illustrator.svg",
      app_type: "plugin",
      is_paid: false,
      price: 0,
      currency: "AMD",
      download_url: "",
      store_url: "",
      cover_image: "",
      gallery_images: [],
      version: "v1.0.0",
      release_date: today,
      updated_at: today,
      downloads_count: 0
    });
    setMdPreviewTab("edit");
    setIsEditing(true);
  };

  const handleOpenEdit = (app: AppItem) => {
    const today = new Date().toISOString().split("T")[0];
    setEditingApp({
      id: app.id || "",
      title_am: app.title_am || "",
      title_en: app.title_en || "",
      short_desc_am: app.short_desc_am || "",
      short_desc_en: app.short_desc_en || "",
      description_md_am: app.description_md_am || "",
      description_md_en: app.description_md_en || "",
      host_app: app.host_app || "Adobe Illustrator",
      host_app_icon: app.host_app_icon || "/icons/illustrator.svg",
      app_type: app.app_type || "plugin",
      is_paid: !!app.is_paid,
      price: app.price ?? 0,
      currency: app.currency || "AMD",
      download_url: app.download_url || "",
      store_url: app.store_url || "",
      cover_image: app.cover_image || "",
      gallery_images: Array.isArray(app.gallery_images) ? app.gallery_images : [],
      version: app.version || "v1.0.0",
      release_date: app.release_date || today,
      updated_at: app.updated_at ? app.updated_at.split("T")[0] : today,
      downloads_count: app.downloads_count ?? 0
    });
    setMdPreviewTab("edit");
    setIsEditing(true);
  };

  // Software selection helpers
  const selectedSoftwareList = React.useMemo(() => {
    if (!editingApp.host_app) return [];
    return editingApp.host_app
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [editingApp.host_app]);

  const customSoftwareTags = React.useMemo(() => {
    const presetNames = new Set(SOFTWARE_PRESETS.map(p => p.name.toLowerCase()));
    return selectedSoftwareList.filter(s => !presetNames.has(s.toLowerCase()));
  }, [selectedSoftwareList]);

  const handleToggleSoftware = (name: string) => {
    let nextList: string[];
    const exists = selectedSoftwareList.some(s => s.toLowerCase() === name.toLowerCase());
    if (exists) {
      nextList = selectedSoftwareList.filter(s => s.toLowerCase() !== name.toLowerCase());
    } else {
      nextList = [...selectedSoftwareList, name];
    }
    const matchedPreset = SOFTWARE_PRESETS.find(p => nextList.some(item => item.toLowerCase() === p.name.toLowerCase()));
    setEditingApp(p => ({
      ...p,
      host_app: nextList.join(', '),
      host_app_icon: matchedPreset ? matchedPreset.icon : p.host_app_icon
    }));
  };

  const handleAddCustomSoftware = () => {
    const val = customSoftwareInput.trim();
    if (!val) return;
    const exists = selectedSoftwareList.some(s => s.toLowerCase() === val.toLowerCase());
    if (!exists) {
      const nextList = [...selectedSoftwareList, val];
      setEditingApp(p => ({
        ...p,
        host_app: nextList.join(', ')
      }));
    }
    setCustomSoftwareInput("");
  };

  const handleRemoveSoftware = (name: string) => {
    const nextList = selectedSoftwareList.filter(s => s.toLowerCase() !== name.toLowerCase());
    setEditingApp(p => ({
      ...p,
      host_app: nextList.join(', ')
    }));
  };

  // Upload file helper
  const uploadFile = async (file: File, folder = "apps") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: token || "" },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  // Handle .md file import
  const handleMdFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setEditingApp(prev => ({
          ...prev,
          description_md_am: content,
          description_md_en: prev.description_md_en || content
        }));
        alert(".md ֆայլը հաջողությամբ ներմուծվեց:");
      }
    };
    reader.readAsText(file);
  };

  // Handle screenshots multiple upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i], "apps");
        uploadedUrls.push(url);
      }

      setEditingApp(prev => {
        const updated = [...prev.gallery_images, ...uploadedUrls];
        return {
          ...prev,
          gallery_images: updated,
          cover_image: prev.cover_image || updated[0] || ""
        };
      });
    } catch (err: any) {
      alert("Սքրինշոթների բեռնումը ձախողվեց: " + err.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  // Handle installer / zip download file upload
  const handleDownloadFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const url = await uploadFile(file, "apps");
      setEditingApp(prev => ({ ...prev, download_url: url }));
      alert("Ներբեռնման նիշքը հաջողությամբ բեռնվեց:");
    } catch (err: any) {
      alert("Նիշքի բեռնումը ձախողվեց: " + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle Host App Icon upload
  const handleHostIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "apps");
      setEditingApp(prev => ({ ...prev, host_app_icon: url }));
    } catch (err: any) {
      alert("Icon upload failed: " + err.message);
    }
  };

  // Save App
  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp.title_am || !editingApp.title_en) {
      alert("Խնդրում ենք լրացնել հավելվածի անվանումը (Հայերեն և Անգլերեն):");
      return;
    }

    setSavingApp(true);
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || ""
        },
        body: JSON.stringify(editingApp)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save app");

      alert("Հավելվածը հաջողությամբ պահպանվեց:");
      setIsEditing(false);
      loadData();
    } catch (err: any) {
      alert("Սխալ պահպանելիս: " + err.message);
    } finally {
      setSavingApp(false);
    }
  };

  // Delete App
  const handleDeleteApp = async (id: string) => {
    if (!confirm("Վստա՞հ եք, որ ցանկանում եք ջնջել այս հավելվածը:")) return;

    try {
      const res = await fetch(`/api/apps?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: token || "" }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      setApps(prev => prev.filter(a => a.id !== id));
      alert("Հավելվածը հաջողությամբ ջնջվեց:");
    } catch (err: any) {
      alert("Սխալ ջնջելիս: " + err.message);
    }
  };

  // Review Status update
  const handleUpdateReviewStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const res = await fetch("/api/apps/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || ""
        },
        body: JSON.stringify({ id, status })
      });

      if (!res.ok) throw new Error("Failed to update status");

      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err: any) {
      alert("Սխալ մեկնաբանությունը թարմացնելիս: " + err.message);
    }
  };

  // Delete Review
  const handleDeleteReview = async (id: string) => {
    if (!confirm("Վստա՞հ եք, որ ցանկանում եք ջնջել այս մեկնաբանությունը:")) return;

    try {
      const res = await fetch(`/api/apps/reviews?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: token || "" }
      });

      if (!res.ok) throw new Error("Failed to delete review");

      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert("Սխալ ջնջելիս: " + err.message);
    }
  };

  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;

  const filteredApps = apps.filter(a =>
    a.title_am.toLowerCase().includes(search.toLowerCase()) ||
    a.title_en.toLowerCase().includes(search.toLowerCase()) ||
    a.host_app.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReviews = reviews.filter(r => {
    if (reviewsFilter === 'all') return true;
    return r.status === reviewsFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      {/* Top Header & Sub-tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--panel)',
          padding: '24px 30px',
          borderRadius: '20px',
          border: '1px solid var(--panel-border)',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text)' }}>
            Հավելվածներ և Խրվակներ (Apps Management)
          </h2>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
            Հավելվածների, նկարագրությունների, ֆայլերի և մեկնաբանությունների կառավարում
          </p>
        </div>

        {/* Subtabs & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '12px', width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => setActiveSubTab('apps')}
              style={{
                background: activeSubTab === 'apps' ? 'var(--switcher-capsule-bg, rgba(255,255,255,0.15))' : 'transparent',
                color: activeSubTab === 'apps' ? '#ffffff' : 'var(--muted)',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.86rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              Հավելվածներ ({apps.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('reviews')}
              style={{
                background: activeSubTab === 'reviews' ? 'var(--switcher-capsule-bg, rgba(255,255,255,0.15))' : 'transparent',
                color: activeSubTab === 'reviews' ? '#ffffff' : 'var(--muted)',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.86rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Մեկնաբանություններ</span>
              {pendingReviewsCount > 0 && (
                <span
                  style={{
                    background: '#e53935',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.72rem'
                  }}
                >
                  {pendingReviewsCount}
                </span>
              )}
            </button>
          </div>

          <hd-button
            suppressHydrationWarning
            data-height="38px"
            data-thickness="3px"
            data-font-size="0.84rem"
            data-color="var(--accent)"
            data-text-color="#ffffff"
            onClick={handleOpenNew}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ավելացնել Հավելված
            </span>
          </hd-button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SUBTAB 1: APPS LIST & TABLE
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'apps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search bar */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <hd-input
              suppressHydrationWarning
              placeholder="Որոնել հավելվածներ..."
              value={search}
              onInput={(e: any) => setSearch(e.target.value)}
              data-width="100%"
              data-height="42px"
              data-thickness="2px"
              data-font-size="13pt"
            />
          </div>

          {/* Apps Table Card */}
          <div
            style={{
              background: 'var(--panel)',
              borderRadius: '20px',
              border: '1px solid var(--panel-border)',
              overflowX: 'auto',
              boxShadow: 'var(--shadow)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--panel-border)', color: 'var(--muted)' }}>
                  <th style={{ padding: '14px 18px' }}>Հավելված</th>
                  <th style={{ padding: '14px 18px' }}>Ծրագիր</th>
                  <th style={{ padding: '14px 18px' }}>Տիպ</th>
                  <th style={{ padding: '14px 18px' }}>Գին</th>
                  <th style={{ padding: '14px 18px' }}>Վերսիա</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Գործողություններ</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                      Հավելվածներ չեն գտնվել:
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: '1px solid var(--panel-border)',
                        transition: 'background 0.2s'
                      }}
                    >
                      {/* App Title & Thumbnail */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={app.cover_image || (app.gallery_images && app.gallery_images[0]) || "/logo.png"}
                            alt={app.title_am}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              objectFit: 'cover',
                              background: '#111'
                            }}
                          />
                          <div>
                            <span style={{ fontWeight: 800, color: 'var(--text)', display: 'block', fontSize: '0.92rem' }}>
                              {app.title_am}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                              {app.title_en}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Software */}
                      <td style={{ padding: '12px 18px' }}>
                        {app.app_type === 'plugin' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {(app.host_app || '').split(',').map(s => s.trim()).filter(Boolean).map((h, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  background: 'var(--bg)',
                                  border: '1px solid var(--panel-border)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: 'var(--text)'
                                }}
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      {/* Type */}
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: app.app_type === 'standalone' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(156, 39, 176, 0.15)',
                            color: app.app_type === 'standalone' ? '#2196f3' : '#ab47bc'
                          }}
                        >
                          {app.app_type === 'standalone' ? 'Standalone' : 'Plugin'}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: app.is_paid ? '#e53935' : '#43a047'
                          }}
                        >
                          {app.is_paid ? `${(app.price || 0).toLocaleString()} AMD` : 'Անվճար'}
                        </span>
                      </td>

                      {/* Version */}
                      <td style={{ padding: '12px 18px', color: 'var(--muted)', fontSize: '0.82rem' }}>
                        {app.version}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                          <a
                            href={`/apps/${app.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <hd-button
                              suppressHydrationWarning
                              data-height="28px"
                              data-thickness="2px"
                              data-font-size="0.75rem"
                              data-color="transparent"
                              data-text-color="var(--text)"
                            >
                              <span style={{ padding: '0 8px' }}>Դիտել</span>
                            </hd-button>
                          </a>
                          <hd-button
                            suppressHydrationWarning
                            data-height="28px"
                            data-thickness="2px"
                            data-font-size="0.75rem"
                            data-color="var(--accent)"
                            data-text-color="#ffffff"
                            onClick={() => handleOpenEdit(app)}
                          >
                            <span style={{ padding: '0 8px' }}>Խմբագրել</span>
                          </hd-button>
                          <hd-button
                            suppressHydrationWarning
                            data-height="28px"
                            data-thickness="2px"
                            data-font-size="0.75rem"
                            data-color="rgba(229, 57, 53, 0.15)"
                            data-text-color="#e53935"
                            onClick={() => handleDeleteApp(app.id)}
                          >
                            <span style={{ padding: '0 8px' }}>Ջնջել</span>
                          </hd-button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUBTAB 2: REVIEWS MODERATION
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '12px', width: 'fit-content', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `Բոլորը (${reviews.length})` },
              { id: 'pending', label: `Սպասող (${pendingReviewsCount})` },
              { id: 'approved', label: `Հաստատված (${reviews.filter(r => r.status === 'approved').length})` },
              { id: 'rejected', label: `Մերժված (${reviews.filter(r => r.status === 'rejected').length})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReviewsFilter(tab.id as any)}
                style={{
                  background: reviewsFilter === tab.id ? 'var(--switcher-capsule-bg, rgba(255,255,255,0.15))' : 'transparent',
                  color: reviewsFilter === tab.id ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredReviews.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', background: 'var(--panel)', borderRadius: '20px', border: '1px solid var(--panel-border)', color: 'var(--muted)' }}>
                Մեկնաբանություններ չկան:
              </div>
            ) : (
              filteredReviews.map((rev) => {
                const targetApp = apps.find(a => a.id === rev.app_id);
                return (
                  <div
                    key={rev.id}
                    style={{
                      background: 'var(--panel)',
                      borderRadius: '18px',
                      border: '1px solid var(--panel-border)',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '20px',
                      boxShadow: 'var(--shadow)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
                          {rev.user_name}
                        </span>
                        {rev.is_anonymous && (
                          <span style={{ fontSize: '0.72rem', background: 'var(--bg)', padding: '2px 8px', borderRadius: '10px', color: 'var(--muted)' }}>
                            Անանուն
                          </span>
                        )}
                        {rev.user_email && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            &lt;{rev.user_email}&gt;
                          </span>
                        )}

                        {/* App badge */}
                        <span
                          style={{
                            background: 'rgba(74, 137, 124, 0.12)',
                            color: 'var(--accent)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px'
                          }}
                        >
                          {targetApp ? targetApp.title_am : rev.app_id}
                        </span>

                        {/* Stars */}
                        <HDesignStars rating={rev.rating} size={14} gap={2} />

                        {/* Status badge */}
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: rev.status === 'approved' ? 'rgba(76, 175, 80, 0.15)' : (rev.status === 'pending' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(244, 67, 54, 0.15)'),
                            color: rev.status === 'approved' ? '#4caf50' : (rev.status === 'pending' ? '#ff9800' : '#f44336')
                          }}
                        >
                          {rev.status === 'approved' ? 'Հաստատված' : (rev.status === 'pending' ? 'Սպասում է' : 'Մերժված')}
                        </span>
                      </div>

                      {/* Comment text */}
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.92rem', color: 'var(--text)', lineHeight: '1.5' }}>
                        {rev.comment}
                      </p>

                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                        {new Date(rev.created_at).toLocaleString('hy-AM')}
                      </span>
                    </div>

                    {/* Moderation Actions */}
                    <div style={{ display: 'inline-flex', gap: '6px', flexShrink: 0, flexWrap: 'nowrap', alignItems: 'center' }}>
                      {rev.status !== 'approved' && (
                        <hd-button
                          suppressHydrationWarning
                          data-height="28px"
                          data-thickness="2px"
                          data-font-size="0.75rem"
                          data-color="#2e7d32"
                          data-text-color="#ffffff"
                          onClick={() => handleUpdateReviewStatus(rev.id, 'approved')}
                        >
                          <span style={{ padding: '0 8px' }}>Հաստատել</span>
                        </hd-button>
                      )}

                      {rev.status !== 'rejected' && (
                        <hd-button
                          suppressHydrationWarning
                          data-height="28px"
                          data-thickness="2px"
                          data-font-size="0.75rem"
                          data-color="rgba(255, 152, 0, 0.15)"
                          data-text-color="#ff9800"
                          onClick={() => handleUpdateReviewStatus(rev.id, 'rejected')}
                        >
                          <span style={{ padding: '0 8px' }}>Մերժել</span>
                        </hd-button>
                      )}

                      <hd-button
                        suppressHydrationWarning
                        data-height="28px"
                        data-thickness="2px"
                        data-font-size="0.75rem"
                        data-color="rgba(229, 57, 53, 0.15)"
                        data-text-color="#e53935"
                        onClick={() => handleDeleteReview(rev.id)}
                      >
                        <span style={{ padding: '0 8px' }}>Ջնջել</span>
                      </hd-button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════════════
          CREATE / EDIT APP MODAL DRAWER
          ══════════════════════════════════════════════════════════════════════ */}
      {isEditing && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isFullscreen ? '0' : '20px',
            boxSizing: 'border-box'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditing(false);
            }
          }}
        >
          <div
            style={{
              background: 'var(--panel)',
              borderRadius: isFullscreen ? '0' : '20px',
              border: isFullscreen ? 'none' : '1px solid var(--panel-border)',
              width: isFullscreen ? '100vw' : 'min(1360px, 96vw)',
              height: isFullscreen ? '100vh' : '92vh',
              maxHeight: isFullscreen ? '100vh' : '92vh',
              boxShadow: '0 24px 70px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 28px',
                borderBottom: '1px solid var(--panel-border)',
                background: 'var(--panel)',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
                  {editingApp.id ? 'Խմբագրել Հավելվածը' : 'Ավելացնել Նոր Հավելված'}
                </h2>
                {editingApp.id && (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--muted)',
                      border: '1px solid var(--panel-border)'
                    }}
                  >
                    {editingApp.id}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(p => !p)}
                  title={isFullscreen ? "Կրճատել չափսը" : "Ամբողջ էկրանով"}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="hd-icon icon-Expand" style={{ fontSize: '14px' }} />
                  <span>{isFullscreen ? "Պատուհան" : "Ամբողջ էկրան"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.6rem',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: '4px 8px'
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveApp} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Title AM & Title EN */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Անվանում (Հայերեն) *
                  </label>
                  <hd-input
                    suppressHydrationWarning
                    placeholder="Օրինակ՝ SVG Exporter Pro"
                    value={editingApp.title_am || ""}
                    onInput={(e: any) => setEditingApp(p => ({ ...p, title_am: e.target.value }))}
                    data-width="100%"
                    data-height="40px"
                    data-thickness="2px"
                    data-font-size="13pt"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Title (English) *
                  </label>
                  <hd-input
                    suppressHydrationWarning
                    placeholder="e.g. SVG Exporter Pro"
                    value={editingApp.title_en || ""}
                    onInput={(e: any) => setEditingApp(p => ({ ...p, title_en: e.target.value }))}
                    data-width="100%"
                    data-height="40px"
                    data-thickness="2px"
                    data-font-size="13pt"
                  />
                </div>
              </div>

              {/* Short Descriptions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Կարճ Նկարագրություն (Հայերեն)
                  </label>
                  <hd-textarea
                    suppressHydrationWarning
                    placeholder="Կարճ նկարագրություն հավելվածի մասին..."
                    value={editingApp.short_desc_am || ""}
                    onInput={(e: any) => setEditingApp(p => ({ ...p, short_desc_am: e.target.value }))}
                    data-width="100%"
                    data-height="70px"
                    data-thickness="2px"
                    data-font-size="12pt"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Short Description (English)
                  </label>
                  <hd-textarea
                    suppressHydrationWarning
                    placeholder="Short summary of the app..."
                    value={editingApp.short_desc_en || ""}
                    onInput={(e: any) => setEditingApp(p => ({ ...p, short_desc_en: e.target.value }))}
                    data-width="100%"
                    data-height="70px"
                    data-thickness="2px"
                    data-font-size="12pt"
                  />
                </div>
              </div>

              {/* ID & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Հավելվածի ID (URL Slug) *
                  </label>
                  <hd-input
                    suppressHydrationWarning
                    placeholder="svg-exporter-pro"
                    value={editingApp.id || ""}
                    onInput={(e: any) => setEditingApp(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') }))}
                    data-width="100%"
                    data-height="40px"
                    data-thickness="2px"
                    data-font-size="13pt"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Կարգավիճակ / Տիպ *
                  </label>
                  <hd-segment
                    suppressHydrationWarning
                    value={editingApp.app_type}
                    onChange={(e: any) => {
                      const val = e.target.value as 'plugin' | 'standalone';
                      setEditingApp(p => ({
                        ...p,
                        app_type: val,
                        host_app: val === 'plugin' ? (p.host_app || 'Adobe Illustrator') : ''
                      }));
                    }}
                    data-width="100%"
                    data-height="40px"
                    data-thickness="2px"
                    data-font-size="0.84rem"
                  >
                    <span value="plugin" {...(editingApp.app_type === 'plugin' ? { selected: true } : {})}>
                      Խրվակ (Plugin)
                    </span>
                    <span value="standalone" {...(editingApp.app_type === 'standalone' ? { selected: true } : {})}>
                      Առանձին Հավելված
                    </span>
                  </hd-segment>
                </div>
              </div>

              {/* Software Selection (Checkboxes) - ONLY shown if Plugin */}
              {editingApp.app_type === 'plugin' && (
                <div
                  style={{
                    background: 'var(--bg)',
                    padding: '18px 20px',
                    borderRadius: '16px',
                    border: '1px solid var(--panel-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', display: 'block' }}>
                        Ընտրեք ծրագրերը (Software) *
                      </label>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Նշեք այն բոլոր ծրագրերը, որոնց համար նախատեսված է այս խրվակը:
                      </span>
                    </div>
                    {selectedSoftwareList.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: 'rgba(74, 137, 124, 0.15)',
                          color: 'var(--accent)'
                        }}
                      >
                        Ընտրված է {selectedSoftwareList.length} ծրագիր
                      </span>
                    )}
                  </div>

                  {/* Checkboxes Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '8px'
                    }}
                  >
                    {SOFTWARE_PRESETS.map((item) => {
                      const isSelected = selectedSoftwareList.some(s => s.toLowerCase() === item.name.toLowerCase());
                      return (
                        <div
                          key={item.name}
                          onClick={() => handleToggleSoftware(item.name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: isSelected ? 'rgba(74, 137, 124, 0.15)' : 'var(--panel)',
                            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--panel-border)'}`,
                            color: isSelected ? 'var(--accent)' : 'var(--text)',
                            fontSize: '0.82rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <hd-checkbox
                            suppressHydrationWarning
                            checked={isSelected}
                            data-thickness="3px"
                            data-size="16px"
                            onChange={() => handleToggleSoftware(item.name)}
                          />
                          <span>{item.name}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom / Other Software Name */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <div style={{ flex: 1 }}>
                      <hd-input
                        suppressHydrationWarning
                        placeholder="+ Այլ ծրագիր..."
                        value={customSoftwareInput}
                        onInput={(e: any) => setCustomSoftwareInput(e.target.value)}
                        data-width="100%"
                        data-height="36px"
                        data-thickness="2px"
                        data-font-size="12pt"
                      />
                    </div>
                    <hd-button
                      suppressHydrationWarning
                      data-height="36px"
                      data-thickness="2px"
                      data-font-size="0.8rem"
                      data-color="var(--accent)"
                      data-text-color="#ffffff"
                      onClick={handleAddCustomSoftware}
                    >
                      <span style={{ padding: '0 12px' }}>Ավելացնել</span>
                    </hd-button>
                  </div>

                  {/* Custom Software Tags */}
                  {customSoftwareTags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {customSoftwareTags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: 'rgba(74, 137, 124, 0.15)',
                            color: 'var(--accent)',
                            border: '1px solid var(--accent)',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveSoftware(tag)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '0 2px'
                            }}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pricing & Download / Store URL */}
              <div
                style={{
                  background: 'var(--bg)',
                  padding: '18px 20px',
                  borderRadius: '16px',
                  border: '1px solid var(--panel-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}
                    onClick={() => setEditingApp(p => ({ ...p, is_paid: false, price: 0 }))}
                  >
                    <hd-radio
                      suppressHydrationWarning
                      name="pricing_mode"
                      data-size="14px"
                      checked={!editingApp.is_paid}
                      onChange={() => setEditingApp(p => ({ ...p, is_paid: false, price: 0 }))}
                    />
                    <span>Անվճար (Free)</span>
                  </div>

                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}
                    onClick={() => setEditingApp(p => ({ ...p, is_paid: true }))}
                  >
                    <hd-radio
                      suppressHydrationWarning
                      name="pricing_mode"
                      data-size="14px"
                      checked={editingApp.is_paid}
                      onChange={() => setEditingApp(p => ({ ...p, is_paid: true }))}
                    />
                    <span>Վճարովի (Paid)</span>
                  </div>
                </div>

                {editingApp.is_paid ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                        Գին (AMD) *
                      </label>
                      <hd-input
                        suppressHydrationWarning
                        type="number"
                        placeholder="5000"
                        value={editingApp.price || ""}
                        onInput={(e: any) => setEditingApp(p => ({ ...p, price: Number(e.target.value) }))}
                        data-width="100%"
                        data-height="40px"
                        data-thickness="2px"
                        data-font-size="13pt"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                        Գնելու հղում (External Store URL)
                      </label>
                      <hd-input
                        suppressHydrationWarning
                        placeholder="https://gumroad.com/l/..."
                        value={editingApp.store_url || ""}
                        onInput={(e: any) => setEditingApp(p => ({ ...p, store_url: e.target.value }))}
                        data-width="100%"
                        data-height="40px"
                        data-thickness="2px"
                        data-font-size="13pt"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                      Ներբեռնման ֆայլ կամ հղում (Direct Download URL)
                    </label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <hd-input
                          suppressHydrationWarning
                          placeholder="/uploads/apps/..."
                          value={editingApp.download_url || ""}
                          onInput={(e: any) => setEditingApp(p => ({ ...p, download_url: e.target.value }))}
                          data-width="100%"
                          data-height="40px"
                          data-thickness="2px"
                          data-font-size="13pt"
                        />
                      </div>
                      <input
                        ref={downloadFileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handleDownloadFileUpload}
                      />
                      <hd-button
                        suppressHydrationWarning
                        data-height="40px"
                        data-thickness="2px"
                        data-font-size="0.8rem"
                        data-color="var(--bg)"
                        data-text-color="var(--text)"
                        onClick={() => downloadFileInputRef.current?.click()}
                        disabled={uploadingFile}
                      >
                        <span style={{ padding: '0 12px' }}>
                          {uploadingFile ? "Բեռնվում է..." : "Նիշքի Բեռնում"}
                        </span>
                      </hd-button>
                    </div>
                  </div>
                )}
              </div>

              {/* Screenshots Gallery Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                    Սքրինշոթներ և Պատկերասրահ ({editingApp.gallery_images.length})
                  </label>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleGalleryUpload}
                  />
                  <hd-button
                    suppressHydrationWarning
                    data-height="32px"
                    data-thickness="2px"
                    data-font-size="0.8rem"
                    data-color="rgba(74, 137, 124, 0.12)"
                    data-text-color="var(--accent)"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadingGallery}
                  >
                    <span style={{ padding: '0 12px' }}>
                      {uploadingGallery ? "Բեռնվում է..." : "+ Ավելացնել Նկարներ"}
                    </span>
                  </hd-button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: '12px',
                    background: 'var(--bg)',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid var(--panel-border)',
                    minHeight: '80px'
                  }}
                >
                  {editingApp.gallery_images.length === 0 ? (
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '12px' }}>
                      Սքրինշոթներ չկան:
                    </span>
                  ) : (
                    editingApp.gallery_images.map((img, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          aspectRatio: '16/10',
                          border: editingApp.cover_image === img ? '2px solid var(--accent)' : '1px solid var(--panel-border)'
                        }}
                      >
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setEditingApp(p => ({ ...p, gallery_images: p.gallery_images.filter((_, idx) => idx !== i) }))}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            lineHeight: 1
                          }}
                        >
                          &times;
                        </button>
                        {editingApp.cover_image === img && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '2px',
                              background: 'var(--accent)',
                              color: '#fff',
                              fontSize: '9px',
                              padding: '1px 4px',
                              borderRadius: '4px'
                            }}
                          >
                            Cover
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Markdown Detailed Overview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                    Ընդլայնված Նկարագրություն (Markdown .md)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      ref={mdFileInputRef}
                      type="file"
                      accept=".md,.txt"
                      style={{ display: 'none' }}
                      onChange={handleMdFileUpload}
                    />
                    <hd-button
                      suppressHydrationWarning
                      data-height="30px"
                      data-thickness="2px"
                      data-font-size="0.78rem"
                      data-color="var(--bg)"
                      data-text-color="var(--text)"
                      onClick={() => mdFileInputRef.current?.click()}
                    >
                      <span style={{ padding: '0 10px' }}>Բեռնել .md ֆայլ</span>
                    </hd-button>

                    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', padding: '3px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                      <button
                        type="button"
                        onClick={() => setMdPreviewTab('edit')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: mdPreviewTab === 'edit' ? 'var(--accent)' : 'transparent',
                          color: mdPreviewTab === 'edit' ? '#fff' : 'var(--text)',
                          border: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setMdPreviewTab('preview')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: mdPreviewTab === 'preview' ? 'var(--accent)' : 'transparent',
                          color: mdPreviewTab === 'preview' ? '#fff' : 'var(--text)',
                          border: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>

                {mdPreviewTab === 'edit' ? (
                  <hd-textarea
                    suppressHydrationWarning
                    placeholder="## Հավելվածի նկարագրություն&#10;&#10;* Կետ 1&#10;* Կետ 2"
                    value={editingApp.description_md_am || ""}
                    onInput={(e: any) => setEditingApp(p => ({
                      ...p,
                      description_md_am: e.target.value,
                      description_md_en: p.description_md_en || e.target.value
                    }))}
                    data-width="100%"
                    data-height="160px"
                    data-thickness="2px"
                    data-font-size="12pt"
                  />
                ) : (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'var(--bg)',
                      border: '1px solid var(--panel-border)',
                      minHeight: '160px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}
                  >
                    <MarkdownRenderer content={editingApp.description_md_am || "*(Դատարկ)*"} />
                  </div>
                )}
              </div>

              {/* Version & Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Վերսիայի համար (օր.՝ v1.0.2)
                  </label>
                  <hd-input
                    suppressHydrationWarning
                    placeholder="v1.0.0"
                    value={editingApp.version || ""}
                    onInput={(e: any) => setEditingApp(p => ({ ...p, version: e.target.value }))}
                    data-width="100%"
                    data-height="40px"
                    data-thickness="2px"
                    data-font-size="13pt"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Թողարկման ամսաթիվ
                  </label>
                  <hd-input
                    suppressHydrationWarning
                    type="date"
                    value={editingApp.release_date || ""}
                    onInput={(e: any) => setEditingApp(p => ({ ...p, release_date: e.target.value }))}
                    data-width="100%"
                    data-height="40px"
                    data-thickness="2px"
                    data-font-size="13pt"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Թարմացման ամսաթիվ
                  </label>
                  <hd-input
                    suppressHydrationWarning
                    type="date"
                    value={editingApp.updated_at || ""}
                    onInput={(e: any) => setEditingApp(p => ({ ...p, updated_at: e.target.value }))}
                    data-width="100%"
                    data-height="40px"
                    data-thickness="2px"
                    data-font-size="13pt"
                  />
                </div>
              </div>

              </div>

              {/* Sticky Footer Action Buttons */}
              <div
                style={{
                  padding: '16px 28px',
                  borderTop: '1px solid var(--panel-border)',
                  background: 'var(--panel)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: 0,
                  boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
                }}
              >
                <hd-button
                  suppressHydrationWarning
                  data-height="38px"
                  data-thickness="2px"
                  data-font-size="0.85rem"
                  data-color="var(--bg)"
                  data-text-color="var(--text)"
                  onClick={() => setIsEditing(false)}
                >
                  <span style={{ padding: '0 16px' }}>Չեղարկել</span>
                </hd-button>
                <hd-button
                  suppressHydrationWarning
                  data-height="38px"
                  data-thickness="3px"
                  data-font-size="0.85rem"
                  data-color="var(--accent)"
                  data-text-color="#ffffff"
                  onClick={(e: any) => {
                    handleSaveApp(e);
                  }}
                  disabled={savingApp}
                >
                  <span style={{ padding: '0 18px' }}>
                    {savingApp ? "Պահպանվում է..." : "Պահպանել Հավելվածը"}
                  </span>
                </hd-button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
