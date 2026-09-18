"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import AppGallerySlider from "@/components/AppGallerySlider";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import LoadingAnimation from "@/components/LoadingAnimation";
import { HDesignStars } from "@/components/RatingSystem";
import BugReportModal from "@/components/BugReportModal";

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

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComment.trim()) {
      setReviewMessage({
        type: 'error',
        text: locale === "hy" ? "Խնդրում ենք լրացնել մեկնաբանության տեքստը:" : "Please write a comment."
      });
      return;
    }

    setSubmittingReview(true);
    setReviewMessage(null);

    try {
      const res = await fetch("/api/apps/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: id,
          rating: formRating,
          user_name: formIsAnonymous ? "Անանուն" : formName.trim(),
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
          ? "Շնորհակալություն։ Ձեր մեկնաբանությունը և գնահատականը հաջողությամբ ուղարկվել են և կհրապարակվեն մոդերացիայից հետո։"
          : "Thank you! Your review has been submitted and will appear after moderation."
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
      <main className="shell" style={{ marginTop: "160px", minHeight: "80vh" }}>
        <LoadingAnimation message={locale === "hy" ? "Բեռնվում է..." : "Loading..."} fullPage={false} />
      </main>
    );
  }

  if (error || !app) {
    return (
      <main className="shell" style={{ marginTop: "160px", minHeight: "70vh", textAlign: "center" }}>
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

  const galleryImages = app.gallery_images && app.gallery_images.length > 0
    ? app.gallery_images
    : (app.cover_image ? [app.cover_image] : []);

  const ratingStars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <main className="shell" style={{ marginTop: "130px", minHeight: "85vh", paddingBottom: "100px" }}>
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
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <span>
            {locale === "hy"
              ? "Այս հավելվածը պահպանված է որպես սևագիր և հասանելի է միայն ադմինիստրատորին:"
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
          gridTemplateColumns: "1.1fr 1fr",
          gap: "40px",
          marginBottom: "40px",
          alignItems: "start"
        }}
      >
        {/* Left Side: Media Gallery Slider */}
        <div style={{ width: "100%" }}>
          <AppGallerySlider images={galleryImages} title={title} />
        </div>

        {/* Right Side: Main Information & CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--bg)",
                  padding: "6px 14px",
                  borderRadius: "30px",
                  border: "1px solid var(--panel-border)"
                }}
              >
                {app.host_app_icon ? (
                  <img src={app.host_app_icon} alt={app.host_app} style={{ width: "18px", height: "18px", objectFit: "contain" }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                )}
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)" }}>
                  {app.host_app}
                </span>
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
            <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
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
            <HDesignStars rating={app.avg_rating || 5.0} size={22} gap={4} />
            <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)" }}>
              {app.avg_rating || 5.0}
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

            {app.downloads_count !== undefined && app.downloads_count > 0 && (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", display: "block" }}>
                  {locale === "hy" ? "Ներբեռնումներ" : "Downloads"}
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent)" }}>
                  {app.downloads_count.toLocaleString()}+
                </span>
              </div>
            )}
          </div>

          {/* CTA Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
            {app.is_paid ? (
              <a
                href={app.store_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", width: "100%" }}
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
              <a
                href={app.download_url || "#"}
                download
                style={{ textDecoration: "none", width: "100%" }}
              >
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
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>{locale === "hy" ? "Ներբեռնել Անվճար" : "Direct Download (Free)"}</span>
                  </span>
                </hd-button>
              </a>
            )}

            {/* Report Bug Button */}
            <button
              type="button"
              onClick={() => setIsBugModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "11px 16px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px dashed var(--panel-border)",
                borderRadius: "12px",
                color: "var(--muted)",
                fontSize: "0.86rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "#d97706";
                e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.5)";
                e.currentTarget.style.background = "rgba(245, 158, 11, 0.06)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.borderColor = "var(--panel-border)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m8 2 1.88 1.88" />
                <path d="M14.12 3.88 16 2" />
                <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
                <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
                <path d="M12 20v-9" />
                <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
                <path d="M6 13H2" />
                <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
                <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
                <path d="M22 13h-4" />
                <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
              </svg>
              <span>{locale === "hy" ? "Զեկուցել վրեպի մասին" : "Report a Bug / Issue"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM SECTION: DETAILED INFO & REVIEWS
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px", alignItems: "start" }} className="app-detail-content-grid">
        {/* Left Column: Markdown Description */}
        <div
          style={{
            background: "var(--panel)",
            borderRadius: "24px",
            border: "1px solid var(--panel-border)",
            padding: "40px",
            boxShadow: "var(--shadow)"
          }}
        >
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)", margin: "0 0 24px 0", borderBottom: "1px solid var(--panel-border)", paddingBottom: "16px" }}>
            {locale === "hy" ? "Մանրամասն Նկարագրություն" : "Detailed Overview"}
          </h2>

          {detailedMd ? (
            <MarkdownRenderer content={detailedMd} />
          ) : (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
              {locale === "hy" ? "Մանրամասն նկարագրություն նշված չէ:" : "No detailed overview provided."}
            </p>
          )}
        </div>

        {/* Right Column: Metadata & Specifications */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Metadata Card */}
          <div
            style={{
              background: "var(--panel)",
              borderRadius: "20px",
              border: "1px solid var(--panel-border)",
              padding: "28px",
              boxShadow: "var(--shadow)"
            }}
          >
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)", margin: "0 0 20px 0" }}>
              {locale === "hy" ? "Տեխնիկական Տվյալներ" : "Specifications"}
            </h3>

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

              {app.app_type === "plugin" && app.host_app && (
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--panel-border)", paddingBottom: "10px" }}>
                  <span style={{ color: "var(--muted)" }}>{locale === "hy" ? "Ծրագիր" : "Software"}</span>
                  <span style={{ fontWeight: 700, color: "var(--text)", textAlign: "right" }}>{app.host_app}</span>
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

      {/* ══════════════════════════════════════════════════════════════════════
          REVIEWS & RATINGS SECTION
          5-Star Rating System & Guest Submission Form
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="app-reviews-section"
        style={{
          marginTop: "48px",
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
              {app.avg_rating || 5.0}
            </div>
            <div>
              <div style={{ marginBottom: "4px" }}>
                <HDesignStars rating={app.avg_rating || 5.0} size={18} gap={3} />
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

                  <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--text)", opacity: 0.9, lineHeight: "1.5" }}>
                    {rev.comment}
                  </p>
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
                      {locale === "hy" ? "Անուն *" : "Name *"}
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
                  {locale === "hy" ? "Մեկնաբանություն *" : "Comment *"}
                </label>
                <hd-textarea
                  suppressHydrationWarning
                  placeholder={locale === "hy" ? "Գրեք ձեր տպավորությունների մասին..." : "Write your feedback..."}
                  value={formComment}
                  onInput={(e: any) => setFormComment(e.target.value)}
                  data-width="100%"
                  data-height="110px"
                  data-thickness="2px"
                />
              </div>

              {/* Submit Button */}
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
            </form>
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
    </main>
  );
}
