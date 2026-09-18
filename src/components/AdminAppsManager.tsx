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
  languages?: string[];
  version: string;
  release_date: string;
  downloads_count?: number;
  is_draft?: boolean;
  status?: 'published' | 'draft';
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

type AppBugReport = {
  id: string;
  app_id: string;
  app_title?: string;
  user_name: string;
  user_email: string;
  subject: string;
  description: string;
  version?: string;
  os?: string;
  media_files?: string[];
  status: 'new' | 'investigating' | 'resolved' | 'closed';
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
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

const LANGUAGE_PRESETS = [
  "Հայերեն",
  "English",
  "Русский",
  "Français",
  "Deutsch",
  "Español"
];

export default function AdminAppsManager({ token }: { token: string | null }) {
  const [activeSubTab, setActiveSubTab] = useState<'apps' | 'reviews' | 'bug_reports'>('apps');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [bugReports, setBugReports] = useState<AppBugReport[]>([]);
  const [bugReportsFilter, setBugReportsFilter] = useState<'all' | 'new' | 'investigating' | 'resolved' | 'closed'>('all');
  const [bugReportsSearch, setBugReportsSearch] = useState("");
  const [selectedBugReport, setSelectedBugReport] = useState<AppBugReport | null>(null);
  const [reportAdminNotes, setReportAdminNotes] = useState<string>('');
  const [savingReportNotes, setSavingReportNotes] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal / Drawer state for Create / Edit App
  const [isEditing, setIsEditing] = useState(false);
  const [customSoftwareInput, setCustomSoftwareInput] = useState("");
  const [customLanguageInput, setCustomLanguageInput] = useState("");
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
    languages: ["Հայերեն", "English"],
    version: "v1.0.0",
    release_date: new Date().toISOString().split("T")[0],
    updated_at: new Date().toISOString().split("T")[0],
    downloads_count: 0,
    is_draft: false,
    status: "published"
  });

  const [savingApp, setSavingApp] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [mdPreviewTab, setMdPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [reviewsFilter, setReviewsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isEditing || !!selectedBugReport || !!selectedMediaUrl) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isEditing, selectedBugReport, selectedMediaUrl]);

  const mdFileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const downloadFileInputRef = useRef<HTMLInputElement>(null);
  const hostIconInputRef = useRef<HTMLInputElement>(null);

  // Load apps, reviews & bug reports
  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, revRes, bugRes] = await Promise.all([
        fetch("/api/apps?include_drafts=true", {
          headers: { Authorization: token || "" }
        }),
        fetch("/api/apps/reviews?all=true", {
          headers: { Authorization: token || "" }
        }),
        fetch("/api/apps/bug-reports", {
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

      if (bugRes.ok) {
        const bugData = await bugRes.json();
        setBugReports(bugData || []);
      }
    } catch (e) {
      console.error("Failed to load apps/reviews/bug reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Update bug report status
  const handleUpdateBugStatus = async (id: string, newStatus: 'new' | 'investigating' | 'resolved' | 'closed') => {
    try {
      const res = await fetch("/api/apps/bug-reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || ""
        },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setBugReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        if (selectedBugReport && selectedBugReport.id === id) {
          setSelectedBugReport(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error("Failed to update bug report status:", err);
    }
  };

  // Save admin notes on bug report
  const handleSaveBugNotes = async (id: string) => {
    setSavingReportNotes(true);
    try {
      const res = await fetch("/api/apps/bug-reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || ""
        },
        body: JSON.stringify({ id, admin_notes: reportAdminNotes })
      });
      if (res.ok) {
        setBugReports(prev => prev.map(r => r.id === id ? { ...r, admin_notes: reportAdminNotes } : r));
        if (selectedBugReport && selectedBugReport.id === id) {
          setSelectedBugReport(prev => prev ? { ...prev, admin_notes: reportAdminNotes } : null);
        }
        alert("Նշումները հաջողությամբ պահպանվեցին:");
      }
    } catch (err) {
      console.error("Failed to save admin notes:", err);
    } finally {
      setSavingReportNotes(false);
    }
  };

  // Delete bug report
  const handleDeleteBugReport = async (id: string) => {
    if (!confirm("Վստա՞հ եք, որ ցանկանում եք ջնջել այս զեկույցը:")) return;
    try {
      const res = await fetch(`/api/apps/bug-reports?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: token || "" }
      });
      if (res.ok) {
        setBugReports(prev => prev.filter(r => r.id !== id));
        if (selectedBugReport && selectedBugReport.id === id) {
          setSelectedBugReport(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete bug report:", err);
    }
  };

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
      languages: ["Հայերեն", "English"],
      version: "v1.0.0",
      release_date: today,
      updated_at: today,
      downloads_count: 0,
      is_draft: false,
      status: "published"
    });
    setCustomLanguageInput("");
    setMdPreviewTab("edit");
    setIsEditing(true);
  };

  const handleOpenEdit = (app: AppItem) => {
    const today = new Date().toISOString().split("T")[0];
    const isDraft = app.status === 'draft' || !!app.is_draft;
    const languages = Array.isArray(app.languages) && app.languages.length > 0
      ? app.languages
      : (typeof app.languages === 'string'
          ? (app.languages as string).split(',').map(s => s.trim()).filter(Boolean)
          : ["Հայերեն", "English"]);

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
      languages: languages.length > 0 ? languages : ["Հայերեն", "English"],
      version: app.version || "v1.0.0",
      release_date: app.release_date || today,
      updated_at: app.updated_at ? app.updated_at.split("T")[0] : today,
      downloads_count: app.downloads_count ?? 0,
      is_draft: isDraft,
      status: isDraft ? 'draft' : 'published'
    });
    setCustomLanguageInput("");
    setMdPreviewTab("edit");
    setIsEditing(true);
  };

  // Language selection helpers
  const selectedLanguagesList = React.useMemo(() => {
    if (!editingApp.languages || !Array.isArray(editingApp.languages)) return ["Հայերեն"];
    return editingApp.languages;
  }, [editingApp.languages]);

  const handleToggleLanguage = (lang: string) => {
    setEditingApp(prev => {
      const cur = prev.languages || [];
      const exists = cur.some(l => l.toLowerCase() === lang.toLowerCase());
      const next = exists
        ? cur.filter(l => l.toLowerCase() !== lang.toLowerCase())
        : [...cur, lang];
      return { ...prev, languages: next.length > 0 ? next : [lang] };
    });
  };

  const handleAddCustomLanguage = () => {
    const val = customLanguageInput.trim();
    if (!val) return;
    setEditingApp(prev => {
      const cur = prev.languages || [];
      if (cur.some(l => l.toLowerCase() === val.toLowerCase())) return prev;
      return { ...prev, languages: [...cur, val] };
    });
    setCustomLanguageInput("");
  };

  const handleRemoveLanguage = (lang: string) => {
    setEditingApp(prev => {
      const cur = prev.languages || [];
      const next = cur.filter(l => l.toLowerCase() !== lang.toLowerCase());
      return { ...prev, languages: next };
    });
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
  const handleSaveApp = async (e?: React.FormEvent, overrideStatus?: 'published' | 'draft') => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const nextStatus = overrideStatus || editingApp.status || (editingApp.is_draft ? 'draft' : 'published');
    const isDraft = nextStatus === 'draft';

    // Only enforce mandatory fields if PUBLISHING
    if (!isDraft) {
      if (!editingApp.title_am?.trim() || !editingApp.title_en?.trim()) {
        alert("Հրապարակելու համար խնդրում ենք լրացնել հավելվածի անվանումը (Հայերեն և Անգլերեն):");
        return;
      }
      if (editingApp.app_type === 'plugin' && !editingApp.host_app?.trim()) {
        alert("Հրապարակելու համար խնդրում ենք նշել առնվազն մեկ ծրագիր (Software):");
        return;
      }
    }

    const finalId = editingApp.id?.trim() || ("app-" + Math.random().toString(36).substring(2, 8));
    const finalTitleAm = editingApp.title_am?.trim() || editingApp.title_en?.trim() || (isDraft ? "Անանուն սևագիր" : "");
    const finalTitleEn = editingApp.title_en?.trim() || editingApp.title_am?.trim() || (isDraft ? "Untitled Draft" : "");

    const appToSave: AppItem = {
      ...editingApp,
      id: finalId,
      title_am: finalTitleAm,
      title_en: finalTitleEn,
      is_draft: isDraft,
      status: nextStatus,
      languages: selectedLanguagesList
    };

    setSavingApp(true);
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || ""
        },
        body: JSON.stringify(appToSave)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save app");

      alert(isDraft ? "Հավելվածը հաջողությամբ պահպանվեց որպես սևագիր:" : "Հավելվածը հաջողությամբ պահպանվեց:");
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
  const publishedAppsCount = apps.filter(a => !a.is_draft && a.status !== 'draft').length;
  const draftAppsCount = apps.filter(a => a.is_draft || a.status === 'draft').length;
  const newBugReportsCount = bugReports.filter(r => r.status === 'new').length;

  const filteredApps = apps.filter(a => {
    const isDraft = a.status === 'draft' || !!a.is_draft;
    if (statusFilter === 'published' && isDraft) return false;
    if (statusFilter === 'draft' && !isDraft) return false;

    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      a.title_am.toLowerCase().includes(q) ||
      a.title_en.toLowerCase().includes(q) ||
      (a.host_app && a.host_app.toLowerCase().includes(q)) ||
      (Array.isArray(a.languages) && a.languages.some(l => l.toLowerCase().includes(q)))
    );
  });

  const filteredReviews = reviews.filter(r => {
    if (reviewsFilter === 'all') return true;
    return r.status === reviewsFilter;
  });

  const filteredBugReports = bugReports.filter(r => {
    if (bugReportsFilter !== 'all' && r.status !== bugReportsFilter) return false;
    const q = bugReportsSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      r.subject.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.user_name.toLowerCase().includes(q) ||
      r.user_email.toLowerCase().includes(q) ||
      (r.app_title && r.app_title.toLowerCase().includes(q)) ||
      r.app_id.toLowerCase().includes(q)
    );
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
            <button
              type="button"
              onClick={() => setActiveSubTab('bug_reports')}
              style={{
                background: activeSubTab === 'bug_reports' ? 'var(--switcher-capsule-bg, rgba(255,255,255,0.15))' : 'transparent',
                color: activeSubTab === 'bug_reports' ? '#ffffff' : 'var(--muted)',
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
              <span>Վրեպների Զեկույցներ</span>
              {newBugReportsCount > 0 && (
                <span
                  style={{
                    background: '#f59e0b',
                    color: '#000',
                    fontWeight: 800,
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.72rem'
                  }}
                >
                  {newBugReportsCount}
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
          {/* Search bar & Status filters */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <hd-input
                suppressHydrationWarning
                placeholder="Որոնել հավելվածներ, ծրագրեր կամ լեզուներ..."
                value={search}
                onInput={(e: any) => setSearch(e.target.value)}
                data-width="100%"
                data-height="42px"
                data-thickness="2px"
                data-font-size="13pt"
              />
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', background: 'var(--panel)', border: '1px solid var(--panel-border)', padding: '4px', borderRadius: '12px' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  background: statusFilter === 'all' ? 'var(--accent)' : 'transparent',
                  color: statusFilter === 'all' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                Բոլորը ({apps.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('published')}
                style={{
                  background: statusFilter === 'published' ? 'var(--accent)' : 'transparent',
                  color: statusFilter === 'published' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                Հրապարակված ({publishedAppsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                style={{
                  background: statusFilter === 'draft' ? '#ff9800' : 'transparent',
                  color: statusFilter === 'draft' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                Սևագրեր ({draftAppsCount})
              </button>
            </div>
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
                  <th style={{ padding: '14px 18px' }}>Կարգավիճակ</th>
                  <th style={{ padding: '14px 18px' }}>Գին</th>
                  <th style={{ padding: '14px 18px' }}>Վերսիա</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Գործողություններ</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
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
                      {/* App Title & Thumbnail & Languages */}
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
                            {app.languages && app.languages.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                {app.languages.map((l, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      background: 'rgba(255,255,255,0.06)',
                                      color: 'var(--muted)',
                                      border: '1px solid var(--panel-border)'
                                    }}
                                  >
                                    {l}
                                  </span>
                                ))}
                              </div>
                            )}
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

                      {/* Status */}
                      <td style={{ padding: '12px 18px' }}>
                        {app.is_draft || app.status === 'draft' ? (
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: 'rgba(255, 152, 0, 0.15)',
                              color: '#ff9800',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff9800' }} />
                            Սևագիր
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: 'rgba(76, 175, 80, 0.15)',
                              color: '#4caf50',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50' }} />
                            Հրապարակված
                          </span>
                        )}
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
          SUBTAB 3: BUG REPORTS MANAGEMENT
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'bug_reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Filter Tabs & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '12px', width: 'fit-content', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `Բոլորը (${bugReports.length})` },
                { id: 'new', label: `Նոր (${bugReports.filter(r => r.status === 'new').length})` },
                { id: 'investigating', label: `Ուսումնասիրվում է (${bugReports.filter(r => r.status === 'investigating').length})` },
                { id: 'resolved', label: `Լուծված (${bugReports.filter(r => r.status === 'resolved').length})` },
                { id: 'closed', label: `Փակված (${bugReports.filter(r => r.status === 'closed').length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBugReportsFilter(tab.id as any)}
                  style={{
                    background: bugReportsFilter === tab.id ? 'var(--switcher-capsule-bg, rgba(255,255,255,0.15))' : 'transparent',
                    color: bugReportsFilter === tab.id ? '#ffffff' : 'var(--muted)',
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

            {/* Search */}
            <div style={{ minWidth: '260px' }}>
              <input
                type="text"
                value={bugReportsSearch}
                onChange={e => setBugReportsSearch(e.target.value)}
                placeholder="Որոնել ըստ թեմայի, հավելվածի, էլ․ հասցեի..."
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  background: 'var(--panel)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontSize: '0.86rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Bug Reports List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredBugReports.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', background: 'var(--panel)', borderRadius: '20px', border: '1px solid var(--panel-border)', color: 'var(--muted)' }}>
                Վրեպների զեկույցներ չկան:
              </div>
            ) : (
              filteredBugReports.map((report) => {
                const targetApp = apps.find(a => a.id === report.app_id);
                const statusColors = {
                  new: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'Նոր' },
                  investigating: { bg: 'rgba(33, 150, 243, 0.15)', text: '#2196f3', label: 'Ուսումնասիրվում է' },
                  resolved: { bg: 'rgba(76, 175, 80, 0.15)', text: '#4caf50', label: 'Լուծված' },
                  closed: { bg: 'rgba(158, 158, 158, 0.15)', text: '#9e9e9e', label: 'Փակված' }
                }[report.status] || { bg: 'rgba(255,255,255,0.1)', text: 'var(--muted)', label: report.status };

                return (
                  <div
                    key={report.id}
                    style={{
                      background: 'var(--panel)',
                      borderRadius: '18px',
                      border: report.status === 'new' ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--panel-border)',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '20px',
                      boxShadow: 'var(--shadow)',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {/* Top Badges Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Status Badge */}
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '20px',
                            background: statusColors.bg,
                            color: statusColors.text,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColors.text }} />
                          {statusColors.label}
                        </span>

                        {/* App Badge */}
                        <span
                          style={{
                            background: 'rgba(74, 137, 124, 0.12)',
                            color: 'var(--accent)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px'
                          }}
                        >
                          {targetApp ? targetApp.title_am : (report.app_title || report.app_id)}
                        </span>

                        {report.version && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                            {report.version}
                          </span>
                        )}

                        {report.os && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                            {report.os}
                          </span>
                        )}

                        {report.media_files && report.media_files.length > 0 && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '8px' }}>
                            📎 {report.media_files.length} նիշք
                          </span>
                        )}

                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                          {new Date(report.created_at).toLocaleString('hy-AM', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Subject */}
                      <h4 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text)' }}>
                        {report.subject}
                      </h4>

                      {/* Description Excerpt */}
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.88rem',
                          color: 'var(--text)',
                          opacity: 0.8,
                          lineHeight: '1.5',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {report.description}
                      </p>

                      {/* Reporter Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.82rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
                        <span>
                          👤 <strong>{report.user_name}</strong>
                        </span>
                        <span>
                          ✉️ <a href={`mailto:${report.user_email}?subject=Re: [Վրեպի Զեկույց] ${encodeURIComponent(report.subject)}`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{report.user_email}</a>
                        </span>
                        {report.admin_notes && (
                          <span style={{ color: '#d97706', fontStyle: 'italic' }}>
                            💬 Նշում՝ {report.admin_notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Right */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                      <select
                        value={report.status}
                        onChange={(e) => handleUpdateBugStatus(report.id, e.target.value as any)}
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--panel-border)',
                          color: 'var(--text)',
                          padding: '5px 8px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="new">Նոր</option>
                        <option value="investigating">Ուսումնասիրվում է</option>
                        <option value="resolved">Լուծված</option>
                        <option value="closed">Փակված</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBugReport(report);
                          setReportAdminNotes(report.admin_notes || '');
                        }}
                        style={{
                          background: 'rgba(74, 137, 124, 0.12)',
                          color: 'var(--accent)',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Դիտել
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBugReport(report.id)}
                        style={{
                          background: 'transparent',
                          color: '#e53935',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Ջնջել
                      </button>
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

              {/* ID, Type & Publication Status */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
                    Տիպ (Type) *
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

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Հրապարակման Կարգավիճակ *
                  </label>
                  <hd-segment
                    suppressHydrationWarning
                    value={editingApp.status || (editingApp.is_draft ? "draft" : "published")}
                    onChange={(e: any) => {
                      const val = e.target.value as 'published' | 'draft';
                      setEditingApp(p => ({
                        ...p,
                        status: val,
                        is_draft: val === 'draft'
                      }));
                    }}
                    data-width="100%"
                    data-height="40px"
                    data-thickness="2px"
                    data-font-size="0.84rem"
                  >
                    <span value="published" {...((!editingApp.status || editingApp.status === 'published') && !editingApp.is_draft ? { selected: true } : {})}>
                      Հրապարակված
                    </span>
                    <span value="draft" {...(editingApp.status === 'draft' || editingApp.is_draft ? { selected: true } : {})}>
                      Սևագիր
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

              {/* Languages Selection (Checkboxes / Chips + Custom) */}
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
                      Օգտագործվող լեզուներ (Languages) *
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Ընտրեք կամ ավելացրեք այն լեզուները, որոնք առկա են հավելվածում կամ խրվակում:
                    </span>
                  </div>
                  {selectedLanguagesList.length > 0 && (
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
                      Ընտրված է {selectedLanguagesList.length} լեզու
                    </span>
                  )}
                </div>

                {/* Preset Language Chips */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {LANGUAGE_PRESETS.map((lang) => {
                    const isSelected = selectedLanguagesList.some(l => l.toLowerCase() === lang.toLowerCase());
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleToggleLanguage(lang)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(74, 137, 124, 0.2)' : 'var(--panel)',
                          border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--panel-border)'}`,
                          color: isSelected ? 'var(--accent)' : 'var(--text)',
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span>{isSelected ? '✓ ' : '+ '}{lang}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Language */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <hd-input
                      suppressHydrationWarning
                      placeholder="+ Այլ լեզու (օրինակ՝ Italiano, 日本語)..."
                      value={customLanguageInput}
                      onInput={(e: any) => setCustomLanguageInput(e.target.value)}
                      onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomLanguage();
                        }
                      }}
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
                    onClick={handleAddCustomLanguage}
                  >
                    <span style={{ padding: '0 12px' }}>Ավելացնել</span>
                  </hd-button>
                </div>

                {/* Selected Languages Chips List */}
                {selectedLanguagesList.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginRight: '4px' }}>Ընտրված՝</span>
                    {selectedLanguagesList.map((lang) => (
                      <span
                        key={lang}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background: 'rgba(74, 137, 124, 0.15)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent)',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(lang)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            fontSize: '13px',
                            lineHeight: 1,
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
                  data-thickness="2px"
                  data-font-size="0.85rem"
                  data-color="rgba(255, 152, 0, 0.15)"
                  data-text-color="#ff9800"
                  onClick={(e: any) => handleSaveApp(e, 'draft')}
                  disabled={savingApp}
                >
                  <span style={{ padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>{savingApp ? "Պահպանվում է..." : "Պահպանել որպես սևագիր"}</span>
                  </span>
                </hd-button>

                <hd-button
                  suppressHydrationWarning
                  data-height="38px"
                  data-thickness="3px"
                  data-font-size="0.85rem"
                  data-color="var(--accent)"
                  data-text-color="#ffffff"
                  onClick={(e: any) => handleSaveApp(e, 'published')}
                  disabled={savingApp}
                >
                  <span style={{ padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <span>{savingApp ? "Պահպանվում է..." : "Հրապարակել Հավելվածը"}</span>
                  </span>
                </hd-button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SELECTED BUG REPORT DETAIL MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {selectedBugReport && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 99999998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedBugReport(null);
            }
          }}
        >
          <div
            style={{
              background: 'var(--panel)',
              borderRadius: '20px',
              border: '1px solid var(--panel-border)',
              width: 'min(780px, 96vw)',
              maxHeight: '92vh',
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
                padding: '18px 24px',
                borderBottom: '1px solid var(--panel-border)',
                background: 'var(--panel)',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.3rem' }}>🐛</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                    Վրեպի Զեկույց
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                    ID: {selectedBugReport.id} • {new Date(selectedBugReport.created_at).toLocaleString('hy-AM')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Status Dropdown */}
                <select
                  value={selectedBugReport.status}
                  onChange={(e) => handleUpdateBugStatus(selectedBugReport.id, e.target.value as any)}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--text)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <option value="new">🟠 Նոր</option>
                  <option value="investigating">🔵 Ուսումնասիրվում է</option>
                  <option value="resolved">🟢 Լուծված</option>
                  <option value="closed">⚪ Փակված</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSelectedBugReport(null)}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--text)',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    lineHeight: 1
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              {/* Meta Info Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  background: 'var(--bg)',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid var(--panel-border)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Հավելված
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>
                    {apps.find(a => a.id === selectedBugReport.app_id)?.title_am || selectedBugReport.app_title || selectedBugReport.app_id}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Տարբերակ / Version
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                    {selectedBugReport.version || 'Չի նշված'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Օպերացիոն Համակարգ
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                    {selectedBugReport.os || 'Չի նշված'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Ուղարկող (Օգտատեր)
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                    {selectedBugReport.user_name}
                  </div>
                  <a
                    href={`mailto:${selectedBugReport.user_email}?subject=Re: [Վրեպի Զեկույց] ${encodeURIComponent(selectedBugReport.subject)}`}
                    style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'underline', display: 'inline-block', marginTop: '2px' }}
                  >
                    {selectedBugReport.user_email}
                  </a>
                </div>
              </div>

              {/* Subject & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Թեմա
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                  {selectedBugReport.subject}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Նկարագրություն
                </div>
                <div
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '0.92rem',
                    lineHeight: '1.6',
                    color: 'var(--text)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {selectedBugReport.description}
                </div>
              </div>

              {/* Media Attachments Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Կցված Նիշքեր ({selectedBugReport.media_files ? selectedBugReport.media_files.length : 0})
                  </div>
                </div>

                {(!selectedBugReport.media_files || selectedBugReport.media_files.length === 0) ? (
                  <div style={{ fontSize: '0.86rem', color: 'var(--muted)', fontStyle: 'italic', background: 'var(--bg)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--panel-border)' }}>
                    Նիշքեր կցված չեն:
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedBugReport.media_files.map((fileUrl, idx) => {
                      const isImg = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(fileUrl);
                      const isVid = /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(fileUrl);
                      const filename = fileUrl.split('/').pop() || `Նիշք #${idx + 1}`;

                      if (isImg) {
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedMediaUrl(fileUrl)}
                            style={{
                              position: 'relative',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              aspectRatio: '16/10',
                              border: '1px solid var(--panel-border)',
                              background: '#000',
                              cursor: 'pointer',
                              boxShadow: 'var(--shadow)'
                            }}
                            title="Սեղմեք մեծացնելու համար"
                          >
                            <img
                              src={fileUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.3)',
                                opacity: 0,
                                transition: 'opacity 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.8rem'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                            >
                              🔍 Դիտել
                            </div>
                          </div>
                        );
                      }

                      if (isVid) {
                        return (
                          <div
                            key={idx}
                            style={{
                              borderRadius: '10px',
                              overflow: 'hidden',
                              border: '1px solid var(--panel-border)',
                              background: '#000'
                            }}
                          >
                            <video
                              src={fileUrl}
                              controls
                              style={{ width: '100%', height: 'auto', maxHeight: '160px', display: 'block' }}
                            />
                          </div>
                        );
                      }

                      return (
                        <a
                          key={idx}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px',
                            background: 'var(--bg)',
                            border: '1px solid var(--panel-border)',
                            borderRadius: '10px',
                            color: 'var(--text)',
                            textDecoration: 'none',
                            fontSize: '0.82rem',
                            wordBreak: 'break-all'
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>📄</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {filename}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Admin Internal Notes */}
              <div
                style={{
                  background: 'var(--bg)',
                  borderRadius: '14px',
                  border: '1px solid var(--panel-border)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text)' }}>
                    📝 Ներքին Վարչական Նշումներ (Admin Notes)
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                    Տեսանելի է միայն վարիչին
                  </span>
                </div>

                <textarea
                  value={reportAdminNotes}
                  onChange={(e) => setReportAdminNotes(e.target.value)}
                  placeholder="Գրեք նշումներ տվյալ վրեպի շտկման ընթացքի, պատճառների կամ լուծման վերաբերյալ..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--panel)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text)',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleSaveBugNotes(selectedBugReport.id)}
                    disabled={savingReportNotes}
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: savingReportNotes ? 'not-allowed' : 'pointer',
                      opacity: savingReportNotes ? 0.7 : 1
                    }}
                  >
                    {savingReportNotes ? 'Պահպանվում է...' : 'Պահպանել Նշումները'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderTop: '1px solid var(--panel-border)',
                background: 'var(--panel)',
                flexShrink: 0,
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => handleDeleteBugReport(selectedBugReport.id)}
                style={{
                  background: 'transparent',
                  color: '#e53935',
                  border: '1px solid rgba(229, 57, 53, 0.4)',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🗑 Ջնջել Զեկույցը
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`mailto:${selectedBugReport.user_email}?subject=Re: [HDesign] ${encodeURIComponent(selectedBugReport.subject)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(74, 137, 124, 0.15)',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  ✉️ Պատասխանել էլ․ փոստով
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedBugReport(null)}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--text)',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Փակել
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MEDIA LIGHTBOX PREVIEW MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {selectedMediaUrl && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 100000000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedMediaUrl(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '92vw', maxHeight: '92vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedMediaUrl}
              alt="Media Preview"
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
            />
            <button
              type="button"
              onClick={() => setSelectedMediaUrl(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: '#e53935',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              &times;
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
