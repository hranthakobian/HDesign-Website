"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import MarkdownRenderer from "./MarkdownRenderer";
import { HDesignStars } from "./RatingSystem";
import MediaPickerModal from "./MediaPickerModal";
import LoadingAnimation from "./LoadingAnimation";
import { MediaFileType } from "@/lib/mediaTypes";
import SoftwareIcon from "./SoftwareIcon";
import AppLanguagesPicker from "./AppLanguagesPicker";
import AppDesignSystemPicker from "./AppDesignSystemPicker";
import FileSizePicker from "./FileSizePicker";
import HdVideoPlayer from "./HdVideoPlayer";
import { isVideoUrl, getYoutubeThumbnail } from "./AppGallerySlider";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export type AppDownloadOption = {
  id?: string;
  name: string;
  url: string;
  file_size?: string;
  version?: string;
  icon?: string;
  os?: 'windows' | 'macos' | 'linux' | 'other';
  host_app?: string;
};

export type AppRepository = {
  id?: string;
  type: 'github' | 'gitlab' | 'bitbucket' | 'gitea' | 'code' | string;
  url: string;
  label?: string;
};

type AppItem = {
  id: string;
  title_am: string;
  title_en: string;
  short_desc_am?: string;
  short_desc_en?: string;
  description_md_am?: string;
  description_md_en?: string;
  host_app: string;
  host_apps?: string[];
  host_app_icon?: string;
  app_type: 'plugin' | 'standalone';
  supported_os?: ('windows' | 'macos' | 'linux')[];
  is_paid: boolean;
  price: number;
  currency?: string;
  download_url?: string;
  downloads?: AppDownloadOption[];
  store_url?: string;
  repository_url?: string;
  repository_type?: string;
  repositories?: AppRepository[];
  cover_image?: string;
  video_url?: string;
  gallery_images: string[];
  languages?: string[];
  design_system?: string;
  version: string;
  release_date: string;
  file_size?: string;
  downloads_count?: number;
  avg_rating?: number;
  reviews_count?: number;
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

type AppDownloadLog = {
  id?: string;
  app_id: string;
  download_url?: string;
  download_id?: string;
  ip_address: string;
  user_agent: string;
  os?: string;
  is_spam: boolean;
  spam_reason?: string;
  created_at: string;
};

type AppVisitLog = {
  id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  browser?: string;
  os?: string;
  landing_page?: string;
  created_at?: string;
  is_spam?: boolean;
};

interface AdminAppsManagerProps {
  initialApps?: AppItem[];
  token?: string | null;
}

const SOFTWARE_PRESETS = [
  'FontLab',
  'Blender',
  'Figma',
  'VS Code',
  'Adobe Illustrator',
  'Adobe Photoshop',
  'Adobe InDesign',
  'Adobe After Effects',
  'Unity',
  'Unreal Engine'
];

const CHART_COLORS = ['#0d9488', '#0284c7', '#d97706', '#db2777', '#7c3aed', '#16a34a'];

export default function AdminAppsManager({ initialApps = [], token: propToken }: AdminAppsManagerProps) {
  const [apps, setApps] = useState<AppItem[]>(initialApps);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string | null>(propToken || null);

  // View mode: 'list' | 'wizard' | 'hub'
  const [viewMode, setViewMode] = useState<"list" | "wizard" | "hub">("list");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Filters & Search for list view
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "plugin" | "standalone">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Wizard state: 4 steps now
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardMarkdownTab, setWizardMarkdownTab] = useState<"edit" | "preview">("edit");

  // Active Hub state
  const [hubTab, setHubTab] = useState<"edit" | "analytics" | "reports" | "reviews" | "logs">("edit");
  const [editorSubTab, setEditorSubTab] = useState<"general" | "media" | "downloads_repos" | "markdown">("general");

  // Custom software input
  const [customSoftwareInput, setCustomSoftwareInput] = useState("");

  // Form State
  const [form, setForm] = useState<AppItem>({
    id: `app-${Date.now()}`,
    title_am: "",
    title_en: "",
    short_desc_am: "",
    short_desc_en: "",
    description_md_am: "",
    description_md_en: "",
    host_app: "FontLab",
    host_apps: ["FontLab"],
    host_app_icon: "",
    app_type: "plugin",
    supported_os: ["windows", "macos"],
    is_paid: false,
    price: 0,
    currency: "USD",
    download_url: "",
    downloads: [],
    repository_url: "",
    repository_type: "github",
    repositories: [{ type: "github", url: "", label: "GitHub" }],
    cover_image: "",
    video_url: "",
    gallery_images: [],
    languages: ["am", "en"],
    design_system: "",
    version: "1.0.0",
    release_date: new Date().toISOString().split("T")[0],
    downloads_count: 0,
    avg_rating: 5,
    reviews_count: 0,
    status: "published",
    is_draft: false,
  });

  // Real Analytics & Hub data
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [bugReports, setBugReports] = useState<AppBugReport[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<AppDownloadLog[]>([]);
  const [visitLogs, setVisitLogs] = useState<AppVisitLog[]>([]);
  const [activeReportFilter, setActiveReportFilter] = useState<string>("all");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Media Picker state
  const [mediaPickerConfig, setMediaPickerConfig] = useState<{
    isOpen: boolean;
    target: "cover" | "gallery" | "download_file" | "video";
    targetOS?: 'windows' | 'macos' | 'linux';
    targetHostApp?: string;
    multiple?: boolean;
    allowedTypes?: MediaFileType[];
    title?: string;
    currentValue?: string | string[];
  } | null>(null);

  // Gallery Drag and Drop state
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null);
  const [dragOverGalleryIndex, setDragOverGalleryIndex] = useState<number | null>(null);

  const moveGalleryImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setForm(prev => {
      const list = [...(prev.gallery_images || [])];
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return { ...prev, gallery_images: list };
    });
  };

  // Markdown editor tabs
  const [mdLangTab, setMdLangTab] = useState<"am" | "en">("am");
  const [mdViewMode, setMdViewMode] = useState<"edit" | "split" | "preview">("split");

  // Notifications control: option to disable notifications to users
  const [notifySubscribers, setNotifySubscribers] = useState<boolean>(true);

  // Markdown file upload helper
  const handleUploadMarkdownFile = (e: React.ChangeEvent<HTMLInputElement>, lang: "am" | "en") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        if (lang === "am") {
          setForm(prev => ({ ...prev, description_md_am: text }));
        } else {
          setForm(prev => ({ ...prev, description_md_en: text }));
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Initialize
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = propToken || localStorage.getItem("hdesign_admin_token");
      setToken(savedToken);
      if (savedToken) {
        prefetchMediaLibrary(savedToken);
      }
      loadApps(savedToken);
    }
  }, [propToken]);

  const loadApps = async (authToken?: string | null) => {
    setLoading(true);
    try {
      const res = await fetch("/api/apps", {
        headers: authToken ? { Authorization: authToken } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.apps || []);
        setApps(list);
      }
    } catch (err) {
      console.error("Error loading apps:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to toggle host apps array
  const toggleHostApp = (softwareName: string) => {
    setForm(prev => {
      const current = prev.host_apps || [];
      const updated = current.includes(softwareName)
        ? current.filter(s => s !== softwareName)
        : [...current, softwareName];
      return {
        ...prev,
        host_apps: updated,
        host_app: updated.join(", ")
      };
    });
  };

  const addCustomSoftware = () => {
    if (!customSoftwareInput.trim()) return;
    const name = customSoftwareInput.trim();
    setForm(prev => {
      const current = prev.host_apps || [];
      if (current.includes(name)) return prev;
      const updated = [...current, name];
      return {
        ...prev,
        host_apps: updated,
        host_app: updated.join(", ")
      };
    });
    setCustomSoftwareInput("");
  };

  // Helper to get download file URL for a specific (OS, HostApp) pair
  const getDownloadUrlFor = (osKey: 'windows' | 'macos' | 'linux', hostApp?: string) => {
    const downloads = form.downloads || [];
    const found = downloads.find(d => d.os === osKey && (form.app_type === 'standalone' || d.host_app === hostApp));
    return found ? found.url : "";
  };

  // Helper to set download file URL for a specific (OS, HostApp) pair
  const setDownloadUrlFor = (osKey: 'windows' | 'macos' | 'linux', urlValue: string, hostApp?: string) => {
    setForm(prev => {
      const downloads = [...(prev.downloads || [])];
      const index = downloads.findIndex(d => d.os === osKey && (prev.app_type === 'standalone' || d.host_app === hostApp));

      const optionName = prev.app_type === 'plugin'
        ? `${hostApp || 'Plugin'} (${osKey.toUpperCase()})`
        : `${prev.title_en || 'App'} (${osKey.toUpperCase()})`;

      if (index >= 0) {
        if (!urlValue.trim()) {
          downloads.splice(index, 1);
        } else {
          downloads[index] = { ...downloads[index], url: urlValue.trim() };
        }
      } else if (urlValue.trim()) {
        downloads.push({
          id: `dl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: optionName,
          url: urlValue.trim(),
          os: osKey,
          host_app: hostApp || prev.host_app,
          version: prev.version || '1.0.0'
        });
      }

      const primaryUrl = downloads.length > 0 ? downloads[0].url : prev.download_url;

      return {
        ...prev,
        downloads,
        download_url: primaryUrl
      };
    });
  };

  // Open Wizard for new App
  const handleOpenNewAppWizard = () => {
    setForm({
      id: `app-${Date.now()}`,
      title_am: "",
      title_en: "",
      short_desc_am: "",
      short_desc_en: "",
      description_md_am: "",
      description_md_en: "",
      host_app: "FontLab",
      host_apps: ["FontLab"],
      host_app_icon: "",
      app_type: "plugin",
      supported_os: ["windows", "macos"],
      is_paid: false,
      price: 0,
      currency: "USD",
      download_url: "",
      downloads: [],
      repository_url: "",
      repository_type: "github",
      repositories: [{ type: "github", url: "", label: "GitHub" }],
      cover_image: "",
      video_url: "",
      gallery_images: [],
      languages: ["am", "en"],
      design_system: "",
      version: "1.0.0",
      release_date: new Date().toISOString().split("T")[0],
      downloads_count: 0,
      avg_rating: 5,
      reviews_count: 0,
      status: "published",
      is_draft: false,
    });
    setWizardStep(1);
    setViewMode("wizard");
  };

  // Open Hub for existing App & Load REAL analytics/data
  const handleOpenAppHub = async (app: AppItem) => {
    setSelectedAppId(app.id);

    let parsedHostApps: string[] = [];
    if (Array.isArray(app.host_apps) && app.host_apps.length > 0) {
      parsedHostApps = app.host_apps;
    } else if (app.host_app) {
      parsedHostApps = app.host_app.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (parsedHostApps.length === 0) {
      parsedHostApps = ['FontLab'];
    }

    let repos: AppRepository[] = Array.isArray(app.repositories) ? [...app.repositories] : [];
    if (repos.length === 0 && app.repository_url) {
      repos = [{
        type: app.repository_type || 'github',
        url: app.repository_url,
        label: app.repository_type ? app.repository_type.toUpperCase() : 'GitHub'
      }];
    }
    if (repos.length === 0) {
      repos = [{ type: 'github', url: '', label: 'GitHub' }];
    }

    setForm({
      ...app,
      host_apps: parsedHostApps,
      host_app: parsedHostApps.join(', '),
      repositories: repos,
      gallery_images: Array.isArray(app.gallery_images) ? app.gallery_images : [],
      supported_os: Array.isArray(app.supported_os) ? app.supported_os : ['windows', 'macos'],
      downloads: Array.isArray(app.downloads) ? app.downloads : [],
      video_url: app.video_url || "",
    });
    setHubTab("edit");
    setViewMode("hub");

    // Load REAL Data for this App
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('hdesign_admin_token') : null);
    const authHeaders: Record<string, string> = currentToken ? { Authorization: currentToken } : {};

    // 1. Real Bug Reports
    if (currentToken) {
      try {
        const bRes = await fetch(`/api/apps/bug-reports`, { headers: { Authorization: currentToken } });
        if (bRes.ok) {
          const bData = await bRes.json();
          const list = Array.isArray(bData) ? bData : (bData?.reports || []);
          setBugReports(list.filter((r: AppBugReport) => r.app_id === app.id));
        }
      } catch (e) {}
    }

    // 2. Real Reviews
    try {
      const rRes = await fetch(`/api/apps/reviews?app_id=${app.id}`, { headers: authHeaders });
      if (rRes.ok) {
        const rData = await rRes.json();
        const rList = Array.isArray(rData) ? rData : (rData?.reviews || []);
        setReviews(rList.filter((r: AppReview) => r.app_id === app.id));
      }
    } catch (e) {}

    // 3. Real Downloads Log
    try {
      const dRes = await fetch(`/api/apps/download?appId=${app.id}`, { headers: authHeaders });
      if (dRes.ok) {
        const dData = await dRes.json();
        const dList = Array.isArray(dData?.downloads) ? dData.downloads : [];
        setDownloadLogs(dList);
      }
    } catch (e) {}

    // 4. Real Analytics / Visits
    try {
      const vRes = await fetch(`/api/analytics`, { headers: authHeaders });
      if (vRes.ok) {
        const vData = await vRes.json();
        const vList = Array.isArray(vData) ? vData : [];
        setVisitLogs(vList);
      }
    } catch (e) {}
  };

  // Save handler
  const handleSaveApp = async () => {
    if (!form.title_am.trim() && !form.title_en.trim()) {
      alert("Խնդրում ենք նշել հավելվածի անվանումը:");
      return;
    }
    if (!token) {
      alert("Նույնականացման տոկենը բացակայում է:");
      return;
    }

    setSaving(true);
    try {
      const validRepos = (form.repositories || []).filter(r => r.url.trim() !== "");
      const primaryRepo = validRepos[0];

      const cleanSupportedOs = form.supported_os || [];
      const cleanDownloads = (form.downloads || []).filter(d => {
        if (!d.url?.trim() || d.url.includes('example.com')) return false;
        if (cleanSupportedOs.length > 0 && d.os) {
          return cleanSupportedOs.includes(d.os as any);
        }
        return true;
      });

      const payload = {
        ...form,
        downloads: cleanDownloads,
        download_url: cleanDownloads.length > 0 ? cleanDownloads[0].url : (form.download_url || ""),
        original_id: selectedAppId,
        notify_subscribers: notifySubscribers,
        host_app: (form.host_apps && form.host_apps.length > 0) ? form.host_apps.join(', ') : form.host_app,
        repository_url: primaryRepo ? primaryRepo.url : (form.repository_url || ""),
        repository_type: primaryRepo ? primaryRepo.type : (form.repository_type || "github"),
        repositories: validRepos,
      };

      const res = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok) {
        alert("Հավելվածը հաջողությամբ պահպանվեց:");
        setSelectedAppId(form.id);
        await loadApps(token);
        if (viewMode === "wizard") {
          setViewMode("list");
        }
      } else {
        alert("Սխալ՝ " + (resData.error || "Չհաջողվեց պահպանել հավելվածը:"));
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Չհաջողվեց պահպանել հավելվածը:");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApp = async (appId: string, title: string) => {
    if (!confirm(`Իսկապե՞ս ցանկանում եք ջնջել «${title}» հավելվածը:`)) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      if (res.ok) {
        setApps(prev => prev.filter(a => a.id !== appId));
        if (viewMode === "hub" && selectedAppId === appId) {
          setViewMode("list");
        }
      } else {
        alert("Չհաջողվեց ջնջել հավելվածը:");
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const handleToggleStatus = async (app: AppItem) => {
    const newStatus = app.status === "published" ? "draft" : "published";
    if (!token) return;

    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          ...app,
          status: newStatus,
          is_draft: newStatus === "draft",
        }),
      });
      if (res.ok) {
        setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus, is_draft: newStatus === "draft" } : a));
        if (form.id === app.id) {
          setForm(prev => ({ ...prev, status: newStatus, is_draft: newStatus === "draft" }));
        }
      }
    } catch (e) {
      console.error("Error toggling status:", e);
    }
  };

  // Media Picker Callback
  const handleMediaPickerSelect = (selected: string | string[]) => {
    if (!mediaPickerConfig) return;
    const { target, targetOS, targetHostApp } = mediaPickerConfig;

    if (target === "cover") {
      const url = Array.isArray(selected) ? selected[0] : selected;
      setForm(prev => ({ ...prev, cover_image: url }));
    } else if (target === "video") {
      const url = Array.isArray(selected) ? selected[0] : selected;
      setForm(prev => ({ ...prev, video_url: url }));
    } else if (target === "gallery") {
      const urls = Array.isArray(selected) ? selected : [selected];
      setForm(prev => ({
        ...prev,
        gallery_images: Array.from(new Set([...prev.gallery_images, ...urls]))
      }));
    } else if (target === "download_file" && targetOS) {
      const url = Array.isArray(selected) ? selected[0] : selected;
      setDownloadUrlFor(targetOS, url, targetHostApp);
    }
    setMediaPickerConfig(null);
  };

  // Multi-Repositories Helpers
  const addRepository = () => {
    setForm(prev => ({
      ...prev,
      repositories: [
        ...(prev.repositories || []),
        { id: `repo-${Date.now()}`, type: "github", url: "", label: "GitHub" }
      ]
    }));
  };

  const removeRepository = (index: number) => {
    setForm(prev => ({
      ...prev,
      repositories: (prev.repositories || []).filter((_, i) => i !== index)
    }));
  };

  const updateRepository = (index: number, field: keyof AppRepository, value: string) => {
    setForm(prev => {
      const list = [...(prev.repositories || [])];
      list[index] = { ...list[index], [field]: value };
      if (field === 'type') {
        const typeLabels: Record<string, string> = {
          github: 'GitHub',
          gitlab: 'GitLab',
          bitbucket: 'Bitbucket',
          gitea: 'Gitea',
          code: 'Git'
        };
        list[index].label = typeLabels[value] || value.toUpperCase();
      }
      return { ...prev, repositories: list };
    });
  };

  // REAL Analytics calculation
  const realAnalytics = useMemo(() => {
    // 1. Real Downloads
    const nonSpamDownloads = downloadLogs.filter(d => !d.is_spam);
    const totalDownloads = Math.max(form.downloads_count || 0, nonSpamDownloads.length);

    // 2. Real Visits for this app
    const appVisits = visitLogs.filter(v =>
      !v.is_spam &&
      (v.landing_page === `/apps/${form.id}` || v.landing_page?.startsWith(`/apps/${form.id}`))
    );
    const totalViews = Math.max(appVisits.length, totalDownloads);
    const convRate = totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : "0.0";

    // 3. Real Ratings & Breakdown
    const realReviews = reviews;
    const avgRating = realReviews.length > 0
      ? (realReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / realReviews.length).toFixed(1)
      : (form.avg_rating || 5.0);

    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    realReviews.forEach(r => {
      const stars = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      ratingCounts[stars] = (ratingCounts[stars] || 0) + 1;
    });

    const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => {
      const count = ratingCounts[stars] || 0;
      const percent = realReviews.length > 0 ? Math.round((count / realReviews.length) * 100) : 0;
      return { stars, count, percent };
    });

    // 4. Real OS Breakdown from downloads & visits
    const osCounts: Record<string, number> = { Windows: 0, macOS: 0, Linux: 0, Other: 0 };
    let totalOsEvents = 0;

    nonSpamDownloads.forEach(d => {
      const userAgent = (d.user_agent || '').toLowerCase();
      const os = (d.os || '').toLowerCase();
      if (os.includes('win') || userAgent.includes('win')) osCounts.Windows++;
      else if (os.includes('mac') || userAgent.includes('mac') || userAgent.includes('apple')) osCounts.macOS++;
      else if (os.includes('linux') || userAgent.includes('linux')) osCounts.Linux++;
      else osCounts.Other++;
      totalOsEvents++;
    });

    appVisits.forEach(v => {
      const os = (v.os || '').toLowerCase();
      const userAgent = (v.user_agent || '').toLowerCase();
      if (os.includes('win') || userAgent.includes('win')) osCounts.Windows++;
      else if (os.includes('mac') || userAgent.includes('mac') || userAgent.includes('apple')) osCounts.macOS++;
      else if (os.includes('linux') || userAgent.includes('linux')) osCounts.Linux++;
      else osCounts.Other++;
      totalOsEvents++;
    });

    const osStats = [
      { name: 'Windows', value: totalOsEvents > 0 ? Math.round((osCounts.Windows / totalOsEvents) * 100) : ((form.supported_os || []).includes('windows') ? 50 : 0) },
      { name: 'macOS', value: totalOsEvents > 0 ? Math.round((osCounts.macOS / totalOsEvents) * 100) : ((form.supported_os || []).includes('macos') ? 40 : 0) },
      { name: 'Linux', value: totalOsEvents > 0 ? Math.round((osCounts.Linux / totalOsEvents) * 100) : ((form.supported_os || []).includes('linux') ? 10 : 0) },
    ];

    // 5. Dynamic 6-Month Timeline
    const monthNames = ["Հնվ", "Փտր", "Մրտ", "Ապր", "Մայ", "Հուն", "Հուլ", "Օգս", "Սեպ", "Հոկ", "Նոյ", "Դեկ"];
    const now = new Date();
    const chartTimeline = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.getMonth();
      const yearKey = d.getFullYear();
      const label = `${monthNames[monthKey]}`;

      const monthDownloads = nonSpamDownloads.filter(dl => {
        if (!dl.created_at) return false;
        const date = new Date(dl.created_at);
        return date.getMonth() === monthKey && date.getFullYear() === yearKey;
      }).length;

      const monthViews = appVisits.filter(vi => {
        if (!vi.created_at) return false;
        const date = new Date(vi.created_at);
        return date.getMonth() === monthKey && date.getFullYear() === yearKey;
      }).length;

      chartTimeline.push({
        date: label,
        views: monthViews,
        downloads: monthDownloads
      });
    }

    return {
      totalViews,
      totalDownloads,
      convRate,
      avgRating,
      chartTimeline,
      osStats,
      ratingBreakdown,
    };
  }, [form.id, form.downloads_count, form.avg_rating, form.supported_os, downloadLogs, visitLogs, reviews]);

  // Filtered Apps for list view
  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchSearch =
        (app.title_am || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.title_en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.host_app || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.id || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === "all" || app.app_type === typeFilter;
      const matchStatus = statusFilter === "all" || (app.status || "published") === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [apps, searchQuery, typeFilter, statusFilter]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      color: "var(--text, #0f172a)",
      fontFamily: "'Outfit', 'HDesign', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <style>{`
        @keyframes adminFadeInSlide {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .admin-tab-transition {
          animation: adminFadeInSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════════
          VIEW 1: APPS LIST & OVERVIEW (WHITE / LIGHT THEME)
          ══════════════════════════════════════════════════════════════════════════ */}
      {viewMode === "list" && (
        <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header Card */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            background: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Հավելվածների և Խրվակների Կառավարում
                </h2>
                <span style={{
                  background: "#f1f5f9",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  padding: "2px 10px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}>
                  {apps.length}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px", margin: 0 }}>
                Ավելացրեք նոր հավելվածներ վիզարդի միջոցով կամ կառավարեք գոյություն ունեցողները:
              </p>
            </div>

            <div onClick={handleOpenNewAppWizard}>
              <hd-button data-height="40px" data-thickness="3px">
                <span className="hd-icon icon-Plus" style={{ marginRight: 6 }} />
                Ավելացնել Հավելված
              </hd-button>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            background: "#ffffff",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
          }}>
            <div style={{ flex: 1, minWidth: "240px", maxWidth: "380px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Որոնել հավելվածներ..."
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#0f172a",
                  fontSize: "0.88rem",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                {[
                  { id: "all", label: "Բոլորը" },
                  { id: "plugin", label: "Խրվակներ" },
                  { id: "standalone", label: "Անկախ" },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id as any)}
                    style={{
                      padding: "6px 14px",
                      background: typeFilter === t.id ? "#ffffff" : "transparent",
                      color: typeFilter === t.id ? "#0f172a" : "#64748b",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: typeFilter === t.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                style={{
                  padding: "8px 12px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#0f172a",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  outline: "none"
                }}
              >
                <option value="all">Կարգավիճակ՝ Բոլորը</option>
                <option value="published">Հրապարակված</option>
                <option value="draft">Սևագիր</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div style={{ padding: "64px 20px", display: "flex", justifyContent: "center" }}>
              <LoadingAnimation message="Բեռնվում են հավելվածները..." />
            </div>
          ) : filteredApps.length === 0 ? (
            <div style={{
              padding: "64px 24px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px dashed #cbd5e1",
              color: "#64748b",
            }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
                Հավելվածներ չեն գտնվել
              </div>
              <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                Փորձեք փոխել որոնման պարամետրերը կամ սեղմեք «Ավելացնել Հավելված»:
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {filteredApps.map(app => {
                const isPublished = app.status === "published";
                const repos = app.repositories || (app.repository_url ? [{ type: app.repository_type || 'github', url: app.repository_url }] : []);

                return (
                  <div
                    key={app.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                  >
                    <div style={{ position: "relative", height: "140px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", overflow: "hidden" }}>
                      {app.cover_image ? (
                        <img
                          src={app.cover_image}
                          alt={app.title_am}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#64748b" }}>
                            {app.app_type === 'plugin' ? 'Խրվակ' : 'Հավելված'}
                          </span>
                        </div>
                      )}

                      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: "6px" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: isPublished ? "#ecfdf5" : "#fffbeb",
                          color: isPublished ? "#059669" : "#d97706",
                          border: `1px solid ${isPublished ? "#a7f3d0" : "#fde68a"}`,
                          fontWeight: 700,
                        }}>
                          {isPublished ? "Հրապարակված" : "Սևագիր"}
                        </span>
                        <span style={{
                          fontSize: "0.72rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#ffffff",
                          color: "#0f172a",
                          fontWeight: 700,
                          border: "1px solid #cbd5e1",
                        }}>
                          v{app.version || "1.0.0"}
                        </span>
                      </div>

                      <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <span style={{
                          fontSize: "0.72rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#ffffff",
                          color: "#334155",
                          fontWeight: 600,
                          border: "1px solid #cbd5e1",
                        }}>
                          {app.host_app || (app.app_type === 'plugin' ? 'Խրվակ' : 'Հավելված')}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <div
                          onClick={() => handleOpenAppHub(app)}
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            color: "#0f172a",
                            cursor: "pointer",
                            display: "inline-block",
                          }}
                        >
                          {app.title_am || app.title_en}
                        </div>
                        {app.title_en && app.title_en !== app.title_am && (
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{app.title_en}</div>
                        )}
                      </div>

                      <p style={{
                        fontSize: "0.84rem",
                        color: "#64748b",
                        lineHeight: 1.45,
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {app.short_desc_am || app.short_desc_en || "Նկարագրություն նշված չէ:"}
                      </p>

                      {repos.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                          {repos.map((r, ri) => (
                            <span key={ri} style={{
                              fontSize: "0.72rem",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "#f1f5f9",
                              color: "#334155",
                              border: "1px solid #e2e8f0",
                              fontWeight: 600
                            }}>
                              {r.label || r.type.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "12px",
                        marginTop: "auto",
                        borderTop: "1px solid #f1f5f9",
                        fontSize: "0.8rem",
                        color: "#64748b",
                      }}>
                        <span>{app.downloads_count || 0} ներբեռնում</span>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          {app.is_paid ? `${app.price} ${app.currency || 'USD'}` : 'Անվճար'}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      background: "#f8fafc",
                      padding: "14px 20px",
                      borderTop: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}>
                      <div onClick={() => handleOpenAppHub(app)}>
                        <hd-button data-height="34px" data-thickness="3px">
                          <span className="hd-icon icon-Settings" style={{ marginRight: 6 }} />
                          Կառավարել
                        </hd-button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <a
                          href={`/apps/${app.id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "6px 10px",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            color: "#0f172a",
                            fontSize: "0.8rem",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center"
                          }}
                          title="Դիտել կայքում"
                        >
                          <span className="hd-icon icon-Eye" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(app)}
                          style={{
                            padding: "6px 10px",
                            background: isPublished ? "#ecfdf5" : "#fffbeb",
                            border: `1px solid ${isPublished ? "#a7f3d0" : "#fde68a"}`,
                            borderRadius: "6px",
                            color: isPublished ? "#059669" : "#d97706",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {isPublished ? "Ակտիվ" : "Թաքցված"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          VIEW 2: 4-STEP CREATION WIZARD (COMPATIBILITY MERGED INTO BASIC DATA)
          ══════════════════════════════════════════════════════════════════════════ */}
      {viewMode === "wizard" && (
        <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffff",
            padding: "18px 24px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div onClick={() => setViewMode("list")}>
                <hd-button data-height="36px" data-thickness="3px">
                  ← Հետ
                </hd-button>
              </div>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Նոր Հավելվածի Ստեղծման Գործիք
                </h2>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Քայլ առ քայլ մուտքագրեք հավելվածի տվյալները
                </span>
              </div>
            </div>

            <div onClick={handleSaveApp}>
              <hd-button data-height="38px" data-thickness="3px">
                <span className="hd-icon icon-Check" style={{ marginRight: 6 }} />
                {saving ? "Պահպանվում է..." : "Հաստատել և Հրապարակել"}
              </hd-button>
            </div>
          </div>

          {/* 4 Steps Progress indicators */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
          }}>
            {[
              { step: 1, title: "1. Հիմնական Տվյալներ", desc: "Անուն, Տիպ, ԳՀ և Ֆայլեր" },
              { step: 2, title: "2. Պատկերներ", desc: "Կազմ և Պատկերասրահ" },
              { step: 3, title: "3. Շտեմարաններ և Գին", desc: "Git և Գին" },
              { step: 4, title: "4. Ամփոփում", desc: "Նկարագրություն" },
            ].map(s => {
              const isCurrent = wizardStep === s.step;
              const isPassed = wizardStep > s.step;
              return (
                <div
                  key={s.step}
                  onClick={() => setWizardStep(s.step)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    opacity: isCurrent ? 1 : isPassed ? 0.9 : 0.45,
                  }}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: isCurrent ? "#0f172a" : isPassed ? "#f1f5f9" : "#ffffff",
                    color: isCurrent ? "#ffffff" : isPassed ? "#0f172a" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    border: isCurrent ? "none" : "1px solid #cbd5e1",
                  }}>
                    {isPassed ? "✓" : s.step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isCurrent ? "#0f172a" : "#475569" }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>

            {/* STEP 1: Basic Info + Type + Host Apps + OS Compatibility + Packages Matrix */}
            {wizardStep === 1 && (
              <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Քայլ 1: Հիմնական Տվյալներ և Համատեղելիություն
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "4px" }}>
                    Մուտքագրեք անվանումները, ընտրեք տեսակը, ծրագրերը, Գործավար Համակարգերը և կցեք նիշքերը:
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Անվանում (Հայերեն) *
                    </label>
                    <input
                      type="text"
                      value={form.title_am}
                      onChange={e => setForm(prev => ({ ...prev, title_am: e.target.value }))}
                      placeholder="Օր.՝ Գլիֆերի Էքսպորտեր"
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Անվանում (English) *
                    </label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={e => setForm(prev => ({ ...prev, title_en: e.target.value }))}
                      placeholder="Օր.՝ Glyph Exporter Pro"
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Հավելվածի ID (URL հասցե / Slug) *
                    </label>
                    <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0 12px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>/apps/</span>
                      <input
                        type="text"
                        value={form.id}
                        onChange={e => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
                          setForm(prev => ({ ...prev, id: val }));
                        }}
                        placeholder="glyph-exporter"
                        style={{ flex: 1, padding: "10px 6px", background: "transparent", border: "none", outline: "none", color: "#0f172a", fontSize: "0.88rem", fontWeight: 600 }}
                      />
                    </div>
                    <span style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                      Էջի հասցեն կլինի՝ <strong>/apps/{form.id}</strong>
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                        Տեսակ *
                      </label>
                      <select
                        value={form.app_type}
                        onChange={e => setForm(prev => ({ ...prev, app_type: e.target.value as any }))}
                        style={{ width: "100%", padding: "10px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem", fontWeight: 600 }}
                      >
                        <option value="plugin">Խրվակ (Plugin)</option>
                        <option value="standalone">Հավելված (Standalone Application)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                        Կարգավիճակ
                      </label>
                      <select
                        value={form.status}
                        onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                        style={{ width: "100%", padding: "10px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem" }}
                      >
                        <option value="published">Հրապարակված</option>
                        <option value="draft">Սևագիր</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Languages and Design System */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <AppLanguagesPicker
                      languages={form.languages || []}
                      onChange={(langs) => setForm(prev => ({ ...prev, languages: langs }))}
                    />
                  </div>
                  <div>
                    <AppDesignSystemPicker
                      value={form.design_system || ""}
                      onChange={(val) => setForm(prev => ({ ...prev, design_system: val }))}
                    />
                  </div>
                </div>

                {/* If App Type == Plugin: Multiple Host Applications Picker */}
                {form.app_type === 'plugin' && (
                  <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                        Ընտրեք Ծրագրերը (Host Applications), որոնց համար նախատեսված է Խրվակը *
                      </label>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Կարող եք ընտրել մի քանի ծրագիր միաժամանակ:
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {SOFTWARE_PRESETS.map(sw => {
                        const isSelected = (form.host_apps || []).includes(sw);
                        return (
                          <button
                            key={sw}
                            type="button"
                            onClick={() => toggleHostApp(sw)}
                            style={{
                              padding: "6px 14px",
                              background: isSelected ? "#0f172a" : "#ffffff",
                              color: isSelected ? "#ffffff" : "#334155",
                              border: `1px solid ${isSelected ? "#0f172a" : "#cbd5e1"}`,
                              borderRadius: "20px",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {isSelected ? `✓ ${sw}` : `+ ${sw}`}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                      <input
                        type="text"
                        value={customSoftwareInput}
                        onChange={e => setCustomSoftwareInput(e.target.value)}
                        placeholder="Այլ ծրագրի անվանում..."
                        style={{ flex: 1, padding: "8px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.82rem" }}
                      />
                      <button
                        type="button"
                        onClick={addCustomSoftware}
                        style={{ padding: "8px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        Ավելացնել
                      </button>
                    </div>
                  </div>
                )}

                {/* OS Compatibility & Package Attachment Matrix */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                      Աջակցվող Գործավար Համակարգեր (ԳՀ / OS Compatibility)
                    </label>
                    <div style={{ display: "flex", gap: "12px" }}>
                      {[
                        { id: 'windows', label: 'Windows' },
                        { id: 'macos', label: 'macOS' },
                        { id: 'linux', label: 'Linux' },
                      ].map(osItem => {
                        const isChecked = (form.supported_os || []).includes(osItem.id as any);
                        return (
                          <label
                            key={osItem.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "9px 16px",
                              background: isChecked ? "#f1f5f9" : "#ffffff",
                              border: `1px solid ${isChecked ? "#0f172a" : "#cbd5e1"}`,
                              borderRadius: "8px",
                              cursor: "pointer",
                              color: "#0f172a",
                              fontWeight: 600,
                              fontSize: "0.85rem"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                const curr = form.supported_os || [];
                                setForm(prev => ({
                                  ...prev,
                                  supported_os: e.target.checked ? [...curr, osItem.id as any] : curr.filter(x => x !== osItem.id)
                                }));
                              }}
                              style={{ accentColor: "#0f172a" }}
                            />
                            {osItem.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Matrix */}
                  {(form.supported_os || []).length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "6px" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                        Ներբեռնման նիշքերի կցում ըստ ընտրված ԳՀ-ների և ծրագրերի
                      </div>

                      {(form.supported_os || []).map(osKey => {
                        const osTitle = osKey === 'windows' ? 'Windows' : osKey === 'macos' ? 'macOS' : 'Linux';

                        return (
                          <div key={osKey} style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a", marginBottom: "12px", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                              <SoftwareIcon name={osKey} size={18} />
                              <span>{form.app_type === 'standalone' ? osTitle : `${osTitle} Գործավար Համակարգ`}</span>
                            </div>

                            {form.app_type === 'plugin' ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {(form.host_apps || ['FontLab']).map(sw => {
                                  const currentUrl = getDownloadUrlFor(osKey, sw);
                                  return (
                                    <div key={sw} style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#334155" }}>
                                        {sw} — Խրվակ {osTitle}-ի համար
                                      </div>
                                      <div style={{ display: "flex", gap: "10px" }}>
                                        <input
                                          type="text"
                                          value={currentUrl}
                                          onChange={e => setDownloadUrlFor(osKey, e.target.value, sw)}
                                          placeholder={`https://... (${sw} plugin for ${osTitle})`}
                                          style={{ flex: 1, padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setMediaPickerConfig({
                                            isOpen: true,
                                            target: "download_file",
                                            targetOS: osKey,
                                            targetHostApp: sw,
                                            multiple: false,
                                            title: `Ընտրել ${sw} (${osTitle}) Խրվակի Ֆայլը`,
                                            currentValue: currentUrl
                                          })}
                                          style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                                        >
                                          Ընտրել Ֆայլ
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                  <SoftwareIcon name={osKey} size={18} />
                                  <span>{osTitle}</span>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                  <input
                                    type="text"
                                    value={getDownloadUrlFor(osKey)}
                                    onChange={e => setDownloadUrlFor(osKey, e.target.value)}
                                    placeholder={`https://... (Installer package for ${osTitle})`}
                                    style={{ flex: 1, padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setMediaPickerConfig({
                                      isOpen: true,
                                      target: "download_file",
                                      targetOS: osKey,
                                      multiple: false,
                                      title: `Ընտրել ${osTitle} Տեղադրման Ֆայլը`,
                                      currentValue: getDownloadUrlFor(osKey)
                                    })}
                                    style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                                  >
                                    Ընտրել Ֆայլ
                                  </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Տարբերակ (Version)
                    </label>
                    <input
                      type="text"
                      value={form.version}
                      onChange={e => setForm(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0.0"
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Թողարկման Ամսաթիվ
                    </label>
                    <input
                      type="date"
                      value={form.release_date || ""}
                      onChange={e => setForm(prev => ({ ...prev, release_date: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <FileSizePicker
                      value={form.file_size || ""}
                      onChange={val => setForm(prev => ({ ...prev, file_size: val }))}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Կարճ Նկարագրություն (Հայերեն)
                    </label>
                    <textarea
                      rows={3}
                      value={form.short_desc_am || ""}
                      onChange={e => setForm(prev => ({ ...prev, short_desc_am: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem", resize: "vertical" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Short Description (English)
                    </label>
                    <textarea
                      rows={3}
                      value={form.short_desc_en || ""}
                      onChange={e => setForm(prev => ({ ...prev, short_desc_en: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem", resize: "vertical" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Media */}
            {wizardStep === 2 && (
              <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Քայլ 2: Մեդիա (Պատկերներ և Տեսանյութ)
                  </h3>
                </div>

                {/* Cover Image */}
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Գլխավոր Պատկեր (Cover Image)
                  </label>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    {form.cover_image && (
                      <div style={{ position: "relative", width: "140px", height: "90px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                        <img src={form.cover_image} alt="Cover Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, cover_image: "" }))}
                          style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "4px", padding: "2px 6px", cursor: "pointer", fontSize: "0.75rem" }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaPickerConfig({
                        isOpen: true,
                        target: "cover",
                        multiple: false,
                        allowedTypes: ["image"],
                        title: "Ընտրել Կազմը",
                        currentValue: form.cover_image
                      })}
                      style={{ padding: "10px 18px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      {form.cover_image ? "Փոխել Կազմը" : "Ընտրել Մեդիա Գրադարանից"}
                    </button>
                  </div>
                </div>

                {/* Video URL & Player Section */}
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                        🎬 Տեսանյութ (Video / Promo Trailer)
                      </label>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Կարող եք տեղադրել YouTube, Vimeo, Loom կամ ուղիղ MP4/WebM տեսանյութի հղում, կամ ընտրել մեդիա գրադարանից:
                      </span>
                    </div>
                    {form.video_url && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, video_url: "" }))}
                        style={{ padding: "4px 10px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "6px", color: "#b91c1c", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        Հեռացնել տեսանյութը
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={form.video_url || ""}
                      onChange={(e) => setForm(prev => ({ ...prev, video_url: e.target.value.trim() }))}
                      placeholder="https://www.youtube.com/watch?v=... կամ https://.../video.mp4"
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        color: "#0f172a",
                        fontSize: "0.88rem"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerConfig({
                        isOpen: true,
                        target: "video",
                        multiple: false,
                        allowedTypes: ["video"],
                        title: "Ընտրել Տեսանյութ",
                        currentValue: form.video_url
                      })}
                      style={{
                        padding: "10px 18px",
                        background: "#0f172a",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      📁 Մեդիա Գրադարան
                    </button>
                  </div>

                  {form.video_url && form.video_url.trim() && (
                    <div style={{ marginTop: "8px", borderRadius: "12px", overflow: "hidden", border: "1px solid #cbd5e1", maxWidth: "480px" }}>
                      <div style={{ padding: "6px 12px", background: "#0f172a", color: "#94a3b8", fontSize: "0.72rem", fontWeight: 700 }}>
                        Նախադիտում (HdVideoPlayer)
                      </div>
                      <HdVideoPlayer
                        src={form.video_url.trim()}
                        poster={form.cover_image}
                        autoplay={false}
                        width="100%"
                        height="auto"
                        radius="0px"
                      />
                    </div>
                  )}
                </div>

                {/* Gallery Screenshots */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                        Պատկերասրահի Սքրինշոթեր ({form.gallery_images?.length || 0})
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaPickerConfig({
                        isOpen: true,
                        target: "gallery",
                        multiple: true,
                        allowedTypes: ["image", "video"],
                        title: "Ավելացնել Պատկերներ կամ Տեսանյութեր",
                        currentValue: form.gallery_images
                      })}
                      style={{ padding: "6px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      + Ավելացնել Պատկերներ
                    </button>
                  </div>

                  {(form.gallery_images || []).length > 0 && (
                    <div style={{ fontSize: "0.76rem", color: "#64748b", marginBottom: "10px" }}>
                      💡 Քաշեք և գցեք (Drag & Drop) պատկերները՝ տեղերը փոխելու համար։
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
                    {(form.gallery_images || []).map((imgUrl, i) => {
                      const isDragging = draggedGalleryIndex === i;
                      const isOver = dragOverGalleryIndex === i && draggedGalleryIndex !== i;
                      const isVid = isVideoUrl(imgUrl);
                      const thumb = isVid ? (getYoutubeThumbnail(imgUrl) || null) : imgUrl;

                      return (
                        <div
                          key={i}
                          draggable
                          onDragStart={(e) => {
                            setDraggedGalleryIndex(i);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", `${i}`);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverGalleryIndex !== i) {
                              setDragOverGalleryIndex(i);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverGalleryIndex === i) {
                              setDragOverGalleryIndex(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedGalleryIndex !== null) {
                              moveGalleryImage(draggedGalleryIndex, i);
                            }
                            setDraggedGalleryIndex(null);
                            setDragOverGalleryIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedGalleryIndex(null);
                            setDragOverGalleryIndex(null);
                          }}
                          style={{
                            position: "relative",
                            height: "95px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: isOver ? "2px dashed #0f172a" : "1px solid #cbd5e1",
                            boxShadow: isOver ? "0 0 0 3px rgba(15,23,42,0.15)" : "none",
                            transform: isDragging ? "scale(0.95)" : isOver ? "scale(1.03)" : "none",
                            opacity: isDragging ? 0.4 : 1,
                            transition: "all 0.15s ease",
                            cursor: "grab",
                            background: "#0d1716",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title="Քաշեք տեղափոխելու համար"
                        >
                          {thumb ? (
                            <img src={thumb} alt={`Screenshot ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span className="hd-icon icon-Play" style={{ fontSize: "20px", color: "var(--accent, #4a897c)" }} />
                            </div>
                          )}
                          {isVid && thumb && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                              <span className="hd-icon icon-Play" style={{ fontSize: "16px", color: "#fff" }} />
                            </div>
                          )}
                          <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(15,23,42,0.75)", color: "#ffffff", borderRadius: "4px", padding: "1px 6px", fontSize: "0.68rem", fontWeight: 700, pointerEvents: "none" }}>
                            #{i + 1}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm(prev => ({ ...prev, gallery_images: prev.gallery_images.filter((_, idx) => idx !== i) }));
                            }}
                            style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.65)", border: "none", color: "#fff", borderRadius: "4px", padding: "2px 6px", cursor: "pointer", fontSize: "0.7rem", zIndex: 10 }}
                            title="Հեռացնել"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Pricing & Multi Repos */}
            {wizardStep === 3 && (
              <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Քայլ 3: Շտեմարաններ և Գին
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "#0f172a" }}>
                      <input
                        type="checkbox"
                        checked={form.is_paid}
                        onChange={e => setForm(prev => ({ ...prev, is_paid: e.target.checked }))}
                        style={{ accentColor: "#0f172a" }}
                      />
                      Վճարովի Հավելված
                    </label>
                  </div>
                  {form.is_paid && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="number"
                        value={form.price || ""}
                        onChange={e => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="Գին"
                        style={{ flex: 1, padding: "8px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                      />
                      <select
                        value={form.currency || "USD"}
                        onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
                        style={{ width: "100px", padding: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="AMD">AMD</option>
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                      Կոդային Շտեմարաններ (Repositories)
                    </div>
                    <button
                      type="button"
                      onClick={addRepository}
                      style={{ padding: "6px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      + Ավելացնել Շտեմարան
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(form.repositories || []).map((repo, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <select
                          value={repo.type}
                          onChange={e => updateRepository(idx, "type", e.target.value)}
                          style={{ width: "140px", padding: "9px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem", fontWeight: 600 }}
                        >
                          <option value="github">GitHub</option>
                          <option value="gitlab">GitLab</option>
                          <option value="bitbucket">Bitbucket</option>
                          <option value="gitea">Gitea</option>
                          <option value="code">Git (Custom)</option>
                        </select>
                        <input
                          type="text"
                          value={repo.url}
                          onChange={e => updateRepository(idx, "url", e.target.value)}
                          placeholder="https://..."
                          style={{ flex: 1, padding: "9px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeRepository(idx)}
                          style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Overview & Markdown */}
            {wizardStep === 4 && (
              <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Քայլ 4: Ամփոփում և Նկարագրություն
                  </h3>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setWizardMarkdownTab("edit")}
                    style={{
                      padding: "6px 14px",
                      background: wizardMarkdownTab === "edit" ? "#0f172a" : "#f1f5f9",
                      color: wizardMarkdownTab === "edit" ? "#ffffff" : "#475569",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer"
                    }}
                  >
                    Խմբագրել Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardMarkdownTab("preview")}
                    style={{
                      padding: "6px 14px",
                      background: wizardMarkdownTab === "preview" ? "#0f172a" : "#f1f5f9",
                      color: wizardMarkdownTab === "preview" ? "#ffffff" : "#475569",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer"
                    }}
                  >
                    Նախադիտում
                  </button>
                </div>

                {wizardMarkdownTab === "edit" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                          Նկարագրություն (Հայերեն)
                        </label>
                        <label style={{ cursor: "pointer", fontSize: "0.76rem", color: "#0284c7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", background: "#f0f9ff", border: "1px dashed #bae6fd", padding: "2px 8px", borderRadius: "6px" }}>
                          <span>📄 Վերբեռնել .md</span>
                          <input type="file" accept=".md,.markdown,text/markdown,text/plain" style={{ display: "none" }} onChange={e => handleUploadMarkdownFile(e, "am")} />
                        </label>
                      </div>
                      <textarea
                        rows={10}
                        value={form.description_md_am || ""}
                        onChange={e => setForm(prev => ({ ...prev, description_md_am: e.target.value }))}
                        style={{ width: "100%", padding: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem", fontFamily: "monospace", resize: "vertical" }}
                      />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                          Description (English)
                        </label>
                        <label style={{ cursor: "pointer", fontSize: "0.76rem", color: "#0284c7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", background: "#f0f9ff", border: "1px dashed #bae6fd", padding: "2px 8px", borderRadius: "6px" }}>
                          <span>📄 Upload .md</span>
                          <input type="file" accept=".md,.markdown,text/markdown,text/plain" style={{ display: "none" }} onChange={e => handleUploadMarkdownFile(e, "en")} />
                        </label>
                      </div>
                      <textarea
                        rows={10}
                        value={form.description_md_en || ""}
                        onChange={e => setForm(prev => ({ ...prev, description_md_en: e.target.value }))}
                        style={{ width: "100%", padding: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem", fontFamily: "monospace", resize: "vertical" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "10px" }}>Հայերեն</div>
                      <MarkdownRenderer content={form.description_md_am || "*Դատարկ է*"} />
                    </div>
                    <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "10px" }}>English</div>
                      <MarkdownRenderer content={form.description_md_en || "*Empty*"} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wizard Nav */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
                style={{ padding: "8px 20px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", color: wizardStep === 1 ? "#94a3b8" : "#0f172a", fontWeight: 600, cursor: wizardStep === 1 ? "not-allowed" : "pointer" }}
              >
                ← Նախորդ
              </button>
              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(prev => Math.min(4, prev + 1))}
                  style={{ padding: "8px 24px", background: "#0f172a", border: "none", borderRadius: "8px", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                >
                  Հաջորդը →
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setNotifySubscribers(!notifySubscribers)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: notifySubscribers ? "#eff6ff" : "#fef2f2",
                      color: notifySubscribers ? "#1d4ed8" : "#b91c1c",
                      border: `1px solid ${notifySubscribers ? "#bfdbfe" : "#fecaca"}`,
                      transition: "all 0.15s ease"
                    }}
                    title={notifySubscribers ? "Ծանուցումները միացված են: Օգտվողները կստանան էլ. նամակ:" : "Ծանուցումներն անջատված են: Օգտվողներին ոչինչ չի ուղարկվի:"}
                  >
                    <span>{notifySubscribers ? "🔔" : "🔕"}</span>
                    <span>{notifySubscribers ? "Ծանուցումներ՝ Միացված" : "Ծանուցումներ՝ Անջատված"}</span>
                  </button>
                  <div onClick={handleSaveApp}>
                    <hd-button data-height="38px" data-thickness="3px">
                      <span className="hd-icon icon-Check" style={{ marginRight: 6 }} />
                      {saving ? "Պահպանվում է..." : "Ավարտել և Հրապարակել"}
                    </hd-button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          VIEW 3: 5-TAB APP MANAGEMENT HUB
          ══════════════════════════════════════════════════════════════════════════ */}
      {viewMode === "hub" && (
        <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            background: "#ffffff",
            padding: "18px 24px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div onClick={() => setViewMode("list")}>
                <hd-button data-height="36px" data-thickness="3px">
                  ← Հետ
                </hd-button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {form.cover_image ? (
                  <img
                    src={form.cover_image}
                    alt="App Icon"
                    style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", border: "1px solid #cbd5e1" }}
                  />
                ) : (
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.85rem" }}>
                    HD
                  </div>
                )}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
                      {form.title_am || form.title_en || "Անանուն Հավելված"}
                    </span>
                    <span style={{
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: form.status === "published" ? "#ecfdf5" : "#fffbeb",
                      color: form.status === "published" ? "#059669" : "#d97706",
                      border: `1px solid ${form.status === "published" ? "#a7f3d0" : "#fde68a"}`,
                      fontWeight: 700,
                    }}>
                      {form.status === "published" ? "Հրապարակված" : "Սևագիր"}
                    </span>
                    <span style={{
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      fontWeight: 600,
                    }}>
                      v{form.version || '1.0.0'}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    ID: {form.id} • {form.host_app || 'Անկախ'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <a
                href={`/apps/${form.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#0f172a",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <span>Դիտել կայքում</span>
                <span className="hd-icon icon-Eye" />
              </a>

              <button
                type="button"
                onClick={() => handleDeleteApp(form.id, form.title_am || form.title_en)}
                style={{
                  padding: "8px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#dc2626",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span className="hd-icon icon-Trash" />
                <span>Ջնջել</span>
              </button>

              <button
                type="button"
                onClick={() => setNotifySubscribers(!notifySubscribers)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: notifySubscribers ? "#eff6ff" : "#fef2f2",
                  color: notifySubscribers ? "#1d4ed8" : "#b91c1c",
                  border: `1px solid ${notifySubscribers ? "#bfdbfe" : "#fecaca"}`,
                  transition: "all 0.15s ease"
                }}
                title={notifySubscribers ? "Ծանուցումները միացված են: Օգտվողները կստանան էլ. նամակ:" : "Ծանուցումներն անջատված են: Օգտվողներին ոչինչ չի ուղարկվի:"}
              >
                <span>{notifySubscribers ? "🔔" : "🔕"}</span>
                <span>{notifySubscribers ? "Ծանուցումներ՝ Միացված" : "Ծանուցումներ՝ Անջատված"}</span>
              </button>

              <div onClick={handleSaveApp}>
                <hd-button data-height="38px" data-thickness="3px">
                  <span className="hd-icon icon-Check" style={{ marginRight: 6 }} />
                  {saving ? "Պահպանվում է..." : "Պահպանել"}
                </hd-button>
              </div>
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
          }}>
            {[
              { id: "edit", label: "Խմբագրում", badge: null },
              { id: "analytics", label: "Վիճակագրություն", badge: `${realAnalytics.totalDownloads} ներբեռնում` },
              { id: "reports", label: "Զեկույցներ", badge: bugReports.length > 0 ? `${bugReports.length}` : null },
              { id: "reviews", label: "Մեկնաբանություններ", badge: reviews.length > 0 ? `${reviews.length}` : null },
              { id: "logs", label: "Ներբեռնումների Լոգ", badge: downloadLogs.length > 0 ? `${downloadLogs.length}` : null },
            ].map(tab => {
              const isActive = hubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHubTab(tab.id as any)}
                  style={{
                    padding: "10px 18px",
                    background: isActive ? "#0f172a" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: isActive ? "#ffffff" : "#475569",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span style={{
                      fontSize: "0.72rem",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      background: isActive ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#334155",
                      fontWeight: 700,
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: EDIT (SUB-TABS: GENERAL, MEDIA, REPOS/PRICING, MARKDOWN) */}
          {hubTab === "edit" && (
            <div className="admin-tab-transition" style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "24px",
                background: "#f8fafc",
                padding: "6px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                width: "fit-content"
              }}>
                {[
                  { id: "general", label: "Հիմնական Տվյալներ" },
                  { id: "media", label: "Պատկերներ" },
                  { id: "downloads_repos", label: "Շտեմարաններ և Գին" },
                  { id: "markdown", label: "Markdown Նկարագրություն" },
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setEditorSubTab(st.id as any)}
                    style={{
                    padding: "8px 14px",
                    background: editorSubTab === st.id ? "#ffffff" : "transparent",
                    color: editorSubTab === st.id ? "#0f172a" : "#64748b",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    boxShadow: editorSubTab === st.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Sub-tab 1: General (Contains Basic info, Host Apps if Plugin, OS Compatibility, and File Package Matrix) */}
            {editorSubTab === "general" && (
              <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Անվանում (Հայերեն) *
                    </label>
                    <input
                      type="text"
                      value={form.title_am}
                      onChange={e => setForm(prev => ({ ...prev, title_am: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Անվանում (English) *
                    </label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={e => setForm(prev => ({ ...prev, title_en: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Հավելվածի ID (URL հասցե / Slug) *
                    </label>
                    <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0 12px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>/apps/</span>
                      <input
                        type="text"
                        value={form.id}
                        onChange={e => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
                          setForm(prev => ({ ...prev, id: val }));
                        }}
                        placeholder="my-app"
                        style={{ flex: 1, padding: "10px 6px", background: "transparent", border: "none", outline: "none", color: "#0f172a", fontSize: "0.88rem", fontWeight: 600 }}
                      />
                    </div>
                    <span style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                      Էջի հասցեն՝ <strong>/apps/{form.id}</strong>
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                        Տեսակ *
                      </label>
                      <select
                        value={form.app_type}
                        onChange={e => setForm(prev => ({ ...prev, app_type: e.target.value as any }))}
                        style={{ width: "100%", padding: "10px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem", fontWeight: 600 }}
                      >
                        <option value="plugin">Խրվակ (Plugin)</option>
                        <option value="standalone">Հավելված (Standalone Application)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                        Կարգավիճակ
                      </label>
                      <select
                        value={form.status}
                        onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                        style={{ width: "100%", padding: "10px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem" }}
                      >
                        <option value="published">Հրապարակված</option>
                        <option value="draft">Սևագիր</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Languages and Design System */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <AppLanguagesPicker
                      languages={form.languages || []}
                      onChange={(langs) => setForm(prev => ({ ...prev, languages: langs }))}
                    />
                  </div>
                  <div>
                    <AppDesignSystemPicker
                      value={form.design_system || ""}
                      onChange={(val) => setForm(prev => ({ ...prev, design_system: val }))}
                    />
                  </div>
                </div>

                {/* If Plugin: Host Apps Selection */}
                {form.app_type === 'plugin' && (
                  <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                        Ծրագրեր (Host Applications), որոնց համար նախատեսված է Խրվակը *
                      </label>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Ընտրեք մի քանի ծրագիր միաժամանակ:
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {SOFTWARE_PRESETS.map(sw => {
                        const isSelected = (form.host_apps || []).includes(sw);
                        return (
                          <button
                            key={sw}
                            type="button"
                            onClick={() => toggleHostApp(sw)}
                            style={{
                              padding: "6px 14px",
                              background: isSelected ? "#0f172a" : "#ffffff",
                              color: isSelected ? "#ffffff" : "#334155",
                              border: `1px solid ${isSelected ? "#0f172a" : "#cbd5e1"}`,
                              borderRadius: "20px",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            {isSelected ? `✓ ${sw}` : `+ ${sw}`}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                      <input
                        type="text"
                        value={customSoftwareInput}
                        onChange={e => setCustomSoftwareInput(e.target.value)}
                        placeholder="Այլ ծրագրի անվանում..."
                        style={{ flex: 1, padding: "8px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.82rem" }}
                      />
                      <button
                        type="button"
                        onClick={addCustomSoftware}
                        style={{ padding: "8px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        Ավելացնել
                      </button>
                    </div>
                  </div>
                )}

                {/* OS Compatibility & Package Attachment Matrix */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                      Աջակցվող Գործավար Համակարգեր (ԳՀ / OS Compatibility)
                    </label>
                    <div style={{ display: "flex", gap: "12px" }}>
                      {[
                        { id: 'windows', label: 'Windows' },
                        { id: 'macos', label: 'macOS' },
                        { id: 'linux', label: 'Linux' },
                      ].map(osItem => {
                        const isChecked = (form.supported_os || []).includes(osItem.id as any);
                        return (
                          <label
                            key={osItem.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "9px 16px",
                              background: isChecked ? "#f1f5f9" : "#ffffff",
                              border: `1px solid ${isChecked ? "#0f172a" : "#cbd5e1"}`,
                              borderRadius: "8px",
                              cursor: "pointer",
                              color: "#0f172a",
                              fontWeight: 600,
                              fontSize: "0.85rem"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                const curr = form.supported_os || [];
                                const nextOS = e.target.checked ? [...curr, osItem.id as any] : curr.filter(x => x !== osItem.id);
                                setForm(prev => ({
                                  ...prev,
                                  supported_os: nextOS,
                                  downloads: e.target.checked
                                    ? (prev.downloads || [])
                                    : (prev.downloads || []).filter(d => d.os !== osItem.id)
                                }));
                              }}
                              style={{ accentColor: "#0f172a" }}
                            />
                            {osItem.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Matrix per selected OS */}
                  {(form.supported_os || []).length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "6px" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                        Ներբեռնման նիշքերի կցում ըստ ընտրված ԳՀ-ների և ծրագրերի
                      </div>

                      {(form.supported_os || []).map(osKey => {
                        const osTitle = osKey === 'windows' ? 'Windows' : osKey === 'macos' ? 'macOS' : 'Linux';

                        return (
                          <div key={osKey} style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a", marginBottom: "12px", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                              <SoftwareIcon name={osKey} size={18} />
                              <span>{form.app_type === 'standalone' ? osTitle : `${osTitle} Գործավար Համակարգ`}</span>
                            </div>

                            {form.app_type === 'plugin' ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {(form.host_apps || ['FontLab']).map(sw => {
                                  const currentUrl = getDownloadUrlFor(osKey, sw);
                                  return (
                                    <div key={sw} style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#334155" }}>
                                        {sw} — Խրվակ {osTitle}-ի համար
                                      </div>
                                      <div style={{ display: "flex", gap: "10px" }}>
                                        <input
                                          type="text"
                                          value={currentUrl}
                                          onChange={e => setDownloadUrlFor(osKey, e.target.value, sw)}
                                          placeholder={`https://... (${sw} plugin for ${osTitle})`}
                                          style={{ flex: 1, padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setMediaPickerConfig({
                                            isOpen: true,
                                            target: "download_file",
                                            targetOS: osKey,
                                            targetHostApp: sw,
                                            multiple: false,
                                            title: `Ընտրել ${sw} (${osTitle}) Խրվակի Ֆայլը`,
                                            currentValue: currentUrl
                                          })}
                                          style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                                        >
                                          Ընտրել Ֆայլ
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                  <SoftwareIcon name={osKey} size={18} />
                                  <span>{osTitle}</span>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                  <input
                                    type="text"
                                    value={getDownloadUrlFor(osKey)}
                                    onChange={e => setDownloadUrlFor(osKey, e.target.value)}
                                    placeholder={`https://... (Installer package for ${osTitle})`}
                                    style={{ flex: 1, padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setMediaPickerConfig({
                                      isOpen: true,
                                      target: "download_file",
                                      targetOS: osKey,
                                      multiple: false,
                                      title: `Ընտրել ${osTitle} Տեղադրման Ֆայլը`,
                                      currentValue: getDownloadUrlFor(osKey)
                                    })}
                                    style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                                  >
                                    Ընտրել Ֆայլ
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Տարբերակ (Version)</label>
                    <input type="text" value={form.version} onChange={e => setForm(prev => ({ ...prev, version: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Թողարկման Ամսաթիվ</label>
                    <input type="date" value={form.release_date || ""} onChange={e => setForm(prev => ({ ...prev, release_date: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem" }} />
                  </div>
                  <div>
                    <FileSizePicker
                      value={form.file_size || ""}
                      onChange={val => setForm(prev => ({ ...prev, file_size: val }))}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Կարճ Նկարագրություն (Հայերեն)</label>
                    <textarea rows={3} value={form.short_desc_am || ""} onChange={e => setForm(prev => ({ ...prev, short_desc_am: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem", resize: "vertical" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Short Description (English)</label>
                    <textarea rows={3} value={form.short_desc_en || ""} onChange={e => setForm(prev => ({ ...prev, short_desc_en: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem", resize: "vertical" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Media */}
            {editorSubTab === "media" && (
              <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Գլխավոր Պատկեր (Cover)
                  </label>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    {form.cover_image && (
                      <div style={{ position: "relative", width: "140px", height: "90px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                        <img src={form.cover_image} alt="Cover Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, cover_image: "" }))}
                          style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "4px", padding: "2px 6px", cursor: "pointer", fontSize: "0.75rem" }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaPickerConfig({
                        isOpen: true,
                        target: "cover",
                        multiple: false,
                        allowedTypes: ["image"],
                        title: "Ընտրել Կազմը",
                        currentValue: form.cover_image
                      })}
                      style={{ padding: "10px 18px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      {form.cover_image ? "Փոխել Կազմը" : "Ընտրել Մեդիա Գրադարանից"}
                    </button>
                  </div>
                </div>

                {/* Video URL & Player Section */}
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                        🎬 Տեսանյութ (Video / Promo Trailer)
                      </label>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Կարող եք տեղադրել YouTube, Vimeo, Loom կամ ուղիղ MP4/WebM տեսանյութի հղում, կամ ընտրել մեդիա գրադարանից:
                      </span>
                    </div>
                    {form.video_url && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, video_url: "" }))}
                        style={{ padding: "4px 10px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "6px", color: "#b91c1c", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        Հեռացնել տեսանյութը
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={form.video_url || ""}
                      onChange={(e) => setForm(prev => ({ ...prev, video_url: e.target.value.trim() }))}
                      placeholder="https://www.youtube.com/watch?v=... կամ https://.../video.mp4"
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        color: "#0f172a",
                        fontSize: "0.88rem"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerConfig({
                        isOpen: true,
                        target: "video",
                        multiple: false,
                        allowedTypes: ["video"],
                        title: "Ընտրել Տեսանյութ",
                        currentValue: form.video_url
                      })}
                      style={{
                        padding: "10px 18px",
                        background: "#0f172a",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      📁 Մեդիա Գրադարան
                    </button>
                  </div>

                  {form.video_url && form.video_url.trim() && (
                    <div style={{ marginTop: "8px", borderRadius: "12px", overflow: "hidden", border: "1px solid #cbd5e1", maxWidth: "480px" }}>
                      <div style={{ padding: "6px 12px", background: "#0f172a", color: "#94a3b8", fontSize: "0.72rem", fontWeight: 700 }}>
                        Նախադիտում (HdVideoPlayer)
                      </div>
                      <HdVideoPlayer
                        src={form.video_url.trim()}
                        poster={form.cover_image}
                        autoplay={false}
                        width="100%"
                        height="auto"
                        radius="0px"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                        Պատկերասրահի Սքրինշոթեր ({form.gallery_images?.length || 0})
                      </label>
                      <span style={{ display: "block", fontSize: "0.74rem", color: "#64748b" }}>
                        Կարող եք տեղափոխել դասավորությունը՝ քաշելով և գցելով պատկերները:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaPickerConfig({
                        isOpen: true,
                        target: "gallery",
                        multiple: true,
                        allowedTypes: ["image", "video"],
                        title: "Ավելացնել Պատկերներ կամ Տեսանյութեր",
                        currentValue: form.gallery_images
                      })}
                      style={{ padding: "6px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      + Ավելացնել Պատկերներ
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
                    {(form.gallery_images || []).map((imgUrl, i) => {
                      const isDragging = draggedGalleryIndex === i;
                      const isOver = dragOverGalleryIndex === i && draggedGalleryIndex !== i;
                      const isVid = isVideoUrl(imgUrl);
                      const thumb = isVid ? (getYoutubeThumbnail(imgUrl) || null) : imgUrl;

                      return (
                        <div
                          key={i}
                          draggable
                          onDragStart={(e) => {
                            setDraggedGalleryIndex(i);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", `${i}`);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverGalleryIndex !== i) {
                              setDragOverGalleryIndex(i);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverGalleryIndex === i) {
                              setDragOverGalleryIndex(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedGalleryIndex !== null) {
                              moveGalleryImage(draggedGalleryIndex, i);
                            }
                            setDraggedGalleryIndex(null);
                            setDragOverGalleryIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedGalleryIndex(null);
                            setDragOverGalleryIndex(null);
                          }}
                          style={{
                            position: "relative",
                            height: "100px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: isOver ? "2px dashed #0f172a" : "1px solid #cbd5e1",
                            boxShadow: isOver ? "0 0 0 3px rgba(15,23,42,0.15)" : "none",
                            transform: isDragging ? "scale(0.95)" : isOver ? "scale(1.03)" : "none",
                            opacity: isDragging ? 0.4 : 1,
                            transition: "all 0.15s ease",
                            cursor: "grab",
                            background: "#0d1716",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title="Քաշեք տեղափոխելու համար"
                        >
                          {thumb ? (
                            <img src={thumb} alt={`Screenshot ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span className="hd-icon icon-Play" style={{ fontSize: "22px", color: "var(--accent, #4a897c)" }} />
                            </div>
                          )}
                          {isVid && thumb && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                              <span className="hd-icon icon-Play" style={{ fontSize: "16px", color: "#fff" }} />
                            </div>
                          )}
                          <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(15,23,42,0.75)", color: "#ffffff", borderRadius: "4px", padding: "1px 6px", fontSize: "0.68rem", fontWeight: 700, pointerEvents: "none" }}>
                            #{i + 1}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm(prev => ({ ...prev, gallery_images: prev.gallery_images.filter((_, idx) => idx !== i) }));
                            }}
                            style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.65)", border: "none", color: "#fff", borderRadius: "4px", padding: "2px 6px", cursor: "pointer", fontSize: "0.7rem", zIndex: 10 }}
                            title="Հեռացնել"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Pricing & Repos */}
            {editorSubTab === "downloads_repos" && (
              <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "#0f172a" }}>
                      <input
                        type="checkbox"
                        checked={form.is_paid}
                        onChange={e => setForm(prev => ({ ...prev, is_paid: e.target.checked }))}
                        style={{ accentColor: "#0f172a" }}
                      />
                      Վճարովի Հավելված
                    </label>
                  </div>
                  {form.is_paid && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="number"
                        value={form.price || ""}
                        onChange={e => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="Գին"
                        style={{ flex: 1, padding: "8px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                      />
                      <select
                        value={form.currency || "USD"}
                        onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
                        style={{ width: "100px", padding: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="AMD">AMD</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Multi-Repositories */}
                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                        Կոդային Շտեմարաններ (Repositories)
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Նշեք GitHub, GitLab, Bitbucket, Gitea հղումները:
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addRepository}
                      style={{ padding: "6px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      + Ավելացնել Շտեմարան
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(form.repositories || []).map((repo, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <select
                          value={repo.type}
                          onChange={e => updateRepository(idx, "type", e.target.value)}
                          style={{ width: "140px", padding: "9px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem", fontWeight: 600 }}
                        >
                          <option value="github">GitHub</option>
                          <option value="gitlab">GitLab</option>
                          <option value="bitbucket">Bitbucket</option>
                          <option value="gitea">Gitea</option>
                          <option value="code">Git (Custom)</option>
                        </select>
                        <input
                          type="text"
                          value={repo.url}
                          onChange={e => updateRepository(idx, "url", e.target.value)}
                          placeholder="https://..."
                          style={{ flex: 1, padding: "9px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.85rem" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeRepository(idx)}
                          style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 4: Markdown */}
            {editorSubTab === "markdown" && (
              <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Language switcher & Upload Button toolbar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", marginRight: "4px" }}>
                      Լեզու՝
                    </span>
                    <button
                      type="button"
                      onClick={() => setMdLangTab("am")}
                      style={{
                        padding: "6px 16px",
                        background: mdLangTab === "am" ? "#0f172a" : "#f1f5f9",
                        color: mdLangTab === "am" ? "#ffffff" : "#334155",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      🇦🇲 Հայերեն
                    </button>
                    <button
                      type="button"
                      onClick={() => setMdLangTab("en")}
                      style={{
                        padding: "6px 16px",
                        background: mdLangTab === "en" ? "#0f172a" : "#f1f5f9",
                        color: mdLangTab === "en" ? "#ffffff" : "#334155",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      🇬🇧 English
                    </button>
                  </div>

                  <label
                    style={{
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      background: "#f0f9ff",
                      border: "1px dashed #0284c7",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#0284c7",
                      transition: "all 0.15s ease"
                    }}
                    title={`Վերբեռնել Markdown նիշք (${mdLangTab === 'am' ? 'Հայերեն' : 'English'})`}
                  >
                    <span>📄 Վերբեռնել Markdown նիշք (.md)</span>
                    <input
                      type="file"
                      accept=".md,.markdown,text/markdown,text/plain"
                      style={{ display: "none" }}
                      onChange={e => handleUploadMarkdownFile(e, mdLangTab)}
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                        {mdLangTab === "am" ? "Խմբագրել (Հայերեն Markdown)" : "Editor (English Markdown)"}
                      </span>
                      <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                        {mdLangTab === "am" ? "Աջակցում է KaTeX, աղյուսակներ, կոդ" : "Supports KaTeX, tables, code"}
                      </span>
                    </div>
                    <textarea
                      rows={15}
                      value={mdLangTab === "am" ? (form.description_md_am || "") : (form.description_md_en || "")}
                      onChange={e => {
                        const val = e.target.value;
                        if (mdLangTab === "am") setForm(prev => ({ ...prev, description_md_am: val }));
                        else setForm(prev => ({ ...prev, description_md_en: val }));
                      }}
                      placeholder={mdLangTab === "am" ? "## Հայերեն Markdown նկարագրություն..." : "## English Markdown description..."}
                      style={{ width: "100%", padding: "14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontFamily: "monospace", fontSize: "0.88rem", resize: "vertical", minHeight: "360px" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                      {mdLangTab === "am" ? "Նախադիտում (Հայերեն)" : "Preview (English)"}
                    </span>
                    <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0", overflowY: "auto", maxHeight: "420px", flex: 1 }}>
                      <MarkdownRenderer content={(mdLangTab === "am" ? form.description_md_am : form.description_md_en) || (mdLangTab === "am" ? "*Դատարկ է*" : "*Empty*")} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

          {/* TAB 2: REAL ANALYTICS & METRICS */}
          {hubTab === "analytics" && (
            <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* KPI Cards based on REAL DATA */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                {[
                  { label: "Իրական Դիտումներ (Views)", val: realAnalytics.totalViews.toLocaleString(), color: "#0284c7" },
                  { label: "Իրական Ներբեռնումներ (Downloads)", val: realAnalytics.totalDownloads.toLocaleString(), color: "#0d9488" },
                  { label: "Փոխարկման Տոկոս (Conversion)", val: `${realAnalytics.convRate}%`, color: "#16a34a" },
                  { label: "Միջին Գնահատական (Rating)", val: `${realAnalytics.avgRating} ★`, color: "#d97706" },
                ].map((card, i) => (
                  <div key={i} style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{card.label}</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                      {card.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Real Timeline Chart & OS Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
                <div style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginBottom: "16px" }}>
                    Դիտումների և Ներբեռնումների Իրական Դինամիկա (Վերջին 6 Ամիս)
                  </div>
                  <div style={{ height: "240px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={realAnalytics.chartTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <RechartsTooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#0f172a" }} />
                        <Line type="monotone" dataKey="views" name="Դիտումներ" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="downloads" name="Ներբեռնումներ" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginBottom: "16px" }}>
                    ԳՀ Բաշխվածություն (Իրական Տվյալներ)
                  </div>
                  <div style={{ height: "180px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={realAnalytics.osStats} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                          {realAnalytics.osStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "8px" }}>
                    {realAnalytics.osStats.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#475569" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span>{item.name}: {item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rating Breakdown based on REAL reviews */}
              <div style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginBottom: "16px" }}>
                  Գնահատականների Բաշխվածություն ({reviews.length} կարծիք)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {realAnalytics.ratingBreakdown.map((r) => (
                    <div key={r.stars} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ width: "40px", fontSize: "0.82rem", color: "#d97706", fontWeight: 700 }}>
                        {r.stars} ★
                      </span>
                      <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${r.percent}%`, height: "100%", background: "#0d9488", borderRadius: "4px" }} />
                      </div>
                      <span style={{ width: "60px", fontSize: "0.78rem", color: "#64748b", textAlign: "right" }}>
                        {r.count} ({r.percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUG REPORTS */}
          {hubTab === "reports" && (
            <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#ffffff",
                padding: "16px 20px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0"
              }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Սխալների Զեկույցներ և Խնդիրներ ({bugReports.length})
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Օգտատերերի կողմից ուղարկված խնդիրներ
                  </span>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  {["all", "new", "investigating", "resolved", "closed"].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setActiveReportFilter(st)}
                      style={{
                        padding: "6px 12px",
                        background: activeReportFilter === st ? "#0f172a" : "#f1f5f9",
                        color: activeReportFilter === st ? "#ffffff" : "#475569",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        cursor: "pointer"
                      }}
                    >
                      {st === "all" ? "Բոլորը" : st === "new" ? "Նոր" : st === "investigating" ? "Ընթացքի մեջ" : st === "resolved" ? "Լուծված" : "Փակված"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {bugReports
                  .filter(r => activeReportFilter === "all" || r.status === activeReportFilter)
                  .map(report => (
                    <div
                      key={report.id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "18px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.98rem", color: "#0f172a" }}>
                              {report.subject || "Անանուն Զեկույց"}
                            </span>
                            <span style={{
                              fontSize: "0.72rem",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: report.status === "new" ? "#fef2f2" : report.status === "resolved" ? "#ecfdf5" : "#fffbeb",
                              color: report.status === "new" ? "#dc2626" : report.status === "resolved" ? "#059669" : "#d97706",
                              fontWeight: 700
                            }}>
                              {report.status}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                            Ուղարկող՝ {report.user_name} ({report.user_email}) • ԳՀ: {report.os || "Անհայտ"} • v{report.version || form.version}
                          </div>
                        </div>

                        <select
                          value={report.status}
                          disabled={statusUpdatingId === report.id}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            if (!token) return;
                            setStatusUpdatingId(report.id);
                            try {
                              const res = await fetch(`/api/apps/bug-reports`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json", Authorization: token },
                                body: JSON.stringify({ id: report.id, status: newStatus }),
                              });
                              if (res.ok) {
                                setBugReports(prev => prev.map(r => r.id === report.id ? { ...r, status: newStatus as any } : r));
                              }
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setStatusUpdatingId(null);
                            }
                          }}
                          style={{
                            padding: "6px 10px",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            color: "#0f172a",
                            fontSize: "0.8rem",
                            fontWeight: 600
                          }}
                        >
                          <option value="new">Նոր (New)</option>
                          <option value="investigating">Ուսումնասիրվում է</option>
                          <option value="resolved">Լուծված (Resolved)</option>
                          <option value="closed">Փակված (Closed)</option>
                        </select>
                      </div>

                      <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", color: "#334155", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "10px" }}>
                        {report.description}
                      </div>

                      {/* Media files */}
                      {report.media_files && report.media_files.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Կցված պատկերներ՝</span>
                          {report.media_files.map((m, mi) => (
                            <img
                              key={mi}
                              src={m}
                              alt="Attachment"
                              onClick={() => setLightboxImg(m)}
                              style={{ width: "44px", height: "44px", borderRadius: "6px", objectFit: "cover", cursor: "pointer", border: "1px solid #cbd5e1" }}
                            />
                          ))}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="text"
                          defaultValue={report.admin_notes || ""}
                          placeholder="Ադմինի նշումներ..."
                          onBlur={async (e) => {
                            const notes = e.target.value;
                            if (!token) return;
                            setSavingNoteId(report.id);
                            try {
                              const res = await fetch(`/api/apps/bug-reports`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json", Authorization: token },
                                body: JSON.stringify({ id: report.id, admin_notes: notes }),
                              });
                              if (res.ok) {
                                setBugReports(prev => prev.map(r => r.id === report.id ? { ...r, admin_notes: notes } : r));
                              }
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setSavingNoteId(null);
                            }
                          }}
                          style={{ flex: 1, padding: "6px 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.8rem" }}
                        />
                        {savingNoteId === report.id && (
                          <span style={{ fontSize: "0.75rem", color: "#059669" }}>Պահպանվեց ✓</span>
                        )}
                      </div>
                    </div>
                  ))}

                {bugReports.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                    Այս հավելվածի համար դեռևս սխալների զեկույցներ չկան:
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REVIEWS */}
          {hubTab === "reviews" && (
            <div className="admin-tab-transition" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "#ffffff",
                padding: "16px 20px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0"
              }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Օգտատերերի Կարծիքներ և Գնահատականներ ({reviews.length})
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {reviews.map(review => (
                  <div
                    key={review.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "18px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>
                          {review.user_name || "Անանուն"}
                        </span>
                        <span style={{ color: "#d97706", fontSize: "0.85rem", fontWeight: 700 }}>
                          {"★".repeat(review.rating || 5)}
                        </span>
                        <span style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: review.status === "approved" ? "#ecfdf5" : review.status === "rejected" ? "#fef2f2" : "#fffbeb",
                          color: review.status === "approved" ? "#059669" : review.status === "rejected" ? "#dc2626" : "#d97706",
                          fontWeight: 700
                        }}>
                          {review.status}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        {review.status !== "approved" && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!token) return;
                              try {
                                const res = await fetch(`/api/apps/reviews`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json", Authorization: token },
                                  body: JSON.stringify({ id: review.id, status: "approved" }),
                                });
                                if (res.ok) setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: "approved" } : r));
                              } catch (e) {}
                            }}
                            style={{ padding: "5px 10px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", color: "#059669", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                          >
                            Հաստատել
                          </button>
                        )}
                        {review.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!token) return;
                              try {
                                const res = await fetch(`/api/apps/reviews`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json", Authorization: token },
                                  body: JSON.stringify({ id: review.id, status: "rejected" }),
                                });
                                if (res.ok) setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: "rejected" } : r));
                              } catch (e) {}
                            }}
                            style={{ padding: "5px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", color: "#d97706", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                          >
                            Մերժել
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Ջնջե՞լ այս կարծիքը:")) return;
                            if (!token) return;
                            try {
                              const res = await fetch(`/api/apps/reviews?id=${review.id}`, {
                                method: "DELETE",
                                headers: { Authorization: token },
                              });
                              if (res.ok) setReviews(prev => prev.filter(r => r.id !== review.id));
                            } catch (e) {}
                          }}
                          style={{ padding: "5px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#dc2626", fontSize: "0.78rem", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div style={{ color: "#334155", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {review.comment}
                    </div>
                  </div>
                ))}

                {reviews.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                    Այս հավելվածի համար դեռևս կարծիքներ չկան:
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REAL DOWNLOAD LOGS */}
          {hubTab === "logs" && (
            <div className="admin-tab-transition" style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}>
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Իրական Ներբեռնումների Լոգ ({downloadLogs.length})
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Տվյալ հավելվածի իրական ներբեռնումների ժամանակագրություն
                  </span>
                </div>
              </div>

              {downloadLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px", color: "#64748b", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                  Ներբեռնումների գրանցումներ դեռ չկան:
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                      <th style={{ padding: "10px 14px" }}>Ամսաթիվ / Ժամ</th>
                      <th style={{ padding: "10px 14px" }}>IP Հասցե</th>
                      <th style={{ padding: "10px 14px" }}>Գործավար Համակարգ</th>
                      <th style={{ padding: "10px 14px" }}>Ֆայլ</th>
                      <th style={{ padding: "10px 14px" }}>Կարգավիճակ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downloadLogs.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", color: "#334155" }}>
                        <td style={{ padding: "10px 14px" }}>{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</td>
                        <td style={{ padding: "10px 14px", fontFamily: "monospace" }}>{item.ip_address}</td>
                        <td style={{ padding: "10px 14px" }}>{item.os || (item.user_agent ? (item.user_agent.includes('Win') ? 'Windows' : (item.user_agent.includes('Mac') ? 'macOS' : (item.user_agent.includes('Linux') ? 'Linux' : 'Other'))) : 'Unknown')}</td>
                        <td style={{ padding: "10px 14px", color: "#0f172a", fontWeight: 600 }}>{item.download_url ? item.download_url.split('/').pop() : 'Package'}</td>
                        <td style={{ padding: "10px 14px", color: item.is_spam ? "#dc2626" : "#059669", fontWeight: 600 }}>
                          {item.is_spam ? `Սպամ (${item.spam_reason || 'Bot'})` : 'Հաջողված'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      )}

      {/* Media Picker Modal */}
      {mediaPickerConfig?.isOpen && (
        <MediaPickerModal
          isOpen={true}
          token={token}
          multiple={mediaPickerConfig.multiple}
          allowedTypes={mediaPickerConfig.allowedTypes}
          title={mediaPickerConfig.title}
          currentValue={mediaPickerConfig.currentValue}
          onClose={() => setMediaPickerConfig(null)}
          onSelect={handleMediaPickerSelect}
        />
      )}

      {/* Lightbox Preview */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}
        >
          <img src={lightboxImg} alt="Enlarged" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "10px" }} />
        </div>
      )}

    </div>
  );
}
