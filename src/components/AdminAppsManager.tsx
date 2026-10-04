"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import MarkdownRenderer from "./MarkdownRenderer";
import { HDesignStars } from "./RatingSystem";
import MediaPickerModal from "./MediaPickerModal";
import SoftwareIcon from "./SoftwareIcon";
import FolderIcon from "./FolderIcon";
import { MediaFileType } from "@/lib/mediaTypes";
import { prefetchMediaLibrary } from "@/lib/mediaCache";

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
  supported_os?: ('windows' | 'macos' | 'linux')[];
  is_paid: boolean;
  price: number;
  currency?: string;
  download_url?: string;
  downloads?: AppDownloadOption[];
  store_url?: string;
  repository_url?: string;
  repository_type?: string;
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

const OS_PRESETS: { key: 'windows' | 'macos' | 'linux'; label: string; icon: string }[] = [
  { key: 'windows', label: 'Windows', icon: '/icons/windows.svg' },
  { key: 'macos', label: 'macOS', icon: '/icons/apple.svg' },
  { key: 'linux', label: 'Linux', icon: '/icons/linux.svg' }
];

const PLATFORM_PRESETS = [
  { name: 'Windows (x64 / ARM)', icon: '/icons/windows.svg' },
  { name: 'macOS (Universal / Apple Silicon)', icon: '/icons/apple.svg' },
  { name: 'Linux (AppImage / Deb / RPM)', icon: '/icons/linux.svg' },
  { name: 'Web / Browser Extension', icon: '/icons/browser.svg' }
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
  const [notifySubscribers, setNotifySubscribers] = useState(true);

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
    host_app: "",
    host_app_icon: "/icons/illustrator.svg",
    app_type: "plugin",
    supported_os: [],
    is_paid: false,
    price: 0,
    currency: "AMD",
    download_url: "",
    downloads: [],
    store_url: "",
    repository_url: "",
    repository_type: "github",
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
  const itemFileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadItemIndex, setCurrentUploadItemIndex] = useState<number | null>(null);
  const hostIconInputRef = useRef<HTMLInputElement>(null);

  // Media Picker Popup Modal state
  const [mediaPickerConfig, setMediaPickerConfig] = useState<{
    isOpen: boolean;
    target: 'cover' | 'gallery' | 'download' | 'host_icon' | 'download_item';
    itemIndex?: number;
    multiple?: boolean;
    allowedTypes?: MediaFileType[];
    title?: string;
    currentValue?: string | string[];
  } | null>(null);

  const handleMediaPickerSelect = (selected: string | string[]) => {
    if (!mediaPickerConfig) return;
    const { target, itemIndex } = mediaPickerConfig;

    if (target === 'gallery') {
      const urls = Array.isArray(selected) ? selected : [selected];
      setEditingApp(prev => {
        const updated = Array.from(new Set([...prev.gallery_images, ...urls]));
        return {
          ...prev,
          gallery_images: updated,
          cover_image: prev.cover_image || updated[0] || ""
        };
      });
    } else if (target === 'cover') {
      const url = Array.isArray(selected) ? selected[0] : selected;
      if (url) {
        setEditingApp(prev => ({
          ...prev,
          cover_image: url,
          gallery_images: prev.gallery_images.includes(url) ? prev.gallery_images : [url, ...prev.gallery_images]
        }));
      }
    } else if (target === 'download') {
      const url = Array.isArray(selected) ? selected[0] : selected;
      if (url) {
        setEditingApp(prev => ({ ...prev, download_url: url }));
      }
    } else if (target === 'download_item' && itemIndex !== undefined) {
      const url = Array.isArray(selected) ? selected[0] : selected;
      if (url) {
        setEditingApp(prev => {
          const list = [...(prev.downloads || [])];
          if (list[itemIndex]) {
            list[itemIndex] = { ...list[itemIndex], url };
          }
          return {
            ...prev,
            downloads: list,
            download_url: prev.download_url || url
          };
        });
      }
    } else if (target === 'host_icon') {
      const url = Array.isArray(selected) ? selected[0] : selected;
      if (url) {
        setEditingApp(prev => ({ ...prev, host_app_icon: url }));
      }
    }

    setMediaPickerConfig(null);
  };

  // Resilient Auth Header Helper
  const getAuthToken = useCallback(() => {
    return token || (typeof window !== 'undefined' ? localStorage.getItem('hdesign_admin_token') : '') || '';
  }, [token]);

  const getAuthHeaders = useCallback((extra: Record<string, string> = {}) => {
    const t = getAuthToken();
    return {
      ...(t ? { Authorization: t.startsWith('Bearer ') ? t : `Bearer ${t}` } : {}),
      ...extra
    };
  }, [getAuthToken]);

  // Load apps, reviews & bug reports
  const loadData = async () => {
    setLoading(true);
    try {
      const authHeader = getAuthHeaders();
      const [appsRes, revRes, bugRes] = await Promise.all([
        fetch("/api/apps?include_drafts=true", {
          headers: authHeader
        }),
        fetch("/api/apps/reviews?all=true", {
          headers: authHeader
        }),
        fetch("/api/apps/bug-reports", {
          headers: authHeader
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
    const t = getAuthToken();
    if (t) prefetchMediaLibrary(t);
    loadData();
  }, [token, getAuthToken]);

  // Update bug report status
  const handleUpdateBugStatus = async (id: string, newStatus: 'new' | 'investigating' | 'resolved' | 'closed') => {
    try {
      const res = await fetch("/api/apps/bug-reports", {
        method: "PATCH",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id, admin_notes: reportAdminNotes })
      });
      if (res.ok) {
        setBugReports(prev => prev.map(r => r.id === id ? { ...r, admin_notes: reportAdminNotes } : r));
        if (selectedBugReport && selectedBugReport.id === id) {
          setSelectedBugReport(prev => prev ? { ...prev, admin_notes: reportAdminNotes } : null);
        }
        alert("Նշումները հաջողությամբ պահվեցին:");
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
        headers: getAuthHeaders()
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
      host_app: "",
      host_app_icon: "/icons/illustrator.svg",
      app_type: "plugin",
      supported_os: [],
      is_paid: false,
      price: 0,
      currency: "AMD",
      download_url: "",
      downloads: [],
      store_url: "",
      repository_url: "",
      repository_type: "github",
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
    setNotifySubscribers(true);
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

    let downloadsList: AppDownloadOption[] = [];
    if (Array.isArray(app.downloads)) {
      downloadsList = app.downloads;
    } else if (typeof (app as any).downloads === 'string' && (app as any).downloads.trim()) {
      try {
        downloadsList = JSON.parse((app as any).downloads);
      } catch (e) {
        downloadsList = [];
      }
    }
    // Purge any legacy placeholder or dummy example.com downloads
    downloadsList = downloadsList.filter(d => !d.url?.includes('example.com'));

    const detectedOS: ('windows' | 'macos' | 'linux')[] = [];
    if (Array.isArray(app.supported_os) && app.supported_os.length > 0) {
      app.supported_os.forEach((o: any) => {
        const lo = String(o).toLowerCase();
        if (['windows', 'macos', 'linux'].includes(lo) && !detectedOS.includes(lo as any)) {
          detectedOS.push(lo as any);
        }
      });
    } else {
      downloadsList.forEach(d => {
        if (d.os && ['windows', 'macos', 'linux'].includes(d.os.toLowerCase()) && !detectedOS.includes(d.os.toLowerCase() as any)) {
          detectedOS.push(d.os.toLowerCase() as any);
        } else if (d.name) {
          const n = d.name.toLowerCase();
          if (n.includes('win') && !detectedOS.includes('windows')) detectedOS.push('windows');
          if (n.includes('mac') && !detectedOS.includes('macos')) detectedOS.push('macos');
          if (n.includes('linux') && !detectedOS.includes('linux')) detectedOS.push('linux');
        }
      });
    }
    if (detectedOS.length === 0 && app.app_type === 'plugin' && app.host_app) {
      detectedOS.push('windows');
    }

    setEditingApp({
      id: app.id || "",
      title_am: app.title_am || "",
      title_en: app.title_en || "",
      short_desc_am: app.short_desc_am || "",
      short_desc_en: app.short_desc_en || "",
      description_md_am: app.description_md_am || "",
      description_md_en: app.description_md_en || "",
      host_app: app.host_app || "",
      host_app_icon: app.host_app_icon || "/icons/illustrator.svg",
      app_type: app.app_type || "plugin",
      supported_os: detectedOS,
      is_paid: !!app.is_paid,
      price: app.price ?? 0,
      currency: app.currency || "AMD",
      download_url: app.download_url || "",
      downloads: downloadsList,
      store_url: app.store_url || "",
      repository_url: app.repository_url || "",
      repository_type: app.repository_type || "github",
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
    setNotifySubscribers(true);
    setIsEditing(true);
  };

  // OS selection helpers
  const selectedOSList: ('windows' | 'macos' | 'linux')[] = React.useMemo(() => {
    if (editingApp.supported_os && Array.isArray(editingApp.supported_os) && editingApp.supported_os.length > 0) {
      return editingApp.supported_os;
    }
    const detected: ('windows' | 'macos' | 'linux')[] = [];
    (editingApp.downloads || []).filter(d => !!d.url?.trim()).forEach(d => {
      if (d.os && ['windows', 'macos', 'linux'].includes(d.os as any) && !detected.includes(d.os as any)) {
        detected.push(d.os as any);
      } else if (d.name) {
        const n = d.name.toLowerCase();
        if (n.includes('win') && !detected.includes('windows')) detected.push('windows');
        if (n.includes('mac') && !detected.includes('macos')) detected.push('macos');
        if (n.includes('linux') && !detected.includes('linux')) detected.push('linux');
      }
    });
    return detected;
  }, [editingApp.supported_os, editingApp.downloads]);

  const handleToggleOS = (osKey: 'windows' | 'macos' | 'linux') => {
    const isSelected = selectedOSList.includes(osKey);
    const nextOSList = isSelected
      ? selectedOSList.filter(o => o !== osKey)
      : [...selectedOSList, osKey];

    setEditingApp(prev => {
      let nextDownloads = [...(prev.downloads || [])];

      if (prev.app_type === 'standalone') {
        if (!isSelected) {
          const hasOS = nextDownloads.some(d => d.os === osKey);
          if (!hasOS) {
            const osLabel = osKey === 'windows' ? 'Windows' : (osKey === 'macos' ? 'macOS' : 'Linux');
            const osIcon = osKey === 'windows' ? '/icons/windows.svg' : (osKey === 'macos' ? '/icons/apple.svg' : '/icons/linux.svg');
            nextDownloads.push({
              id: 'dl-' + Math.random().toString(36).substring(2, 7),
              name: `${osLabel} Installer`,
              url: '',
              icon: osIcon,
              os: osKey,
              version: prev.version || 'v1.0.0'
            });
          }
        } else {
          nextDownloads = nextDownloads.filter(d => {
            if (d.os === osKey && !d.url?.trim()) return false;
            return true;
          });
        }
      } else {
        // Plugin
        if (!isSelected) {
          selectedSoftwareList.forEach(sw => {
            const hasSlot = nextDownloads.some(d => d.os === osKey && ((d.host_app && d.host_app.toLowerCase() === sw.toLowerCase()) || d.name.toLowerCase().includes(sw.toLowerCase())));
            if (!hasSlot) {
              const matchedPreset = SOFTWARE_PRESETS.find(p => p.name.toLowerCase() === sw.toLowerCase());
              const osLabel = osKey === 'windows' ? 'Windows' : (osKey === 'macos' ? 'macOS' : 'Linux');
              nextDownloads.push({
                id: 'dl-' + Math.random().toString(36).substring(2, 7),
                name: `${sw} (${osLabel})`,
                url: '',
                icon: matchedPreset ? matchedPreset.icon : (osKey === 'macos' ? '/icons/apple.svg' : osKey === 'linux' ? '/icons/linux.svg' : '/icons/windows.svg'),
                os: osKey,
                host_app: sw,
                version: prev.version || 'v1.0.0'
              });
            }
          });
        } else {
          nextDownloads = nextDownloads.filter(d => {
            if (d.os === osKey && !d.url?.trim()) return false;
            return true;
          });
        }
      }

      return {
        ...prev,
        supported_os: nextOSList,
        downloads: nextDownloads
      };
    });
  };

  // Download options helpers
  const handleSyncDownloadsWithSelectedSoftware = () => {
    setEditingApp(prev => {
      const currentList = prev.downloads || [];
      const newItems = [...currentList];
      const activeOS: ('windows' | 'macos' | 'linux')[] = selectedOSList.length > 0 ? selectedOSList : ['windows'];

      selectedSoftwareList.forEach(sw => {
        const swPreset = SOFTWARE_PRESETS.find(p => p.name.toLowerCase() === sw.toLowerCase());
        activeOS.forEach(osKey => {
          const hasSlot = newItems.some(d => d.os === osKey && ((d.host_app && d.host_app.toLowerCase() === sw.toLowerCase()) || d.name.toLowerCase().includes(sw.toLowerCase())));
          if (!hasSlot) {
            const osLabel = osKey === 'windows' ? 'Windows' : (osKey === 'macos' ? 'macOS' : 'Linux');
            newItems.push({
              id: 'dl-' + Math.random().toString(36).substring(2, 7),
              name: `${sw} (${osLabel})`,
              url: '',
              icon: swPreset ? swPreset.icon : (osKey === 'macos' ? '/icons/apple.svg' : osKey === 'linux' ? '/icons/linux.svg' : '/icons/windows.svg'),
              os: osKey,
              host_app: sw,
              version: prev.version || 'v1.0.0'
            });
          }
        });
      });

      return { ...prev, downloads: newItems };
    });
  };

  const handleAddDownloadOption = (presetName?: string, presetIcon?: string, osKey?: 'windows' | 'macos' | 'linux' | 'other', hostApp?: string) => {
    setEditingApp(prev => ({
      ...prev,
      downloads: [
        ...(prev.downloads || []),
        {
          id: 'dl-' + Math.random().toString(36).substring(2, 7),
          name: presetName || "Նիշք",
          url: "",
          icon: presetIcon || (osKey === 'macos' ? "/icons/apple.svg" : osKey === 'linux' ? "/icons/linux.svg" : "/icons/windows.svg"),
          os: osKey || (selectedOSList[0] || 'windows'),
          host_app: hostApp || (selectedSoftwareList[0] || undefined)
        }
      ]
    }));
  };

  const handleAddDownloadOptionForHostApp = (osKey: 'windows' | 'macos' | 'linux', hostAppName: string) => {
    const swPreset = SOFTWARE_PRESETS.find(p => p.name.toLowerCase() === hostAppName.toLowerCase());
    const osLabel = osKey === 'windows' ? 'Windows' : (osKey === 'macos' ? 'macOS' : 'Linux');
    setEditingApp(prev => ({
      ...prev,
      downloads: [
        ...(prev.downloads || []),
        {
          id: 'dl-' + Math.random().toString(36).substring(2, 7),
          name: `${hostAppName} (${osLabel})`,
          url: '',
          icon: swPreset ? swPreset.icon : (osKey === 'macos' ? '/icons/apple.svg' : osKey === 'linux' ? '/icons/linux.svg' : '/icons/windows.svg'),
          os: osKey,
          host_app: hostAppName,
          version: prev.version || 'v1.0.0'
        }
      ]
    }));
  };

  const handleRemoveDownloadOption = (index: number) => {
    setEditingApp(prev => {
      const next = (prev.downloads || []).filter((_, i) => i !== index);
      return { ...prev, downloads: next };
    });
  };

  const handleUpdateDownloadOption = (index: number, updates: Partial<AppDownloadOption>) => {
    setEditingApp(prev => {
      const next = [...(prev.downloads || [])];
      if (next[index]) {
        next[index] = { ...next[index], ...updates };
      }
      return { ...prev, downloads: next };
    });
  };

  const triggerItemFileUpload = (idx: number) => {
    setCurrentUploadItemIndex(idx);
    itemFileInputRef.current?.click();
  };

  const handleItemFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUploadItemIndex === null) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const url = await uploadFile(file, "apps");
      const fileSizeStr = file.size
        ? (file.size >= 1024 * 1024 * 1024
            ? `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
            : file.size >= 1024 * 1024
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${Math.round(file.size / 1024)} KB`)
        : "";
      setEditingApp(prev => {
        const list = [...(prev.downloads || [])];
        if (list[currentUploadItemIndex]) {
          list[currentUploadItemIndex] = {
            ...list[currentUploadItemIndex],
            url,
            file_size: fileSizeStr || list[currentUploadItemIndex].file_size
          };
        }
        return {
          ...prev,
          downloads: list,
          download_url: prev.download_url || url
        };
      });
      alert("Նիշքը հաջողությամբ բեռնվեց:");
    } catch (err: any) {
      alert("Նիշքի բեռնումը ձախողվեց: " + err.message);
    } finally {
      setUploadingFile(false);
      setCurrentUploadItemIndex(null);
      e.target.value = "";
    }
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
    
    setEditingApp(p => {
      let nextDownloads = [...(p.downloads || [])];
      const activeOS: ('windows' | 'macos' | 'linux')[] = selectedOSList.length > 0 ? selectedOSList : ['windows'];

      if (!exists) {
        // Adding software -> create slots for each selected OS
        const swPreset = SOFTWARE_PRESETS.find(pr => pr.name.toLowerCase() === name.toLowerCase());
        activeOS.forEach(osKey => {
          const hasSlot = nextDownloads.some(d => d.os === osKey && ((d.host_app && d.host_app.toLowerCase() === name.toLowerCase()) || d.name.toLowerCase().includes(name.toLowerCase())));
          if (!hasSlot) {
            const osLabel = osKey === 'windows' ? 'Windows' : (osKey === 'macos' ? 'macOS' : 'Linux');
            nextDownloads.push({
              id: 'dl-' + Math.random().toString(36).substring(2, 7),
              name: `${name} (${osLabel})`,
              url: '',
              icon: swPreset ? swPreset.icon : (osKey === 'macos' ? '/icons/apple.svg' : osKey === 'linux' ? '/icons/linux.svg' : '/icons/windows.svg'),
              os: osKey,
              host_app: name,
              version: p.version || 'v1.0.0'
            });
          }
        });
      } else {
        // Removing software -> remove download rows for this host_app that have no url filled
        nextDownloads = nextDownloads.filter(d => {
          const isThisApp = (d.host_app && d.host_app.toLowerCase() === name.toLowerCase()) ||
                            (d.name && d.name.toLowerCase().includes(name.toLowerCase()));
          if (isThisApp && !d.url?.trim()) {
            return false;
          }
          return true;
        });
      }

      return {
        ...p,
        host_app: nextList.join(', '),
        host_app_icon: matchedPreset ? matchedPreset.icon : p.host_app_icon,
        downloads: nextDownloads
      };
    });
  };

  const handleAddCustomSoftware = () => {
    const val = customSoftwareInput.trim();
    if (!val) return;
    const exists = selectedSoftwareList.some(s => s.toLowerCase() === val.toLowerCase());
    if (!exists) {
      const nextList = [...selectedSoftwareList, val];
      setEditingApp(p => {
        let nextDownloads = [...(p.downloads || [])];
        const activeOS: ('windows' | 'macos' | 'linux')[] = selectedOSList.length > 0 ? selectedOSList : ['windows'];
        activeOS.forEach(osKey => {
          const osLabel = osKey === 'windows' ? 'Windows' : (osKey === 'macos' ? 'macOS' : 'Linux');
          nextDownloads.push({
            id: 'dl-' + Math.random().toString(36).substring(2, 7),
            name: `${val} (${osLabel})`,
            url: '',
            icon: (osKey === 'macos' ? '/icons/apple.svg' : osKey === 'linux' ? '/icons/linux.svg' : '/icons/windows.svg'),
            os: osKey,
            host_app: val,
            version: p.version || 'v1.0.0'
          });
        });
        return {
          ...p,
          host_app: nextList.join(', '),
          downloads: nextDownloads
        };
      });
    }
    setCustomSoftwareInput("");
  };

  const handleRemoveSoftware = (name: string) => {
    const nextList = selectedSoftwareList.filter(s => s.toLowerCase() !== name.toLowerCase());
    setEditingApp(p => {
      const nextDownloads = (p.downloads || []).filter(d => {
        const isThisApp = (d.host_app && d.host_app.toLowerCase() === name.toLowerCase()) ||
                          (d.name && d.name.toLowerCase().includes(name.toLowerCase()));
        if (isThisApp && !d.url?.trim()) {
          return false;
        }
        return true;
      });
      return {
        ...p,
        host_app: nextList.join(', '),
        downloads: nextDownloads
      };
    });
  };

  // Upload file helper
  const uploadFile = async (file: File, folder = "apps") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: getAuthHeaders(),
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
  const handleSaveApp = async (e?: React.FormEvent | React.MouseEvent, overrideStatus?: 'published' | 'draft') => {
    if (e) {
      if (typeof (e as any).preventDefault === 'function') (e as any).preventDefault();
      if (typeof (e as any).stopPropagation === 'function') (e as any).stopPropagation();
    }

    const nextStatus = overrideStatus || editingApp.status || (editingApp.is_draft ? 'draft' : 'published');
    const isDraft = nextStatus === 'draft';

    // Only enforce mandatory fields if PUBLISHING
    if (!isDraft) {
      if (!editingApp.title_am?.trim() || !editingApp.title_en?.trim()) {
        alert("Հրապարակելու համար խնդրում ենք լրացնել հավելվածի անվանումը (Հայերեն և Անգլերեն):");
        return;
      }
      if (selectedOSList.length === 0) {
        alert("Հրապարակելու համար խնդրում ենք նշել առնվազն մեկ Օպերացիոն Համակարգ (Windows, macOS կամ Linux):");
        return;
      }
      if (editingApp.app_type === 'plugin' && !editingApp.host_app?.trim()) {
        alert("Հրապարակելու համար խնդրում ենք նշել առնվազն մեկ հավելված (Software):");
        return;
      }
    }

    const finalId = editingApp.id?.trim() || ("app-" + Math.random().toString(36).substring(2, 8));
    const finalTitleAm = editingApp.title_am?.trim() || editingApp.title_en?.trim() || (isDraft ? "Անանուն սևագիր" : "");
    const finalTitleEn = editingApp.title_en?.trim() || editingApp.title_am?.trim() || (isDraft ? "Untitled Draft" : "");
    const validDownloadsList = (editingApp.downloads || []).filter(d => !!d.url?.trim() && !d.url.includes('example.com'));
    const validFirst = validDownloadsList[0];
    const finalDownloadUrl = (editingApp.download_url && !editingApp.download_url.includes('example.com'))
      ? editingApp.download_url
      : (validFirst?.url || "");

    const appToSave: AppItem = {
      ...editingApp,
      id: finalId,
      title_am: finalTitleAm,
      title_en: finalTitleEn,
      is_draft: isDraft,
      status: nextStatus,
      supported_os: selectedOSList,
      languages: selectedLanguagesList,
      download_url: finalDownloadUrl,
      downloads: validDownloadsList,
      created_at: editingApp.created_at,
      updated_at: new Date().toISOString()
    };

    setSavingApp(true);
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          ...appToSave,
          notify_subscribers: notifySubscribers
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save app");

      alert(isDraft ? "Հավելվածը հաջողությամբ պահվեց որպես սևագիր:" : "Հավելվածը հաջողությամբ պահվեց:");
      setIsEditing(false);
      await loadData();
    } catch (err: any) {
      alert("Սխալ պահելիս: " + err.message);
    } finally {
      setSavingApp(false);
    }
  };

  // Delete App
  const handleDeleteApp = async (id: string) => {
    if (!id) return;
    if (!confirm("Վստա՞հ եք, որ ցանկանում եք ջնջել այս հավելվածը:")) return;

    try {
      const res = await fetch(`/api/apps?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      setApps(prev => prev.filter(a => a.id !== id));
      if (editingApp.id === id) {
        setIsEditing(false);
      }
      alert("Հավելվածը հաջողությամբ ջնջվեց:");
      await loadData();
    } catch (err: any) {
      alert("Սխալ ջնջելիս: " + err.message);
    }
  };

  // Review Status update
  const handleUpdateReviewStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const res = await fetch("/api/apps/reviews", {
        method: "PATCH",
        headers: getAuthHeaders({
          "Content-Type": "application/json"
        }),
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
        headers: getAuthHeaders()
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
      (a.title_am || '').toLowerCase().includes(q) ||
      (a.title_en || '').toLowerCase().includes(q) ||
      (a.host_app && a.host_app.toLowerCase().includes(q)) ||
      (Array.isArray(a.languages) && a.languages.some(l => (l || '').toLowerCase().includes(q)))
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
                  <th style={{ padding: '14px 18px' }}>Վարկած</th>
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

                      {/* Version & Downloads */}
                      <td style={{ padding: '12px 18px', color: 'var(--muted)', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{app.version}</span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--accent)' }}>
                            {(app.downloads_count || 0).toLocaleString()} ներբեռնում
                          </span>
                        </div>
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
                            onClick={(e: any) => {
                              e.stopPropagation();
                              handleDeleteApp(app.id);
                            }}
                          >
                            <span
                              style={{ padding: '0 8px', cursor: 'pointer' }}
                              onClick={(e: any) => {
                                e.stopPropagation();
                                handleDeleteApp(app.id);
                              }}
                            >
                              Ջնջել
                            </span>
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
                      {rev.comment && rev.comment.trim() ? (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.92rem', color: 'var(--text)', lineHeight: '1.5' }}>
                          {rev.comment}
                        </p>
                      ) : (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                          (Միայն գնահատական՝ առանց մեկնաբանության)
                        </p>
                      )}

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
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span className="hd-icon icon-Attech" />
                            <span>{report.media_files.length} նիշք</span>
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
                          <span className="hd-icon icon-Cursor" style={{ marginRight: '4px' }} />
                          <strong>{report.user_name}</strong>
                        </span>
                        <span>
                          <span className="hd-icon icon-Mail" style={{ marginRight: '4px' }} />
                          <a href={`mailto:${report.user_email}?subject=Re: [Վրեպի Զեկույց] ${encodeURIComponent(report.subject)}`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{report.user_email}</a>
                        </span>
                        {report.admin_notes && (
                          <span style={{ color: '#d97706', fontStyle: 'italic' }}>
                            <span className="hd-icon icon-Info" style={{ marginRight: '4px' }} />
                            Նշում՝ {report.admin_notes}
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
          data-modal-backdrop="true"
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
            boxSizing: 'border-box',
            animation: 'modalBackdropFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditing(false);
            }
          }}
        >
          <div
            data-modal-container="true"
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
              position: 'relative',
              animation: 'modalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity'
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

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

              {/* Hidden file inputs for uploading files */}
              <input
                ref={downloadFileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleDownloadFileUpload}
              />
              <input
                ref={itemFileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleItemFileChange}
              />
              <input
                ref={hostIconInputRef}
                type="file"
                accept="image/*,.svg"
                style={{ display: 'none' }}
                onChange={handleHostIconUpload}
              />

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* BRANCH 1: ԽՐՎԱԿՆԵՐ (PLUGINS) FLOW - HIERARCHICAL / SUB-LISTS   */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {editingApp.app_type === 'plugin' && (
                <div
                  style={{
                    background: 'var(--bg)',
                    padding: '20px',
                    borderRadius: '16px',
                    border: `1.5px solid ${selectedOSList.length === 0 ? 'rgba(229, 57, 53, 0.4)' : 'var(--panel-border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px'
                  }}
                >
                  {/* Header: Mandatory OS Selection */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Օպերացիոն Համակարգեր (OS) և Հավելվածներ *</span>
                        <span style={{ fontSize: '0.75rem', color: '#e53935', fontWeight: 700 }}>(Պարտադիր)</span>
                      </label>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Ընտրեք ԳՀ-ն, բացված ենթացանկում ընտրեք համապատասխան հավելվածը և կցեք ներբեռնվող նյութերը:
                      </span>
                    </div>
                    {selectedOSList.length > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: 'rgba(74, 137, 124, 0.15)', color: 'var(--accent)' }}>
                        Ընտրված է {selectedOSList.length} ԳՀ
                      </span>
                    )}
                  </div>

                  {/* OS Selector Toggle Buttons */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {OS_PRESETS.map((os) => {
                      const isSelected = selectedOSList.includes(os.key);
                      return (
                        <button
                          key={os.key}
                          type="button"
                          onClick={() => handleToggleOS(os.key)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(74, 137, 124, 0.2)' : 'var(--panel)',
                            border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--panel-border)'}`,
                            color: isSelected ? 'var(--accent)' : 'var(--text)',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <SoftwareIcon name={os.label} iconUrl={os.icon} size={20} />
                          <span>{os.label}</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                            {isSelected ? '✓' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedOSList.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: '#e53935', background: 'rgba(229, 57, 53, 0.08)', padding: '12px 16px', borderRadius: '10px', fontWeight: 600 }}>
                      <span className="hd-icon icon-Warning" style={{ marginRight: 6 }} /> Խնդրում ենք նախ ընտրել առնվազն մեկ ԳՀ (Windows, macOS կամ Linux)՝ դրա տակ հավելվածների և նյութերի ենթացանկը բացելու համար:
                    </div>
                  ) : (
                    /* HIERARCHICAL TREE: Render per selected OS */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '6px' }}>
                      {selectedOSList.map((osKey) => {
                        const osPreset = OS_PRESETS.find(p => p.key === osKey) || { label: osKey, icon: '/icons/browser.svg' };
                        const isWin = osKey === 'windows';
                        const isMac = osKey === 'macos';
                        const isLinux = osKey === 'linux';
                        const osBorderColor = isWin ? 'rgba(33, 150, 243, 0.4)' : (isMac ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 193, 7, 0.4)');
                        const osAccentBg = isWin ? 'rgba(33, 150, 243, 0.1)' : (isMac ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 193, 7, 0.1)');

                        return (
                          <div
                            key={osKey}
                            style={{
                              background: 'var(--panel)',
                              borderRadius: '16px',
                              border: `1.5px solid ${osBorderColor}`,
                              padding: '18px 20px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                              boxShadow: 'var(--shadow)'
                            }}
                          >
                            {/* OS Tree Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: osAccentBg, padding: '6px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <SoftwareIcon name={osPreset.label} iconUrl={osPreset.icon} size={22} />
                                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>
                                    {osPreset.label}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                    (Ընտրեք հավելվածները {osPreset.label}-ի համար)
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleOS(osKey)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--muted)',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                Անջատել {osPreset.label}-ը
                              </button>
                            </div>

                            {/* Sub-level 1: Host Apps selection grid for this OS */}
                            <div>
                              <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
                                ↳ Ընտրեք հավելվածները {osPreset.label}-ում՝
                              </label>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                                {SOFTWARE_PRESETS.map((item) => {
                                  const isSelected = selectedSoftwareList.some(s => s.toLowerCase() === item.name.toLowerCase());
                                  return (
                                    <div
                                      key={item.name}
                                      onClick={() => handleToggleSoftware(item.name)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        padding: '7px 10px',
                                        borderRadius: '8px',
                                        background: isSelected ? 'rgba(74, 137, 124, 0.15)' : 'var(--bg)',
                                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--panel-border)'}`,
                                        color: isSelected ? 'var(--accent)' : 'var(--text)',
                                        fontSize: '0.8rem',
                                        fontWeight: isSelected ? 700 : 500,
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      <hd-checkbox
                                        suppressHydrationWarning
                                        checked={isSelected}
                                        data-thickness="2px"
                                        data-size="14px"
                                        onChange={() => handleToggleSoftware(item.name)}
                                      />
                                      <SoftwareIcon name={item.name} iconUrl={item.icon} size={15} />
                                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Custom Software Input for this OS */}
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                                <div style={{ flex: 1 }}>
                                  <hd-input
                                    suppressHydrationWarning
                                    placeholder={`+ Այլ հավելված (օր․՝ CorelDRAW, Cinema 4D)...`}
                                    value={customSoftwareInput}
                                    onInput={(e: any) => setCustomSoftwareInput(e.target.value)}
                                    data-width="100%"
                                    data-height="34px"
                                    data-thickness="2px"
                                    data-font-size="11pt"
                                  />
                                </div>
                                <hd-button
                                  suppressHydrationWarning
                                  data-height="34px"
                                  data-thickness="2px"
                                  data-font-size="0.78rem"
                                  data-color="var(--accent)"
                                  data-text-color="#ffffff"
                                  onClick={handleAddCustomSoftware}
                                >
                                  <span style={{ padding: '0 12px' }}>Ավելացնել</span>
                                </hd-button>
                              </div>

                              {customSoftwareTags.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
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
                                        fontSize: '0.76rem',
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

                            {/* Sub-level 2: Nested Material upload for each selected host app under this OS */}
                            {selectedSoftwareList.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px', borderTop: '1px dashed var(--panel-border)', paddingTop: '14px' }}>
                                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)' }}>
                                  ↳ Բուն ծրագրային նիշքեր {osPreset.label}-ի համար ըստ հավելվածի՝
                                </span>

                                {selectedSoftwareList.map((swName) => {
                                  const swPreset = SOFTWARE_PRESETS.find(p => p.name.toLowerCase() === swName.toLowerCase());
                                  // Find downloads matching this OS and this host app
                                  const appDownloads = (editingApp.downloads || []).map((dl, originalIdx) => ({ dl, originalIdx })).filter(({ dl }) => {
                                    const matchOS = (dl.os === osKey) || (!dl.os && osKey === 'windows');
                                    const matchApp = (dl.host_app && dl.host_app.toLowerCase() === swName.toLowerCase()) ||
                                                     (dl.name && dl.name.toLowerCase().includes(swName.toLowerCase()));
                                    return matchOS && matchApp;
                                  });

                                  return (
                                    <div
                                      key={swName}
                                      style={{
                                        background: 'var(--bg)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--panel-border)',
                                        padding: '14px 16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                      }}
                                    >
                                      {/* Sub-branch Header: Host App title */}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <SoftwareIcon name={swName} iconUrl={swPreset?.icon} size={20} />
                                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>
                                            {swName}
                                          </span>
                                          <span style={{ fontSize: '0.72rem', background: 'var(--panel)', padding: '2px 8px', borderRadius: '6px', color: 'var(--muted)', border: '1px solid var(--panel-border)' }}>
                                            {osPreset.label}
                                          </span>
                                        </div>

                                        <hd-button
                                          suppressHydrationWarning
                                          data-height="28px"
                                          data-thickness="2px"
                                          data-font-size="0.74rem"
                                          data-color="rgba(74, 137, 124, 0.15)"
                                          data-text-color="var(--accent)"
                                          onClick={() => handleAddDownloadOptionForHostApp(osKey, swName)}
                                        >
                                          <span style={{ padding: '0 8px', fontWeight: 700 }}>
                                            + Ավելացնել նիշք
                                          </span>
                                        </hd-button>
                                      </div>

                                      {/* Download Slots under this Host App and OS */}
                                      {appDownloads.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                          {appDownloads.map(({ dl, originalIdx }, subIdx) => (
                                            <div
                                              key={dl.id || originalIdx}
                                              style={{
                                                background: 'var(--panel)',
                                                border: '1px solid var(--panel-border)',
                                                borderRadius: '10px',
                                                padding: '12px 14px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '10px'
                                              }}
                                            >
                                              {/* Download item row: info & delete */}
                                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', background: 'rgba(74, 137, 124, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                                                    Նիշք #{subIdx + 1}
                                                  </span>
                                                  {dl.file_size && (
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, var(--muted))', background: 'var(--bg)', border: '1px solid var(--panel-border)', padding: '2px 8px', borderRadius: '4px' }}>
                                                      Չափ՝ {dl.file_size}
                                                    </span>
                                                  )}
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveDownloadOption(originalIdx)}
                                                  title="Հեռացնել"
                                                  style={{
                                                    background: 'rgba(229, 57, 53, 0.1)',
                                                    color: '#e53935',
                                                    border: '1px solid rgba(229, 57, 53, 0.3)',
                                                    borderRadius: '6px',
                                                    width: '28px',
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    fontSize: '15px',
                                                    fontWeight: 700
                                                  }}
                                                >
                                                  &times;
                                                </button>
                                              </div>

                                              {/* URL & Upload buttons row */}
                                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1 1 200px' }}>
                                                  <hd-input
                                                    suppressHydrationWarning
                                                    placeholder="Նիշքի հասցե (/uploads/apps/... կամ https://...)"
                                                    value={dl.url || ""}
                                                    onInput={(e: any) => handleUpdateDownloadOption(originalIdx, { url: e.target.value })}
                                                    data-width="100%"
                                                    data-height="34px"
                                                    data-thickness="2px"
                                                    data-font-size="10pt"
                                                  />
                                                </div>

                                                <hd-button
                                                  suppressHydrationWarning
                                                  data-height="34px"
                                                  data-thickness="2px"
                                                  data-font-size="0.75rem"
                                                  data-color="rgba(74, 137, 124, 0.15)"
                                                  data-text-color="var(--accent)"
                                                  onClick={() => setMediaPickerConfig({
                                                    isOpen: true,
                                                    target: 'download_item',
                                                    itemIndex: originalIdx,
                                                    allowedTypes: ['document', 'other', 'vector', 'image'],
                                                    title: `Ընտրել Նիշք՝ ${dl.name || swName}`,
                                                    currentValue: dl.url
                                                  })}
                                                >
                                                  <span style={{ padding: '0 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <span className="hd-icon icon-Image" /> Դարանից
                                                  </span>
                                                </hd-button>

                                                <hd-button
                                                  suppressHydrationWarning
                                                  data-height="34px"
                                                  data-thickness="2px"
                                                  data-font-size="0.75rem"
                                                  data-color="var(--accent)"
                                                  data-text-color="#ffffff"
                                                  onClick={() => triggerItemFileUpload(originalIdx)}
                                                  disabled={uploadingFile}
                                                >
                                                  <span style={{ padding: '0 8px', fontWeight: 700 }}>
                                                    {uploadingFile && currentUploadItemIndex === originalIdx ? "Բեռնվում է..." : "↑ Վերբեռնել"}
                                                  </span>
                                                </hd-button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--panel)', borderRadius: '8px', border: '1px dashed var(--panel-border)', fontSize: '0.8rem', color: 'var(--muted)' }}>
                                          <span>Այս հավելվածի համար նիշք դեռ կցված չէ:</span>
                                          <button
                                            type="button"
                                            onClick={() => handleAddDownloadOptionForHostApp(osKey, swName)}
                                            style={{
                                              background: 'transparent',
                                              border: 'none',
                                              color: 'var(--accent)',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              fontSize: '0.8rem'
                                            }}
                                          >
                                            + Կցել նիշք հիմա
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', background: 'var(--bg)', padding: '10px 14px', borderRadius: '8px' }}>
                                💡 Ընտրեք առնվազն մեկ հավելված {osPreset.label}-ի տակ՝ բուն ծրագրային նիշքերը կցելու համար:
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* BRANCH 2: ԱՌԱՆՁԻՆ ՀԱՎԵԼՎԱԾ (STANDALONE APP) FLOW              */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {editingApp.app_type === 'standalone' && (
                <div
                  style={{
                    background: 'var(--bg)',
                    padding: '18px 20px',
                    borderRadius: '16px',
                    border: '1px solid var(--panel-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)', display: 'block' }}>
                        Օպերացիոն Համակարգ (OS) *
                      </label>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        Նշեք այն համակարգերը (Windows, macOS, Linux), որոնց համար հասանելի է այս հավելվածը։
                      </span>
                    </div>
                    {selectedOSList.length > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: 'rgba(74, 137, 124, 0.15)', color: 'var(--accent)' }}>
                        Ընտրված է {selectedOSList.length} ԳՀ
                      </span>
                    )}
                  </div>

                  {/* OS Buttons for Standalone */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {OS_PRESETS.map((os) => {
                      const isSelected = selectedOSList.includes(os.key);
                      return (
                        <button
                          key={os.key}
                          type="button"
                          onClick={() => handleToggleOS(os.key)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(74, 137, 124, 0.2)' : 'var(--panel)',
                            border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--panel-border)'}`,
                            color: isSelected ? 'var(--accent)' : 'var(--text)',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <SoftwareIcon name={os.label} iconUrl={os.icon} size={20} />
                          <span>{os.label}</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            {isSelected ? '✓' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedOSList.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#e53935', background: 'rgba(229, 57, 53, 0.08)', padding: '10px 14px', borderRadius: '8px', fontWeight: 600 }}>
                      <span className="hd-icon icon-Warning" style={{ marginRight: 6 }} /> Ընտրեք առնվազն մեկ ԳՀ (Windows, macOS կամ Linux)՝ տեղադրիչ նիշքերը կցելու համար:
                    </div>
                  ) : (
                    /* Download slots for Standalone App */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text)' }}>
                          Ներբեռնվող տեղադրիչներ (Installers)՝
                        </span>
                        <hd-button
                          suppressHydrationWarning
                          data-height="32px"
                          data-thickness="2px"
                          data-font-size="0.76rem"
                          data-color="var(--accent)"
                          data-text-color="#ffffff"
                          onClick={() => handleAddDownloadOption("Այլ տարբերակ", "/icons/browser.svg")}
                        >
                          <span style={{ padding: '0 10px' }}>+ Ավելացնել տարբերակ</span>
                        </hd-button>
                      </div>

                      {editingApp.downloads && editingApp.downloads.length > 0 ? (
                        editingApp.downloads.map((dl, idx) => {
                          const isWin = dl.os === 'windows' || (dl.name && dl.name.toLowerCase().includes('win'));
                          const isMac = dl.os === 'macos' || (dl.name && dl.name.toLowerCase().includes('mac'));
                          const isLinux = dl.os === 'linux' || (dl.name && dl.name.toLowerCase().includes('linux'));
                          return (
                            <div
                              key={dl.id || idx}
                              style={{
                                background: 'var(--panel)',
                                border: `1.5px solid ${isWin ? 'rgba(33, 150, 243, 0.35)' : (isMac ? 'rgba(255, 255, 255, 0.25)' : (isLinux ? 'rgba(255, 193, 7, 0.35)' : 'var(--panel-border)'))}`,
                                borderRadius: '14px',
                                padding: '16px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                boxShadow: 'var(--shadow)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent)', background: 'rgba(74, 137, 124, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                                    #{idx + 1}
                                  </span>
                                  <SoftwareIcon name={dl.os ? (dl.os === 'windows' ? 'Windows' : dl.os === 'macos' ? 'macOS' : 'Linux') : dl.name} iconUrl={dl.icon} size={24} />
                                  <div style={{ flex: 1, minWidth: '180px' }}>
                                    <hd-input
                                      suppressHydrationWarning
                                      placeholder="Անվանում (օր․՝ Windows x64 Installer, macOS DMG)..."
                                      value={dl.name || ""}
                                      onInput={(e: any) => handleUpdateDownloadOption(idx, { name: e.target.value })}
                                      data-width="100%"
                                      data-height="36px"
                                      data-thickness="2px"
                                      data-font-size="11pt"
                                    />
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {/* OS selector */}
                                  <select
                                    value={dl.os || (isWin ? 'windows' : (isMac ? 'macos' : (isLinux ? 'linux' : 'other')))}
                                    onChange={(e) => {
                                      const val = e.target.value as any;
                                      const osIcon = val === 'windows' ? '/icons/windows.svg' : (val === 'macos' ? '/icons/apple.svg' : (val === 'linux' ? '/icons/linux.svg' : dl.icon));
                                      handleUpdateDownloadOption(idx, { os: val, icon: osIcon });
                                    }}
                                    style={{
                                      background: 'var(--bg)',
                                      border: '1px solid var(--panel-border)',
                                      color: 'var(--text)',
                                      padding: '6px 10px',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="windows">Windows</option>
                                    <option value="macos">macOS</option>
                                    <option value="linux">Linux</option>
                                    <option value="other">Այլ (Other)</option>
                                  </select>

                                  <div style={{ width: '90px' }}>
                                    <hd-input
                                      suppressHydrationWarning
                                      placeholder="Տարբերակ"
                                      value={dl.version || ""}
                                      onInput={(e: any) => handleUpdateDownloadOption(idx, { version: e.target.value })}
                                      data-width="100%"
                                      data-height="34px"
                                      data-thickness="2px"
                                      data-font-size="10pt"
                                    />
                                  </div>

                                  <div style={{ width: '90px' }}>
                                    <hd-input
                                      suppressHydrationWarning
                                      placeholder="Չափ (MB)"
                                      value={dl.file_size || ""}
                                      onInput={(e: any) => handleUpdateDownloadOption(idx, { file_size: e.target.value })}
                                      data-width="100%"
                                      data-height="34px"
                                      data-thickness="2px"
                                      data-font-size="10pt"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDownloadOption(idx)}
                                    title="Հեռացնել այս տարբերակը"
                                    style={{
                                      background: 'rgba(229, 57, 53, 0.1)',
                                      color: '#e53935',
                                      border: '1px solid rgba(229, 57, 53, 0.3)',
                                      borderRadius: '8px',
                                      width: '34px',
                                      height: '34px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      fontSize: '15px',
                                      fontWeight: 700
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 240px' }}>
                                  <hd-input
                                    suppressHydrationWarning
                                    placeholder={`${isWin ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : 'Ներբեռնման'} նիշքի հասցե (/uploads/apps/... կամ https://...)`}
                                    value={dl.url || ""}
                                    onInput={(e: any) => handleUpdateDownloadOption(idx, { url: e.target.value })}
                                    data-width="100%"
                                    data-height="38px"
                                    data-thickness="2px"
                                    data-font-size="11pt"
                                  />
                                </div>

                                <hd-button
                                  suppressHydrationWarning
                                  data-height="38px"
                                  data-thickness="2px"
                                  data-font-size="0.78rem"
                                  data-color="rgba(74, 137, 124, 0.15)"
                                  data-text-color="var(--accent)"
                                  onClick={() => setMediaPickerConfig({
                                    isOpen: true,
                                    target: 'download_item',
                                    itemIndex: idx,
                                    allowedTypes: ['document', 'other', 'vector', 'image'],
                                    title: `Ընտրել Տեղադրիչ՝ ${dl.name || `Տարբերակ #${idx + 1}`}`,
                                    currentValue: dl.url
                                  })}
                                >
                                  <span style={{ padding: '0 10px' }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg> Դարանից
                                  </span>
                                </hd-button>

                                <hd-button
                                  suppressHydrationWarning
                                  data-height="38px"
                                  data-thickness="2px"
                                  data-font-size="0.78rem"
                                  data-color="var(--accent)"
                                  data-text-color="#ffffff"
                                  onClick={() => triggerItemFileUpload(idx)}
                                  disabled={uploadingFile}
                                >
                                  <span style={{ padding: '0 10px', fontWeight: 700 }}>
                                    {uploadingFile && currentUploadItemIndex === idx ? "Բեռնվում է..." : "↑ Վերբեռնել"}
                                  </span>
                                </hd-button>
                              </div>
                            </div>
                          );
                        })
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* LANGUAGES SELECTION                                            */}
              {/* ══════════════════════════════════════════════════════════════ */}
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

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* PRICING SECTION (ԱՌԱՆՁԻՆ ՆԵՐՔԵՒՈՒՄ, ԻՐԱՐ ՀԵՏ ԿԱՊ ՉՈՒՆԵՆ)        */}
              {/* ══════════════════════════════════════════════════════════════ */}
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
                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)', display: 'block' }}>
                    Գնագոյացում (Pricing)
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    Որոշեք՝ հավելվածը անվճար է, թե վճարովի։ Այն գործում է անկախ վերևի նիշքերից:
                  </span>
                </div>

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

                {editingApp.is_paid && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '4px' }}>
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
                )}
              </div>

              {/* Repository / Source Code Link Section (GitHub, GitLab, etc.) */}
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
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      Կոդի Շտեմարանի Հղում (Repository / Source Link)
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
                      Հավելվածի էջում Ներբեռնելու կոճակի կողքին կհայտնվի քառակուսի կոճակ՝ միայն պատկերակով (GitHub, GitLab և այլն)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 280px' }}>
                    <hd-input
                      suppressHydrationWarning
                      placeholder="https://github.com/username/repository կամ https://gitlab.com/..."
                      value={editingApp.repository_url || ""}
                      onInput={(e: any) => {
                        const val = e.target.value;
                        let detectedType = editingApp.repository_type || 'github';
                        if (val.includes('github.com')) detectedType = 'github';
                        else if (val.includes('gitlab.com')) detectedType = 'gitlab';
                        else if (val.includes('bitbucket.org')) detectedType = 'bitbucket';
                        setEditingApp(p => ({ ...p, repository_url: val, repository_type: detectedType }));
                      }}
                      data-width="100%"
                      data-height="40px"
                      data-thickness="2px"
                      data-font-size="13pt"
                    />
                  </div>

                  {/* Platform Type Selector */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {[
                      { id: 'github', label: 'GitHub' },
                      { id: 'gitlab', label: 'GitLab' },
                      { id: 'bitbucket', label: 'Bitbucket' },
                      { id: 'code', label: 'Git / Code' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEditingApp(prev => ({ ...prev, repository_type: p.id }))}
                        style={{
                          background: (editingApp.repository_type === p.id || (!editingApp.repository_type && p.id === 'github'))
                            ? 'var(--accent)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: (editingApp.repository_type === p.id || (!editingApp.repository_type && p.id === 'github'))
                            ? '#ffffff'
                            : 'var(--muted)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '8px',
                          padding: '7px 11px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Badge if URL is filled */}
                {editingApp.repository_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', padding: '8px 12px', background: 'rgba(74, 137, 124, 0.08)', borderRadius: '10px', border: '1px dashed rgba(74, 137, 124, 0.3)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>
                      Կոճակի տեսքը էջում՝
                    </span>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--panel)',
                      border: '1.5px solid var(--panel-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}>
                      {(editingApp.repository_type === 'gitlab' || (!editingApp.repository_type && editingApp.repository_url.includes('gitlab'))) ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="m23.6 9.59-1.23-3.79a.9.9 0 0 0-.85-.62.9.9 0 0 0-.86.62l-1.23 3.79H4.57L3.34 5.8a.9.9 0 0 0-.86-.62.9.9 0 0 0-.85.62L.4 9.59a.9.9 0 0 0 .33 1l11.27 8.19 11.27-8.19a.9.9 0 0 0 .33-1ZM12 18.78 1.77 11.34h20.46L12 18.78Z"/>
                        </svg>
                      ) : (editingApp.repository_type === 'bitbucket' || (!editingApp.repository_type && editingApp.repository_url.includes('bitbucket'))) ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.61 3a1.44 1.44 0 0 0-1.44 1.64l2.49 14.86A1.66 1.66 0 0 0 5.3 21h13.4a1.66 1.66 0 0 0 1.64-1.5l2.49-14.86A1.44 1.44 0 0 0 21.39 3H2.61zm10.74 12.35h-2.7L9.38 9.5h5.24l-1.27 5.85z"/>
                        </svg>
                      ) : (editingApp.repository_type === 'code') ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {editingApp.repository_url}
                    </span>
                  </div>
                )}
              </div>

              {/* Cover Image & Screenshots Gallery Section */}
              <div
                style={{
                  background: 'var(--bg)',
                  padding: '18px 20px',
                  borderRadius: '16px',
                  border: '1px solid var(--panel-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Cover Image */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                      Գլխավոր Պատկեր (Cover Image)
                    </label>
                    <hd-button
                      suppressHydrationWarning
                      data-height="32px"
                      data-thickness="2px"
                      data-font-size="0.78rem"
                      data-color="rgba(74, 137, 124, 0.15)"
                      data-text-color="var(--accent)"
                      onClick={() => setMediaPickerConfig({
                        isOpen: true,
                        target: 'cover',
                        multiple: false,
                        allowedTypes: ['image'],
                        title: 'Ընտրել Գլխավոր Պատկեր (Cover Image)',
                        currentValue: editingApp.cover_image
                      })}
                    >
                      <span style={{ padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span className="hd-icon icon-Image" /> Ընտրել Գլխավոր Նկար</span>
                    </hd-button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {editingApp.cover_image ? (
                      <div style={{ width: '80px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--accent)', flexShrink: 0 }}>
                        <img src={editingApp.cover_image} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: '80px', height: '56px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.72rem', flexShrink: 0 }}>
                        Նկար չկա
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <hd-input
                        suppressHydrationWarning
                        placeholder="https://... cover.jpg"
                        value={editingApp.cover_image || ""}
                        onInput={(e: any) => setEditingApp(p => ({ ...p, cover_image: e.target.value }))}
                        data-width="100%"
                        data-height="36px"
                        data-thickness="2px"
                        data-font-size="12pt"
                      />
                    </div>
                  </div>
                </div>

                {/* Screenshots Gallery */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                      Սքրինշոթներ և Պատկերասրահ ({editingApp.gallery_images.length})
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                        data-color="rgba(74, 137, 124, 0.15)"
                        data-text-color="var(--accent)"
                        onClick={() => setMediaPickerConfig({
                          isOpen: true,
                          target: 'gallery',
                          multiple: true,
                          allowedTypes: ['image'],
                          title: 'Ընտրել Սքրինշոթներ (Screenshots)',
                          currentValue: editingApp.gallery_images
                        })}
                      >
                        <span style={{ padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span className="hd-icon icon-Image" /> Ընտրել Դարանից</span>
                      </hd-button>
                      <hd-button
                        suppressHydrationWarning
                        data-height="32px"
                        data-thickness="2px"
                        data-font-size="0.8rem"
                        data-color="var(--panel)"
                        data-text-color="var(--text)"
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={uploadingGallery}
                      >
                        <span style={{ padding: '0 10px' }}>
                          {uploadingGallery ? "Բեռնվում է..." : "↑ Վերբեռնել"}
                        </span>
                      </hd-button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '12px',
                      background: 'var(--panel)',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid var(--panel-border)',
                      minHeight: '80px'
                    }}
                  >
                    {editingApp.gallery_images.length === 0 ? (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '12px' }}>
                        Սքրինշոթներ չկան: Սեղմեք «Ընտրել Դարանից» կամ «Վերբեռնել»:
                      </span>
                    ) : (
                      editingApp.gallery_images.map((img, i) => (
                        <div
                          key={i}
                          style={{
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            aspectRatio: '1/1.4142',
                            border: editingApp.cover_image === img ? '2px solid var(--accent)' : '1px solid var(--panel-border)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setEditingApp(p => ({ ...p, cover_image: img }))}
                          title="Սեղմեք գլխավոր (Cover) դարձնելու համար"
                        >
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingApp(p => ({ ...p, gallery_images: p.gallery_images.filter((_, idx) => idx !== i) }));
                            }}
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
                                fontWeight: 700,
                                padding: '1px 5px',
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
                    Վարկածի համար (օր.՝ v1.0.2)
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
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: 0,
                  boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
                }}
              >
                <div>
                  {apps.some(a => a.id === editingApp.id) && (
                    <hd-button
                      suppressHydrationWarning
                      data-height="38px"
                      data-thickness="2px"
                      data-font-size="0.85rem"
                      data-color="rgba(229, 57, 53, 0.15)"
                      data-text-color="#e53935"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        handleDeleteApp(editingApp.id);
                      }}
                      disabled={savingApp}
                    >
                      <span
                        style={{ padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          handleDeleteApp(editingApp.id);
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        <span>Ջնջել Հավելվածը</span>
                      </span>
                    </hd-button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      color: 'var(--text)',
                      userSelect: 'none',
                      marginRight: '8px'
                    }}
                    title="Ուղարկել ծանուցում բոլոր բաժանորդներին էլ․ փոստով այս հավելվածի հրապարակման կամ թարմացման մասին"
                  >
                    <input
                      type="checkbox"
                      checked={notifySubscribers}
                      onChange={(e) => setNotifySubscribers(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span>Ծանուցել բաժանորդներին</span>
                  </label>

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
                      <span>{savingApp ? "Պահվում է..." : "Պահել որպես սևագիր"}</span>
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
                      <span>{savingApp ? "Պահվում է..." : "Հրապարակել Հավելվածը"}</span>
                    </span>
                  </hd-button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SELECTED BUG REPORT DETAIL MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {selectedBugReport && typeof document !== 'undefined' && createPortal(
        <div
          data-modal-backdrop="true"
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
            boxSizing: 'border-box',
            animation: 'modalBackdropFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedBugReport(null);
            }
          }}
        >
          <div
            data-modal-container="true"
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
              position: 'relative',
              animation: 'modalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity'
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
                <span className="hd-icon icon-Info" style={{ fontSize: '1.3rem' }} />
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
                  <option value="new">Նոր</option>
                  <option value="investigating">Ուսումնասիրվում է</option>
                  <option value="resolved">Լուծված</option>
                  <option value="closed">Փակված</option>
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
                              aspectRatio: '1/1.4142',
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
                              <span className="hd-icon icon-Eye" style={{ marginRight: 4 }} /> Դիտել
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
                          <span className="hd-icon icon-Info" style={{ fontSize: '1.2rem' }} />
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
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span className="hd-icon icon-Pencil" />
                    <span>Ներքին Վարչական Նշումներ (Admin Notes)</span>
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
                    {savingReportNotes ? 'Պահվում է...' : 'Պահել Նշումները'}
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
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="hd-icon icon-Trash" />
                <span>Ջնջել Զեկույցը</span>
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
                  <span className="hd-icon icon-Mail" />
                  <span>Պատասխանել էլ․ փոստով</span>
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
          data-modal-backdrop="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100000000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'modalBackdropFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={() => setSelectedMediaUrl(null)}
        >
          <div
            data-modal-container="true"
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              animation: 'modalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedMediaUrl}
              alt="Library Preview"
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

      {/* ══════════════════════════════════════════════════════════════════════
          MEDIA PICKER POPUP MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {mediaPickerConfig?.isOpen && (
        <MediaPickerModal
          isOpen={mediaPickerConfig.isOpen}
          onClose={() => setMediaPickerConfig(null)}
          onSelect={handleMediaPickerSelect}
          multiple={mediaPickerConfig.multiple}
          allowedTypes={mediaPickerConfig.allowedTypes}
          title={mediaPickerConfig.title}
          token={token}
          currentValue={mediaPickerConfig.currentValue}
        />
      )}
    </div>
  );
}
