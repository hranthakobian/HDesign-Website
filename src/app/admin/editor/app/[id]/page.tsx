"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LoadingAnimation from "@/components/LoadingAnimation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MediaPickerModal from "@/components/MediaPickerModal";
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
  gallery_images: string[];
  languages?: string[];
  version: string;
  release_date: string;
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
    repository_url: "",
    repository_type: "github",
    repositories: [{ type: "github", url: "", label: "GitHub" }],
    cover_image: "",
    gallery_images: [],
    languages: ["am", "en"],
    version: "1.0.0",
    release_date: new Date().toISOString().split("T")[0],
    downloads_count: 0,
    avg_rating: 5,
    reviews_count: 0,
    status: "published",
    is_draft: false,
  });

  const [mediaPickerConfig, setMediaPickerConfig] = useState<{
    isOpen: boolean;
    target: "cover" | "gallery" | "download_file";
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
      const payload = {
        ...form,
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
          <div onClick={handleSaveApp}>
            <hd-button data-height="38px" data-thickness="3px">
              <span className="hd-icon icon-Check" style={{ marginRight: 6 }} />
              {saving ? "Պահպանվում է..." : "Պահպանել"}
            </hd-button>
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
                    setForm(prev => ({ ...prev, supported_os: e.target.checked ? [...curr, osKey as any] : curr.filter(x => x !== osKey) }));
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
                <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a", marginBottom: "12px" }}>{osTitle} Գործավար Համակարգ</div>
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
                    <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#334155" }}>Տեղադրման ֆայլ {osTitle}-ի համար</div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input type="text" value={getDownloadUrlFor(osKey as any)} onChange={e => setDownloadUrlFor(osKey as any, e.target.value)} placeholder={`https://... (${osTitle} package)`} style={{ flex: 1, padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", fontSize: "0.85rem" }} />
                      <button type="button" onClick={() => setMediaPickerConfig({ isOpen: true, target: "download_file", targetOS: osKey as any, multiple: false, title: `Ընտրել ${osTitle} Ֆայլը`, currentValue: getDownloadUrlFor(osKey as any) })} style={{ padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>Ընտրել Ֆայլ</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
