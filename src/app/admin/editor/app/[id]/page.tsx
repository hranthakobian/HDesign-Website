"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LoadingAnimation from "@/components/LoadingAnimation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MediaPickerModal from "@/components/MediaPickerModal";
import SoftwareIcon from "@/components/SoftwareIcon";
import AppLanguagesPicker from "@/components/AppLanguagesPicker";
import AppDesignSystemPicker from "@/components/AppDesignSystemPicker";
import FileSizePicker from "@/components/FileSizePicker";
import { MediaFileType } from "@/lib/mediaTypes";
import { prefetchMediaLibrary } from "@/lib/mediaCache";
import HdVideoPlayer from "@/components/HdVideoPlayer";
import { isVideoUrl, getYoutubeThumbnail } from "@/components/AppGallerySlider";

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
  microsoft_store_enabled?: boolean;
  microsoft_store_url?: string;
  app_store_enabled?: boolean;
  app_store_url?: string;
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

export default function AppDedicatedEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params?.id as string;
  const isNew = rawId === "new" || searchParams?.get("new") === "true";

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);

  const [customSoftwareInput, setCustomSoftwareInput] = useState("");
  const [notifySubscribers, setNotifySubscribers] = useState<boolean>(true);
  const [mdLangTab, setMdLangTab] = useState<"am" | "en">("am");

  const handleUploadMarkdownFile = (e: React.ChangeEvent<HTMLInputElement>, lang: "am" | "en") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        if (lang === "am") setForm(prev => ({ ...prev, description_md_am: text }));
        else setForm(prev => ({ ...prev, description_md_en: text }));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const [form, setForm] = useState<AppItem>({
    id: isNew ? `app-${Date.now()}` : rawId,
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
    microsoft_store_enabled: false,
    microsoft_store_url: "",
    app_store_enabled: false,
    app_store_url: "",
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
    file_size: "",
    downloads_count: 0,
    avg_rating: 5,
    reviews_count: 0,
    status: "published",
    is_draft: false,
  });

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("hdesign_admin_token");
      if (!savedToken) {
        router.push("/admin");
        return;
      }
      setToken(savedToken);
      prefetchMediaLibrary(savedToken);

      if (isNew) {
        setLoading(false);
      } else {
        loadAppData(rawId, savedToken);
      }
    }
  }, [rawId, isNew]);

  const loadAppData = async (appId: string, authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/apps`, { headers: { Authorization: authToken } });
      const data = await res.json();
      const appsList: AppItem[] = Array.isArray(data) ? data : (data?.apps || []);
      const found = appsList.find((a: AppItem) => a.id === appId);

      if (found) {
        let parsedHostApps: string[] = [];
        if (Array.isArray(found.host_apps) && found.host_apps.length > 0) {
          parsedHostApps = found.host_apps;
        } else if (found.host_app) {
          parsedHostApps = found.host_app.split(',').map(s => s.trim()).filter(Boolean);
        }

        setForm({
          ...found,
          host_apps: parsedHostApps,
          host_app: parsedHostApps.join(', '),
          gallery_images: Array.isArray(found.gallery_images) ? found.gallery_images : [],
          supported_os: Array.isArray(found.supported_os) ? found.supported_os : ['windows', 'macos'],
          downloads: Array.isArray(found.downloads) ? found.downloads : [],
          video_url: found.video_url || "",
          microsoft_store_enabled: !!found.microsoft_store_enabled,
          microsoft_store_url: found.microsoft_store_url || "",
          app_store_enabled: !!found.app_store_enabled,
          app_store_url: found.app_store_url || "",
        });
      } else {
        router.push("/admin?tab=apps");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const getDownloadUrlFor = (osKey: 'windows' | 'macos' | 'linux', hostApp?: string) => {
    const downloads = form.downloads || [];
    const found = downloads.find(d => d.os === osKey && (form.app_type === 'standalone' || d.host_app === hostApp));
    return found ? found.url : "";
  };

  const setDownloadUrlFor = (osKey: 'windows' | 'macos' | 'linux', urlValue: string, hostApp?: string) => {
    setForm(prev => {
      const downloads = [...(prev.downloads || [])];
      const index = downloads.findIndex(d => d.os === osKey && (prev.app_type === 'standalone' || d.host_app === hostApp));

      const optionName = prev.app_type === 'plugin'
        ? `${hostApp || 'Plugin'} (${osKey.toUpperCase()})`
        : `${prev.title_en || 'App'} (${osKey.toUpperCase()})`;

      if (index >= 0) {
        if (!urlValue.trim()) downloads.splice(index, 1);
        else downloads[index] = { ...downloads[index], url: urlValue.trim() };
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
      return { ...prev, downloads, download_url: downloads.length > 0 ? downloads[0].url : prev.download_url };
    });
  };

  const handleSaveApp = async () => {
    if (!form.title_am.trim() && !form.title_en.trim()) {
      alert("Խնդրում ենք նշել հավելվածի անվանումը:");
      return;
    }
    if (!token) return;

    setSaving(true);
    try {
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
        original_id: isNew ? undefined : rawId,
        notify_subscribers: notifySubscribers,
        host_app: (form.host_apps && form.host_apps.length > 0) ? form.host_apps.join(', ') : form.host_app,
      };

      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Հավելվածը հաջողությամբ պահպանվեց:");
        router.push("/admin?tab=apps");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
      setForm(prev => ({ ...prev, gallery_images: Array.from(new Set([...prev.gallery_images, ...urls])) }));
    } else if (target === "download_file" && targetOS) {
      const url = Array.isArray(selected) ? selected[0] : selected;
      setDownloadUrlFor(targetOS, url, targetHostApp);
    }
    setMediaPickerConfig(null);
  };

  if (loading) return <LoadingAnimation message="Բեռնվում է..." />;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "'Outfit', 'HDesign', sans-serif", padding: "24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
          <div>
            <Link href="/admin?tab=apps" style={{ textDecoration: "none" }}>
              <hd-button data-height="34px" data-thickness="3px">← Հետ</hd-button>
            </Link>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "12px", margin: 0 }}>
              {isNew ? "Նոր Հավելվածի Ստեղծման Գործիք" : `Խմբագրել՝ ${form.title_am || form.title_en}`}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              title={notifySubscribers ? "Ծանուցումները միացված են" : "Ծանուցումներն անջատված են"}
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

        {/* Basic Form Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Անվանում (Հայերեն) *</label>
            <input type="text" value={form.title_am} onChange={e => setForm(prev => ({ ...prev, title_am: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Անվանում (English) *</label>
            <input type="text" value={form.title_en} onChange={e => setForm(prev => ({ ...prev, title_en: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a" }} />
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
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Տեսակ *</label>
              <select value={form.app_type} onChange={e => setForm(prev => ({ ...prev, app_type: e.target.value as any }))} style={{ width: "100%", padding: "10px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontWeight: 600 }}>
                <option value="plugin">Խրվակ (Plugin)</option>
                <option value="standalone">Հավելված (Standalone Application)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Կարգավիճակ</label>
              <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))} style={{ width: "100%", padding: "10px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a" }}>
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

        {/* Version, Release Date, and File Size */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Վարկած (Version)</label>
            <input type="text" value={form.version} onChange={e => setForm(prev => ({ ...prev, version: e.target.value }))} placeholder="1.0.0" style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem" }} />
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

        {/* If Plugin: Host Applications Selector */}
        {form.app_type === 'plugin' && (
          <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
              Ընտրեք Ծրագրերը (Host Applications), որոնց համար նախատեսված է Խրվակը *
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {SOFTWARE_PRESETS.map(sw => {
                const isSelected = (form.host_apps || []).includes(sw);
                return (
                  <button key={sw} type="button" onClick={() => toggleHostApp(sw)} style={{ padding: "6px 14px", background: isSelected ? "#0f172a" : "#ffffff", color: isSelected ? "#ffffff" : "#334155", border: `1px solid ${isSelected ? "#0f172a" : "#cbd5e1"}`, borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                    {isSelected ? `✓ ${sw}` : `+ ${sw}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* OS & Package Matrix */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
            Աջակցվող Գործավար Համակարգեր (ԳՀ / OS Compatibility)
          </label>
          <div style={{ display: "flex", gap: "12px" }}>
            {['windows', 'macos', 'linux'].map(osKey => {
              const isChecked = (form.supported_os || []).includes(osKey as any);
              return (
                <label key={osKey} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: isChecked ? "#f1f5f9" : "#ffffff", border: `1px solid ${isChecked ? "#0f172a" : "#cbd5e1"}`, borderRadius: "8px", cursor: "pointer", color: "#0f172a", fontWeight: 600, fontSize: "0.88rem" }}>
                  <input type="checkbox" checked={isChecked} onChange={e => {
                    const curr = form.supported_os || [];
                    const nextOS = e.target.checked ? [...curr, osKey as any] : curr.filter(x => x !== osKey);
                    setForm(prev => ({
                      ...prev,
                      supported_os: nextOS,
                      downloads: e.target.checked
                        ? (prev.downloads || [])
                        : (prev.downloads || []).filter(d => d.os !== osKey)
                    }));
                  }} style={{ accentColor: "#0f172a" }} />
                  {osKey === 'windows' ? 'Windows' : osKey === 'macos' ? 'macOS' : 'Linux'}
                </label>
              );
            })}
          </div>

          {(form.supported_os || []).map(osKey => {
            const osTitle = osKey === 'windows' ? 'Windows' : osKey === 'macos' ? 'macOS' : 'Linux';
            return (
              <div key={osKey} style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <SoftwareIcon name={osKey} size={18} />
                  <span>{form.app_type === 'standalone' ? osTitle : `${osTitle} Գործավար Համակարգ`}</span>
                </div>
                {form.app_type === 'plugin' ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(form.host_apps || ['FontLab']).map(sw => {
                      const currentUrl = getDownloadUrlFor(osKey as any, sw);
                      return (
                        <div key={sw} style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#334155" }}>{sw} — Խրվակ {osTitle}-ի համար</div>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <input type="text" value={currentUrl} onChange={e => setDownloadUrlFor(osKey as any, e.target.value, sw)} placeholder={`https://... (${sw} plugin for ${osTitle})`} style={{ flex: 1, padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }} />
                            <button type="button" onClick={() => setMediaPickerConfig({ isOpen: true, target: "download_file", targetOS: osKey as any, targetHostApp: sw, multiple: false, title: `Ընտրել ${sw} (${osTitle}) Ֆայլը`, currentValue: currentUrl })} style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>Ընտրել Ֆայլ</button>
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
                      <input type="text" value={getDownloadUrlFor(osKey as any)} onChange={e => setDownloadUrlFor(osKey as any, e.target.value)} placeholder={`https://... (${osTitle} package)`} style={{ flex: 1, padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }} />
                      <button type="button" onClick={() => setMediaPickerConfig({ isOpen: true, target: "download_file", targetOS: osKey as any, multiple: false, title: `Ընտրել ${osTitle} Ֆայլը`, currentValue: getDownloadUrlFor(osKey as any) })} style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>Ընտրել Ֆայլ</button>
                    </div>
                  </div>
                )}

                {/* Store Integration Buttons for Windows & macOS */}
                {osKey === 'windows' && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>
                      <input
                        type="checkbox"
                        checked={!!form.microsoft_store_enabled}
                        onChange={e => setForm(prev => ({ ...prev, microsoft_store_enabled: e.target.checked }))}
                        style={{ accentColor: "#0f172a", width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <span>Միացնել Microsoft Store-ի կոճակը (Windows)</span>
                    </label>
                    {form.microsoft_store_enabled && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "24px" }}>
                        <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>
                          Microsoft Store Հղում (URL)
                        </label>
                        <input
                          type="text"
                          value={form.microsoft_store_url || ""}
                          onChange={e => setForm(prev => ({ ...prev, microsoft_store_url: e.target.value }))}
                          placeholder="https://apps.microsoft.com/detail/... կամ ms-windows-store://..."
                          style={{ width: "100%", padding: "8px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {osKey === 'macos' && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>
                      <input
                        type="checkbox"
                        checked={!!form.app_store_enabled}
                        onChange={e => setForm(prev => ({ ...prev, app_store_enabled: e.target.checked }))}
                        style={{ accentColor: "#0f172a", width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <span>Միացնել Mac App Store-ի կոճակը (macOS)</span>
                    </label>
                    {form.app_store_enabled && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "24px" }}>
                        <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>
                          App Store Հղում (URL)
                        </label>
                        <input
                          type="text"
                          value={form.app_store_url || ""}
                          onChange={e => setForm(prev => ({ ...prev, app_store_url: e.target.value }))}
                          placeholder="https://apps.apple.com/app/... կամ macappstore://..."
                          style={{ width: "100%", padding: "8px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Media Section: Cover, Video URL, Gallery */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Մեդիա (Պատկերներ և Տեսանյութ)
          </h3>

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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                Պատկերասրահի Սքրինշոթեր ({form.gallery_images?.length || 0})
              </label>
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
              {(form.gallery_images || []).map((imgUrl, i) => {
                const isVid = isVideoUrl(imgUrl);
                const thumb = isVid ? (getYoutubeThumbnail(imgUrl) || null) : imgUrl;
                return (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      height: "95px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #cbd5e1",
                      background: "#0d1716",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {thumb ? (
                      <img src={thumb} alt={`Screenshot ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span className="hd-icon icon-Play" style={{ fontSize: "20px", color: "var(--accent, #4a897c)" }} />
                    )}
                    {isVid && thumb && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <span className="hd-icon icon-Play" style={{ fontSize: "16px", color: "#fff" }} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, gallery_images: prev.gallery_images.filter((_, idx) => idx !== i) }))}
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

        {/* Markdown Section */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>Լեզու՝</span>
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
                  cursor: "pointer"
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
                  cursor: "pointer"
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
                color: "#0284c7"
              }}
              title="Վերբեռնել Markdown նիշք"
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
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                {mdLangTab === "am" ? "Խմբագրել (Հայերեն Markdown)" : "Editor (English Markdown)"}
              </span>
              <textarea
                rows={12}
                value={mdLangTab === "am" ? (form.description_md_am || "") : (form.description_md_en || "")}
                onChange={e => {
                  const val = e.target.value;
                  if (mdLangTab === "am") setForm(prev => ({ ...prev, description_md_am: val }));
                  else setForm(prev => ({ ...prev, description_md_en: val }));
                }}
                placeholder={mdLangTab === "am" ? "## Հայերեն Markdown..." : "## English Markdown..."}
                style={{ width: "100%", padding: "14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontFamily: "monospace", fontSize: "0.88rem", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
                {mdLangTab === "am" ? "Նախադիտում (Հայերեն)" : "Preview (English)"}
              </span>
              <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "8px", border: "1px solid #e2e8f0", overflowY: "auto", maxHeight: "350px", flex: 1 }}>
                <MarkdownRenderer content={(mdLangTab === "am" ? form.description_md_am : form.description_md_en) || (mdLangTab === "am" ? "*Դատարկ է*" : "*Empty*")} />
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
