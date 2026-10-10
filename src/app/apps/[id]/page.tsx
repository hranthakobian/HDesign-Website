"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import AppGallerySlider from "@/components/AppGallerySlider";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import LoadingAnimation from "@/components/LoadingAnimation";
import { HDesignStars } from "@/components/RatingSystem";
import BugReportModal from "@/components/BugReportModal";
import AppDownloadModal, { AppDownloadOption } from "@/components/AppDownloadModal";
import KofiModal from "@/components/KofiModal";
import SoftwareIcon from "@/components/SoftwareIcon";
import SoftwareTooltip from "@/components/SoftwareTooltip";

type Review = {
  id: string;
  app_id: string;
  user_name: string;
  user_email?: string;
  is_anonymous: boolean;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
};

type AppDetail = {
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
  repositories?: { id?: string; type: string; url: string; label?: string }[];
  cover_image?: string;
  gallery_images: string[];
  languages?: string[];
  version: string;
  release_date: string;
  downloads_count?: number;
  avg_rating?: number;
  reviews_count?: number;
  is_draft?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  reviews?: Review[];
};

export default function AppDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { locale, t } = useI18n();
  const [mounted, setMounted] = useState(false);

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isKofiModalOpen, setIsKofiModalOpen] = useState(false);

  const supportedOSList = useMemo(() => {
    if (!app) return [];
    if (Array.isArray(app.supported_os) && app.supported_os.length > 0) {
      return app.supported_os;
    }
    const detected = new Set<'windows' | 'macos' | 'linux'>();
    (app.downloads || []).filter(d => !!d.url?.trim() && !d.url.includes('example.com')).forEach(d => {
      if (d.os && ['windows', 'macos', 'linux'].includes(d.os as any)) {
        detected.add(d.os as any);
      } else if (d.name) {
        const n = d.name.toLowerCase();
        if (n.includes('win')) detected.add('windows');
        if (n.includes('mac') || n.includes('apple') || n.includes('dmg')) detected.add('macos');
        if (n.includes('linux') || n.includes('deb') || n.includes('appimage')) detected.add('linux');
      }
    });
    if (detected.size === 0 && app.download_url?.trim() && !app.download_url.includes('example.com')) {
      detected.add('windows');
    }
    return Array.from(detected);
  }, [app]);

  const validDownloads: import('@/lib/db').AppDownloadOption[] = React.useMemo(() => {
    if (!app) return [];
    const list = (app.downloads || []).filter(d => !!d.url?.trim() && !d.url.includes('example.com'));
    if (list.length > 0) return list;
    if (app.download_url?.trim() && !app.download_url.includes('example.com')) {
      return [{
        name: app.host_app || (locale === 'hy' ? 'Հիմնական նիշք' : 'Primary File'),
        url: app.download_url,
        icon: app.host_app_icon,
        os: 'windows' as const
      }];
    }
    return [];
  }, [app, locale]);

  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (app?.cover_image?.trim()) {
      list.push(app.cover_image.trim());
    }
    if (Array.isArray(app?.gallery_images)) {
      app.gallery_images.forEach(img => {
        if (img?.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    return list;
  }, [app]);

  const hasMultipleDownloads = validDownloads.length > 1;

  const appRepositories = useMemo(() => {
    if (!app) return [];
    if (Array.isArray(app.repositories) && app.repositories.length > 0) {
      return app.repositories.filter(r => !!r.url?.trim());
    }
    if (app.repository_url?.trim()) {
      return [{
        type: app.repository_type || 'github',
        url: app.repository_url.trim(),
        label: app.repository_type === 'gitlab' ? 'GitLab' : (app.repository_type === 'bitbucket' ? 'Bitbucket' : (app.repository_type === 'code' ? 'Code' : 'GitHub'))
      }];
    }
    return [];
  }, [app]);

  const renderRepoSvgIcon = (type: string, url: string, size = 22) => {
    const isGitLab = type === 'gitlab' || (!type && url.includes('gitlab'));
    const isBitbucket = type === 'bitbucket' || (!type && url.includes('bitbucket'));
    const isCode = type === 'code';
    if (isGitLab) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 5.48 2a.44.44 0 0 1 .4.28l2.22 6.86h7.8l2.22-6.86a.44.44 0 0 1 .4-.28.42.42 0 0 1 .77.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z" />
        </svg>
      );
    }
    if (isBitbucket) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.61 3a1.44 1.44 0 0 0-1.44 1.64l2.49 14.86A1.66 1.66 0 0 0 5.3 21h13.4a1.66 1.66 0 0 0 1.64-1.5l2.49-14.86A1.44 1.44 0 0 0 21.39 3H2.61zm10.74 12.35h-2.7L9.38 9.5h5.24l-1.27 5.85z"/>
        </svg>
      );
    }
    if (isCode) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    );
  };

  // Sticky CTA and Description Collapsible States
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const descContentRef = useRef<HTMLDivElement>(null);
  const descInnerRef = useRef<HTMLDivElement>(null);
  const [descFullHeight, setDescFullHeight] = useState<number | null>(null);
  const [isHeroCtaVisible, setIsHeroCtaVisible] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionLong, setIsDescriptionLong] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reviews submission state
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formIsAnonymous, setFormIsAnonymous] = useState(false);
  const [formComment, setFormComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadAppDetail() {
      if (!id) return;
      try {
        let adminToken = typeof window !== 'undefined' ? (localStorage.getItem('hdesign_admin_token') || '') : '';
        if (!adminToken && typeof document !== 'undefined') {
          const match = document.cookie.match(/hdesign_admin_token=([^;]+)/);
          if (match) adminToken = decodeURIComponent(match[1]);
        }
        const res = await fetch(`/api/apps/${id}`, {
          headers: adminToken ? { Authorization: adminToken } : {},
          cache: "no-store"
        });
        if (!res.ok) throw new Error("Հավելվածը չի գտնվել");
        const data: AppDetail = await res.json();
        setApp(data);
        setReviewsList(data.reviews || []);
      } catch (err: any) {
        setError(err.message || "Սխալ տվյալները բեռնելիս");
      } finally {
        setLoading(false);
      }
    }
    loadAppDetail();
  }, [id]);

  useEffect(() => {
    const target = heroCtaRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroCtaVisible(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: "-80px 0px 0px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, app]);

  useEffect(() => {
    const updateHeight = () => {
      if (descInnerRef.current) {
        const height = descInnerRef.current.scrollHeight;
        setDescFullHeight(height);
        if (height > 380) {
          setIsDescriptionLong(true);
        } else {
          setIsDescriptionLong(false);
        }
      }
    };
    updateHeight();
    const timer = setTimeout(updateHeight, 350);
    return () => clearTimeout(timer);
  }, [app, locale]);

  const handleToggleDescription = () => {
    if (isDescriptionExpanded && descContentRef.current) {
      const rect = descContentRef.current.getBoundingClientRect();
      if (rect.top < 90) {
        window.scrollTo({
          top: window.scrollY + rect.top - 110,
          behavior: 'smooth'
        });
      }
    }
    setIsDescriptionExpanded(prev => !prev);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewMessage(null);

    try {
      const res = await fetch("/api/apps/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: id,
          rating: formRating,
          user_name: formIsAnonymous ? "Անանուն" : (formName.trim() || (locale === "hy" ? "Այցելու" : "Visitor")),
          user_email: formEmail.trim(),
          is_anonymous: formIsAnonymous,
          comment: formComment.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Սխալ մեկնաբանությունն ուղարկելիս");

      setReviewMessage({
        type: 'success',
        text: locale === "hy"
          ? "Շնորհակալություն։ Ձեր գնահատականը հաջողությամբ ուղարկվել է և կհրապարակվի մոդերացիայից հետո։"
          : "Thank you! Your rating and review have been submitted and will appear after moderation."
      });

      // Clear form
      setFormComment("");
      if (!formIsAnonymous) {
        setFormName("");
        setFormEmail("");
      }
    } catch (err: any) {
      setReviewMessage({
        type: 'error',
        text: err.message || "Failed to submit review"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <main className="shell" style={{ paddingTop: "200px", minHeight: "80vh" }}>
        <LoadingAnimation message={locale === "hy" ? "Բեռնվում է..." : "Loading..."} fullPage={false} />
      </main>
    );
  }

  if (error || !app) {
    return (
      <main className="shell" style={{ paddingTop: "200px", minHeight: "70vh", textAlign: "center" }}>
        <div style={{ padding: "60px 20px", background: "var(--panel)", borderRadius: "20px", border: "1px solid var(--panel-border)" }}>
          <h2 style={{ color: "var(--text)", marginBottom: "12px" }}>
            {locale === "hy" ? "Հավելվածը չի գտնվել" : "App Not Found"}
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            {locale === "hy" ? "Նշված հավելվածը հնարավոր է ջնջվել է կամ հղումը սխալ է:" : "The requested app could not be found."}
          </p>
          <Link href="/apps" style={{ textDecoration: "none" }}>
            <hd-button
              suppressHydrationWarning
              data-height="42px"
              data-thickness="2px"
              data-color="var(--accent)"
              data-text-color="#ffffff"
            >
              {locale === "hy" ? "Վերադառնալ Հավելվածների ցանկ" : "Back to Apps"}
            </hd-button>
          </Link>
        </div>
      </main>
    );
  }

  const title = locale === "hy" ? app.title_am : app.title_en;
  const shortDesc = locale === "hy" ? app.short_desc_am : app.short_desc_en;
  const detailedMd = locale === "hy"
    ? (app.description_md_am || app.description_md_en || "")
    : (app.description_md_en || app.description_md_am || "");

  const ratingStars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <main className="shell apps-page-container" style={{ paddingTop: "200px", minHeight: "85vh", paddingBottom: "100px" }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px", fontSize: "0.85rem", color: "var(--muted)" }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>HDesign</Link>
        <span>/</span>
        <Link href="/apps" style={{ color: "inherit", textDecoration: "none" }}>
          {locale === "hy" ? "Հավելվածներ" : "Apps"}
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text)", fontWeight: 600 }}>{title}</span>
      </div>

      {/* Draft Notification Banner */}
      {(app.is_draft || app.status === 'draft') && (
        <div
          style={{
            background: 'rgba(255, 152, 0, 0.12)',
            border: '1px solid rgba(255, 152, 0, 0.35)',
            borderRadius: '16px',
            padding: '14px 22px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#ff9800',
            fontWeight: 700,
            fontSize: '0.92rem'
          }}
        >
          <span className="hd-icon icon-Warning" style={{ fontSize: "1.3rem" }} />
          <span>
            {locale === "hy"
              ? "Այս հավելվածը պահված է որպես սևագիր և հասանելի է միայն ադմինիստրատորին:"
              : "This app is currently saved as a draft and is visible only to administrators."}
          </span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HERO / OVERVIEW LAYOUT
          Left: Media Slider | Right: Main Info & Actions
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="app-detail-hero"
        style={{
          background: "var(--panel)",
          borderRadius: "24px",
          border: "1px solid var(--panel-border)",
          padding: "36px",
          boxShadow: "var(--shadow)",
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: "40px",
          marginBottom: "40px",
          alignItems: "stretch"
        }}
      >
        {/* Left Side: Media Gallery Slider */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
          <AppGallerySlider images={galleryImages} title={title} />
        </div>

        {/* Right Side: Main Information & CTA */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "100%", justifyContent: "space-between" }}>
          {/* Top Block: Badges, Title, Rating, Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Header Badges & Host Software */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {/* Draft Status Badge */}
              {(app.is_draft || app.status === 'draft') && (
                <span
                  style={{
                    background: "#d97706",
                    color: "#ffffff",
                    padding: "6px 14px",
                    borderRadius: "30px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
                    letterSpacing: "0.02em"
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  {locale === "hy" ? "Սևագիր" : "Draft"}
                </span>
              )}

              {/* Software Tag / Badges (Only for plugin if host_app is present) */}
              {app.app_type === "plugin" && app.host_app && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {app.host_app.split(',').map(s => s.trim()).filter(Boolean).map((h, i) => (
                    <SoftwareTooltip key={i} name={h}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--bg)",
                          padding: "6px",
                          borderRadius: "10px",
                          border: "1px solid var(--panel-border)"
                        }}
                      >
                        <SoftwareIcon name={h} iconUrl={app.host_app_icon} size={20} />
                      </div>
                    </SoftwareTooltip>
                  ))}
                </div>
              )}

              {/* Plugin vs Standalone Tag */}
              <span
                style={{
                  background: app.app_type === "standalone" ? "rgba(33, 150, 243, 0.15)" : "rgba(156, 39, 176, 0.15)",
                  color: app.app_type === "standalone" ? "#2196f3" : "#ab47bc",
                  border: `1px solid ${app.app_type === "standalone" ? "rgba(33, 150, 243, 0.3)" : "rgba(156, 39, 176, 0.3)"}`,
                  padding: "6px 12px",
                  borderRadius: "30px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}
              >
                {app.app_type === "standalone"
                  ? (locale === "hy" ? "Առանձին Հավելված" : "Standalone App")
                  : (locale === "hy" ? "Խրվակ / Սկրիպտ" : "Plugin / Script")}
              </span>

              {/* Version Pill */}
              <span
                style={{
                  background: "var(--bg)",
                  color: "var(--muted)",
                  padding: "6px 14px",
                  borderRadius: "30px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  border: "1px solid var(--panel-border)"
                }}
              >
                {app.version}
              </span>

              {/* Languages Badge */}
              {app.languages && app.languages.length > 0 && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--bg)",
                    padding: "6px 14px",
                    borderRadius: "30px",
                    border: "1px solid var(--panel-border)",
                    fontSize: "0.8rem",
                    color: "var(--text)"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span style={{ fontWeight: 600 }}>{app.languages.join(", ")}</span>
                </div>
              )}

              {/* Last Updated Date Pill */}
              {(app.updated_at || app.release_date) && (
                <span
                  style={{
                    background: "var(--bg)",
                    color: "var(--muted)",
                    padding: "6px 14px",
                    borderRadius: "30px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    border: "1px solid var(--panel-border)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {locale === "hy" ? "Թարմացվել է՝ " : "Updated: "}
                  {new Date(app.updated_at || app.release_date).toLocaleDateString(locale === "hy" ? "hy-AM" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              )}
            </div>

            {/* Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "22pt", fontWeight: 900, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
                {title}
              </h1>
              {(app.is_draft || app.status === 'draft') && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    color: "#d97706",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em"
                  }}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d97706" }} />
                  {locale === "hy" ? "Սևագիր" : "Draft"}
                </span>
              )}
            </div>

            {/* Rating Summary Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <HDesignStars rating={app.avg_rating ?? 0} size={22} gap={4} />
              <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)" }}>
                {(app.avg_rating && app.avg_rating > 0) ? app.avg_rating.toFixed(1) : "0"}
              </span>
              <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                ({app.reviews_count || reviewsList.length} {locale === "hy" ? "մեկնաբանություն" : "reviews"})
              </span>
            </div>

            {/* Short Description */}
            {shortDesc && (
              <p style={{ fontSize: "1.05rem", color: "var(--text)", opacity: 0.85, lineHeight: "1.6", margin: 0 }}>
                {shortDesc}
              </p>
            )}
          </div>

          {/* Bottom Block: Pricing & CTA Buttons (Aligned to bottom of slider) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "auto", paddingTop: "20px" }}>
            {/* Pricing Display */}
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "16px",
                background: "var(--bg)",
                border: "1px solid var(--panel-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", display: "block" }}>
                  {locale === "hy" ? "Արժեք" : "Price"}
                </span>
                <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)" }}>
                  {app.is_paid
                    ? `${(app.price || 0).toLocaleString()} ${app.currency || 'AMD'}`
                    : (locale === "hy" ? "Անվճար" : "Free")}
                </span>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", display: "block" }}>
                  {locale === "hy" ? "Ներբեռնումներ" : "Downloads"}
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent)" }}>
                  {(app.downloads_count || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div ref={heroCtaRef} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "stretch", gap: "10px", width: "100%" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {app.is_paid ? (
                    <a
                      href={app.store_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none", width: "100%", display: "block" }}
                    >
                      <hd-button
                        suppressHydrationWarning
                        data-width="100%"
                        data-height="52px"
                        data-thickness="3px"
                        data-font-size="1.02rem"
                        data-color="rgba(229, 57, 53, 0.9)"
                        data-text-color="#ffffff"
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                          <span>{locale === "hy" ? "Գնել արտաքին խանութում" : "Buy on External Store"}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                          </svg>
                        </span>
                      </hd-button>
                    </a>
                  ) : (
                    <div style={{ width: "100%" }} onClick={() => setIsDownloadModalOpen(true)}>
                      <hd-button
                        suppressHydrationWarning
                        data-width="100%"
                        data-height="52px"
                        data-thickness="3px"
                        data-font-size="1.02rem"
                        data-color="var(--accent)"
                        data-text-color="#ffffff"
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                          <i className="hd-icon hd-icon-download" style={{ fontSize: "1.25rem", lineHeight: 1 }} />
                          <span>
                            {locale === "hy"
                              ? (validDownloads.length > 1 ? `Ներբեռնել (${validDownloads.length} տարբերակ)` : "Ներբեռնել")
                              : (validDownloads.length > 1 ? `Download (${validDownloads.length} options)` : "Download")}
                          </span>
                          {validDownloads.length > 1 && (
                            <span className="hd-icon icon-Chevrolt-Arrow-Bottom" style={{ fontSize: "0.75rem", lineHeight: 1, marginLeft: "2px" }} />
                          )}
                        </span>
                      </hd-button>
                    </div>
                  )}
                </div>

                {/* Repository Icon Buttons (GitHub, GitLab, Bitbucket, etc.) */}
                {appRepositories.map((repo, rIdx) => {
                  const titleLabel = repo.label || (
                    repo.type === 'gitlab' ? 'GitLab' :
                    repo.type === 'bitbucket' ? 'Bitbucket' :
                    repo.type === 'code' ? (locale === 'hy' ? 'Կոդ' : 'Source Code') : 'GitHub'
                  );
                  return (
                    <a
                      key={repo.id || repo.url || rIdx}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-repo-link"
                      title={titleLabel}
                      style={{ textDecoration: "none", flexShrink: 0 }}
                    >
                      <hd-button
                        suppressHydrationWarning
                        className="app-repo-btn"
                        data-width="52px"
                        data-height="52px"
                        data-thickness="3px"
                        data-padding="0 20px"
                        data-wrapper-padding="0 20px"
                        data-color="var(--bg)"
                        data-text-color="var(--text)"
                      >
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {renderRepoSvgIcon(repo.type, repo.url, 22)}
                        </span>
                      </hd-button>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM SECTION: DETAILED INFO & REVIEWS
          75% Left Description + 25% Right Sticky Technical Specs
          ══════════════════════════════════════════════════════════════════════ */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 1fr)", 
          gap: "36px", 
          alignItems: "start" 
        }} 
        className="app-detail-content-grid"
      >
        {/* Left Column: Markdown Description + Reviews (75% width) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "36px", minWidth: 0 }}>
          <div
            style={{
              background: "var(--panel)",
              borderRadius: "24px",
              border: "1px solid var(--panel-border)",
              padding: "40px",
              boxShadow: "var(--shadow)",
              position: "relative",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)", margin: "0 0 24px 0", borderBottom: "1px solid var(--panel-border)", paddingBottom: "16px" }}>
              {locale === "hy" ? "Մանրամասն Նկարագրություն" : "Detailed Overview"}
            </h2>

            <div
              ref={descContentRef}
              style={{
                maxHeight: !isDescriptionLong
                  ? "none"
                  : isDescriptionExpanded
                  ? `${(descFullHeight || 3000) + 40}px`
                  : "380px",
                overflow: "hidden",
                position: "relative",
                transition: "max-height 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <div ref={descInnerRef} style={{ paddingBottom: isDescriptionLong ? "12px" : "0px" }}>
                {detailedMd ? (
                  <MarkdownRenderer content={detailedMd} />
                ) : (
                  <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
                    {locale === "hy" ? "Մանրամասն նկարագրություն նշված չէ:" : "No detailed overview provided."}
                  </p>
                )}
              </div>

              {/* Gradient Fade-out overlay when collapsed */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "140px",
                  background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, var(--panel) 95%)",
                  pointerEvents: "none",
                  opacity: isDescriptionLong && !isDescriptionExpanded ? 1 : 0,
                  transition: "opacity 0.4s ease"
                }}
              />
            </div>

            {/* Toggle Read More / Show Less Button */}
            {isDescriptionLong && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={handleToggleDescription}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "var(--bg)",
                    border: "1px solid var(--panel-border)",
                    borderRadius: "24px",
                    padding: "10px 24px",
                    color: "var(--text)",
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--accent)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--panel-border)";
                    e.currentTarget.style.color = "var(--text)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span>
                    {isDescriptionExpanded
                      ? (locale === "hy" ? "Կոծկել" : "Show Less")
                      : (locale === "hy" ? "Կարդալ ավելին" : "Read More")}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: isDescriptionExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              REVIEWS & RATINGS SECTION
              5-Star Rating System & Guest Submission Form
              ══════════════════════════════════════════════════════════════════════ */}
          <div
            className="app-reviews-section"
            style={{
              background: "var(--panel)",
              borderRadius: "24px",
              border: "1px solid var(--panel-border)",
              padding: "40px",
              boxShadow: "var(--shadow)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--text)", margin: "0 0 6px 0" }}>
                  {locale === "hy" ? "Գնահատականներ և Մեկնաբանություններ" : "Ratings & Reviews"}
                </h2>
                <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
                  {locale === "hy" ? "Կիսվեք ձեր կարծիքով կամ փորձով այս հավելվածի վերաբերյալ։" : "Share your thoughts and feedback about this app."}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  background: "var(--bg)",
                  padding: "12px 24px",
                  borderRadius: "16px",
                  border: "1px solid var(--panel-border)"
                }}
              >
                <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>
                  {(app.avg_rating && app.avg_rating > 0) ? app.avg_rating.toFixed(1) : "0"}
                </div>
                <div>
                  <div style={{ marginBottom: "4px" }}>
                    <HDesignStars rating={app.avg_rating ?? 0} size={18} gap={3} />
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    {reviewsList.length} {locale === "hy" ? "կարծիք" : "ratings"}
                  </span>
                </div>
              </div>
            </div>

            {/* Reviews Layout: List of Reviews + Submit Form */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "40px", alignItems: "start" }} className="reviews-layout-grid">
              {/* Left: Approved Reviews List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0" }}>
                  {locale === "hy" ? "Օգտատերերի Կարծիքները" : "User Reviews"} ({reviewsList.length})
                </h3>

                {reviewsList.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", border: "1px dashed var(--panel-border)", borderRadius: "16px", color: "var(--muted)" }}>
                    <p style={{ margin: 0 }}>
                      {locale === "hy" ? "Առայժմ մեկնաբանություններ չկան։ Եղեք առաջինը, ով կգնահատի։" : "No reviews yet. Be the first to share your experience!"}
                    </p>
                  </div>
                ) : (
                  reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "16px",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "var(--accent)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.9rem"
                            }}
                          >
                            {rev.is_anonymous ? "?" : (rev.user_name ? rev.user_name[0].toUpperCase() : "U")}
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", display: "block" }}>
                              {rev.user_name}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                              {new Date(rev.created_at).toLocaleDateString(locale === "hy" ? "hy-AM" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>

                        {/* Stars */}
                        <HDesignStars rating={rev.rating} size={15} gap={2} />
                      </div>

                      {rev.comment && rev.comment.trim() ? (
                        <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--text)", opacity: 0.9, lineHeight: "1.5" }}>
                          {rev.comment}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {/* Right: Guest Review Form */}
              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--panel-border)",
                  borderRadius: "20px",
                  padding: "28px"
                }}
              >
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)", margin: "0 0 6px 0" }}>
                  {locale === "hy" ? "Թողնել Կարծիք" : "Write a Review"}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 20px 0" }}>
                  {locale === "hy" ? "Գրանցում չի պահանջվում։" : "No registration required."}
                </p>

                {reviewMessage && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      marginBottom: "20px",
                      fontSize: "0.88rem",
                      lineHeight: "1.4",
                      background: reviewMessage.type === "success" ? "rgba(74, 137, 124, 0.15)" : "rgba(229, 57, 53, 0.15)",
                      color: reviewMessage.type === "success" ? "var(--accent)" : "#e53935",
                      border: `1px solid ${reviewMessage.type === "success" ? "var(--accent)" : "rgba(229, 57, 53, 0.3)"}`
                    }}
                  >
                    {reviewMessage.text}
                  </div>
                )}

                <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Star Rating Input */}
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)", display: "block", marginBottom: "10px" }}>
                      {locale === "hy" ? "Ձեր գնահատականը՝" : "Your Rating:"} <span style={{ color: "#ffcc00", fontWeight: 800 }}>★ {formRating} / 5</span>
                    </span>
                    <HDesignStars
                      rating={hoverRating !== null ? hoverRating : formRating}
                      size={32}
                      gap={6}
                      interactive={true}
                      onRate={(star) => setFormRating(star)}
                    />
                  </div>

                  {/* Anonymous Checkbox / Toggle */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "0.88rem",
                      color: "var(--text)",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                    onClick={() => setFormIsAnonymous(!formIsAnonymous)}
                  >
                    <hd-checkbox
                      suppressHydrationWarning
                      checked={formIsAnonymous}
                      data-thickness="3px"
                      data-size="16px"
                      onChange={(e: any) => setFormIsAnonymous(e.target.checked)}
                    />
                    <span>{locale === "hy" ? "Թողնել կարծիքը որպես «Անանուն»" : "Post review as Anonymous"}</span>
                  </div>

                  {/* Name & Email Fields (Disabled/Hidden if anonymous) */}
                  {!formIsAnonymous && (
                    <>
                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                          {locale === "hy" ? "Անուն (ըստ ցանկության)" : "Name (optional)"}
                        </label>
                        <hd-input
                          suppressHydrationWarning
                          placeholder={locale === "hy" ? "Ձեր անունը" : "Your name"}
                          value={formName}
                          onInput={(e: any) => setFormName(e.target.value)}
                          data-width="100%"
                          data-height="44px"
                          data-thickness="2px"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                          {locale === "hy" ? "Էլ. փոստ (ըստ ցանկության)" : "Email (optional)"}
                        </label>
                        <hd-input
                          suppressHydrationWarning
                          type="email"
                          placeholder="example@mail.com"
                          value={formEmail}
                          onInput={(e: any) => setFormEmail(e.target.value)}
                          data-width="100%"
                          data-height="44px"
                          data-thickness="2px"
                        />
                      </div>
                    </>
                  )}

                  {/* Comment Text Area */}
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                      {locale === "hy" ? "Մեկնաբանություն (ըստ ցանկության)" : "Comment (optional)"}
                    </label>
                    {mounted ? (
                      <hd-textarea
                        suppressHydrationWarning
                        placeholder={locale === "hy" ? "Գրեք ձեր տպավորությունների մասին (ըստ ցանկության)..." : "Write your feedback (optional)..."}
                        value={formComment}
                        onInput={(e: any) => setFormComment(e.target.value)}
                        data-width="100%"
                        data-height="110px"
                        data-thickness="2px"
                      />
                    ) : (
                      <textarea
                        placeholder={locale === "hy" ? "Գրեք ձեր տպավորությունների մասին (ըստ ցանկության)..." : "Write your feedback (optional)..."}
                        value={formComment}
                        onChange={(e: any) => setFormComment(e.target.value)}
                        style={{ width: "100%", height: "110px", background: "var(--bg)", border: "1px solid var(--panel-border)", borderRadius: "8px", padding: "10px", color: "var(--text)" }}
                      />
                    )}
                  </div>

                  {/* Submit Button */}
                  {mounted ? (
                    <hd-button
                      suppressHydrationWarning
                      data-height="46px"
                      data-thickness="3px"
                      data-color="var(--accent)"
                      data-text-color="#ffffff"
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                    >
                      {submittingReview ? (
                        <span>{locale === "hy" ? "Ուղարկվում է..." : "Submitting..."}</span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          <span>{locale === "hy" ? "Ուղարկել Կարծիքը" : "Submit Review"}</span>
                        </span>
                      )}
                    </hd-button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      style={{ height: "46px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, padding: "0 20px" }}
                    >
                      {locale === "hy" ? "Ուղարկել Կարծիքը" : "Submit Review"}
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Specifications (25% width, Sticky) */}
        <div 
          className="app-detail-sticky-sidebar"
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "24px",
            position: "sticky",
            top: "calc(var(--admin-bar-height, 0px) + 96px)",
            alignSelf: "flex-start",
            zIndex: 20
          }}
        >
          {/* Metadata Card */}
          <div
            style={{
              background: "var(--panel)",
              borderRadius: "20px",
              border: "1px solid var(--panel-border)",
              padding: "24px",
              boxShadow: "var(--shadow)"
            }}
          >
            {/* Ko-fi Support Button (Above Specifications Title) */}
            <div style={{ marginBottom: "16px" }} onClick={() => setIsKofiModalOpen(true)}>
              <hd-button
                suppressHydrationWarning
                data-width="100%"
                data-height="44px"
                data-thickness="2.5px"
                data-font-size="0.92rem"
                data-color="#F4EFE7"
                data-text-color="#192025"
                style={{ cursor: "pointer", width: "100%", display: "block" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", lineHeight: 1, textAlign: "center", fontWeight: 800 }}>
                  <span>{locale === "hy" ? "Տուր մի բաժակ սուրճ" : "Buy me a coffee"}</span>
                </span>
              </hd-button>
            </div>

            {/* Header with Title and Sticky CTA Button */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
                {locale === "hy" ? "Տեխնիկական Տվյալներ" : "Specifications"}
              </h3>

              {/* Sticky Top Download / Action Button (Appears when main Hero CTA is scrolled out of view) */}
              {!isHeroCtaVisible && (
                <div
                  style={{
                    animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "stretch", gap: "8px", width: "100%" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {app.is_paid ? (
                        <a
                          href={app.store_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", width: "100%", display: "block" }}
                        >
                          <hd-button
                            suppressHydrationWarning
                            data-width="100%"
                            data-height="46px"
                            data-thickness="2.5px"
                            data-font-size="0.9rem"
                            data-color="rgba(229, 57, 53, 0.9)"
                            data-text-color="#ffffff"
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 800, letterSpacing: "0.5px" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                              </svg>
                              <span>{locale === "hy" ? "ԳՆԵԼ" : "BUY NOW"} ({app.price ? `${app.price.toLocaleString()} ${app.currency || 'AMD'}` : ''})</span>
                            </span>
                          </hd-button>
                        </a>
                      ) : (
                        <div style={{ width: "100%" }} onClick={() => setIsDownloadModalOpen(true)}>
                          <hd-button
                            suppressHydrationWarning
                            data-width="100%"
                            data-height="46px"
                            data-thickness="2.5px"
                            data-font-size="0.9rem"
                            data-color="var(--accent)"
                            data-text-color="#ffffff"
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 800, letterSpacing: "0.5px" }}>
                              <i className="hd-icon hd-icon-download" style={{ fontSize: "1.1rem", lineHeight: 1 }} />
                              <span>
                                {locale === "hy"
                                  ? (validDownloads.length > 1 ? `ՆԵՐԲԵՌՆԵԼ (${validDownloads.length})` : "ՆԵՐԲԵՌՆԵԼ")
                                  : (validDownloads.length > 1 ? `DOWNLOAD (${validDownloads.length})` : "DOWNLOAD")}
                              </span>
                            </span>
                          </hd-button>
                        </div>
                      )}
                    </div>

                    {/* Sticky Repository Icon Buttons */}
                    {appRepositories.map((repo, rIdx) => {
                      const titleLabel = repo.label || (
                        repo.type === 'gitlab' ? 'GitLab' :
                        repo.type === 'bitbucket' ? 'Bitbucket' :
                        repo.type === 'code' ? (locale === 'hy' ? 'Կոդ' : 'Source Code') : 'GitHub'
                      );
                      return (
                        <a
                          key={repo.id || repo.url || rIdx}
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="app-repo-link"
                          title={titleLabel}
                          style={{ textDecoration: "none", flexShrink: 0 }}
                        >
                          <hd-button
                            suppressHydrationWarning
                            className="app-repo-btn"
                            data-width="46px"
                            data-height="46px"
                            data-thickness="2.5px"
                            data-padding="0 20px"
                            data-wrapper-padding="0 20px"
                            data-color="var(--bg)"
                            data-text-color="var(--text)"
                          >
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {renderRepoSvgIcon(repo.type, repo.url, 18)}
                            </span>
                          </hd-button>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--panel-border)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--muted)" }}>{locale === "hy" ? "Տարբերակ (Version)" : "Version"}</span>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>{app.version}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--panel-border)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--muted)" }}>{locale === "hy" ? "Թողարկման ամսաթիվ" : "Release Date"}</span>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>{app.release_date || "—"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--panel-border)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--muted)" }}>{locale === "hy" ? "Թարմացման ամսաթիվ" : "Last Updated"}</span>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>
                  {app.updated_at 
                    ? new Date(app.updated_at).toLocaleDateString(locale === "hy" ? "hy-AM" : "en-US", { year: "numeric", month: "short", day: "numeric" })
                    : (app.release_date || "—")}
                </span>
              </div>

              {/* Օպերացիոն Համակարգեր (ԳՀ / OS) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--panel-border)", paddingBottom: "10px", gap: "8px" }}>
                <span style={{ color: "var(--muted)" }}>{locale === "hy" ? "ԳՀ (OS)" : "Operating System"}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
                  {supportedOSList.length > 0 ? (
                    supportedOSList.map((osKey) => {
                      const osLabel = osKey === 'windows' ? 'Windows' : (osKey === 'macos' ? 'macOS' : 'Linux');
                      const osIcon = osKey === 'windows' ? '/icons/windows.svg' : (osKey === 'macos' ? '/icons/apple.svg' : '/icons/linux.svg');
                      return (
                        <span
                          key={osKey}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "var(--bg)",
                            border: "1px solid var(--panel-border)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            color: "var(--text)"
                          }}
                        >
                          <SoftwareIcon name={osLabel} iconUrl={osIcon} size={15} />
                          <span>{osLabel}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>—</span>
                  )}
                </div>
              </div>

              {app.app_type === "plugin" && app.host_app && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--panel-border)", paddingBottom: "10px", gap: "8px" }}>
                  <span style={{ color: "var(--muted)" }}>{locale === "hy" ? "Ծրագիր" : "Software"}</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
                    {app.host_app.split(',').map(s => s.trim()).filter(Boolean).map((h, i) => (
                      <SoftwareTooltip key={i} name={h}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px",
                            borderRadius: "6px",
                            background: "rgba(74, 137, 124, 0.1)",
                            color: "var(--text)"
                          }}
                        >
                          <SoftwareIcon name={h} iconUrl={app.host_app_icon} size={18} />
                        </span>
                      </SoftwareTooltip>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--panel-border)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--muted)" }}>{locale === "hy" ? "Տիպ" : "Type"}</span>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>
                  {app.app_type === "standalone" ? (locale === "hy" ? "Առանձին Հավելված" : "Standalone App") : (locale === "hy" ? "Խրվակ" : "Plugin")}
                </span>
              </div>

              {app.languages && app.languages.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--panel-border)", paddingBottom: "10px" }}>
                  <span style={{ color: "var(--muted)" }}>{locale === "hy" ? "Լեզուներ" : "Languages"}</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
                    {app.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "var(--bg)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          border: "1px solid var(--panel-border)",
                          fontWeight: 600,
                          color: "var(--text)"
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>{locale === "hy" ? "Լիցենզիա" : "License"}</span>
                <span style={{ fontWeight: 700, color: app.is_paid ? "#e53935" : "#43a047" }}>
                  {app.is_paid ? (locale === "hy" ? "Առևտրային (Commercial)" : "Commercial") : (locale === "hy" ? "Անվճար (Free)" : "Free")}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Report Bug Card in Sidebar */}
          <div
            style={{
              marginTop: "20px",
              background: "var(--panel)",
              borderRadius: "20px",
              border: "1px dashed var(--panel-border)",
              padding: "20px",
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>🐛</div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem", color: "var(--text)" }}>
              {locale === "hy" ? "Սխալ կամ վրե՞պ եք նկատել:" : "Found a bug or issue?"}
            </h4>
            <p style={{ margin: "0 0 14px 0", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.4 }}>
              {locale === "hy"
                ? "Օգնեք մեզ բարելավել հավելվածը՝ զեկուցելով խնդրի մասին։"
                : "Help us improve by submitting a quick bug report."}
            </p>
            <button
              type="button"
              onClick={() => setIsBugModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 18px",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                color: "#d97706",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.84rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <span>{locale === "hy" ? "Զեկուցել վրեպի մասին" : "Report a Bug"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bug Report Modal */}
      {app && (
        <BugReportModal
          isOpen={isBugModalOpen}
          onClose={() => setIsBugModalOpen(false)}
          appId={app.id}
          appTitle={title}
          appVersion={app.version}
        />
      )}

      {/* Download Modal for Multi-Target Apps */}
      {app && (
        <AppDownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          appId={app.id}
          appTitle={title}
          appVersion={app.version}
          downloads={validDownloads}
          locale={locale}
          onDownloaded={(newCount) => {
            setApp(prev => prev ? {
              ...prev,
              downloads_count: newCount !== undefined ? newCount : ((prev.downloads_count || 0) + 1)
            } : prev);
          }}
        />
      )}

      {/* Ko-fi Support Modal */}
      <KofiModal
        isOpen={isKofiModalOpen}
        onClose={() => setIsKofiModalOpen(false)}
      />
    </main>
  );
}
