"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import LoadingAnimation from "@/components/LoadingAnimation";
import { SingleHDesignStar } from "@/components/RatingSystem";

export type AppData = {
  id: string;
  title_am: string;
  title_en: string;
  short_desc_am?: string;
  short_desc_en?: string;
  host_app: string;
  host_app_icon?: string;
  app_type: 'plugin' | 'standalone';
  is_paid: boolean;
  price: number;
  currency?: string;
  cover_image?: string;
  gallery_images: string[];
  version: string;
  release_date: string;
  downloads_count?: number;
  avg_rating?: number;
  reviews_count?: number;
  created_at?: string;
  updated_at?: string;
};

export default function AppsListingPage() {
  const { locale, t } = useI18n();
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [pricingFilter, setPricingFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'plugin' | 'standalone'>('all');
  const [selectedHost, setSelectedHost] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [maxAvailablePrice, setMaxAvailablePrice] = useState<number>(50000);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await fetch("/api/apps");
        if (!res.ok) throw new Error("Failed to load apps");
        const data: AppData[] = await res.json();
        setApps(data || []);

        // Calculate max price from available apps
        if (data && data.length > 0) {
          const highest = Math.max(...data.map(a => a.price || 0), 20000);
          setMaxAvailablePrice(highest);
          setMaxPrice(highest);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load apps");
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  // List of unique host software in the system
  const hostAppsList = useMemo(() => {
    const set = new Set<string>();
    apps.forEach(a => {
      if (a.app_type === 'plugin' && a.host_app) {
        a.host_app.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [apps]);

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const match =
          app.title_am?.toLowerCase().includes(q) ||
          app.title_en?.toLowerCase().includes(q) ||
          app.short_desc_am?.toLowerCase().includes(q) ||
          app.short_desc_en?.toLowerCase().includes(q) ||
          (app.host_app && app.host_app.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Pricing Filter (All / Free / Paid)
      if (pricingFilter === 'free' && app.is_paid) return false;
      if (pricingFilter === 'paid' && !app.is_paid) return false;

      // 3. Price Range Slider (only applies if paid or all)
      if (app.is_paid) {
        const price = app.price || 0;
        if (price < minPrice || price > maxPrice) return false;
      }

      // 4. Host Software Filter
      if (selectedHost !== 'all') {
        if (app.app_type === 'standalone') return false;
        const hosts = (app.host_app || '').split(',').map(s => s.trim().toLowerCase());
        if (!hosts.includes(selectedHost.toLowerCase())) {
          return false;
        }
      }

      // 5. Type (Plugin vs Standalone)
      if (selectedType !== 'all' && app.app_type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [apps, searchQuery, pricingFilter, selectedHost, selectedType, minPrice, maxPrice]);

  const resetFilters = () => {
    setSearchQuery("");
    setPricingFilter("all");
    setSelectedType("all");
    setSelectedHost("all");
    setMinPrice(0);
    setMaxPrice(maxAvailablePrice);
  };

  const getAppTitle = (app: AppData) => (locale === "hy" ? app.title_am : app.title_en);
  const getAppDesc = (app: AppData) => (locale === "hy" ? app.short_desc_am : app.short_desc_en);

  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "85vh", paddingBottom: "80px" }}>
      {/* Header Banner */}
      <div
        className="apps-header-banner"
        style={{
          background: "var(--panel)",
          borderRadius: "24px",
          position: "relative",
          padding: "50px 40px",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--shadow)",
          marginBottom: "36px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <h1 style={{ fontSize: "2.8rem", fontWeight: 900, color: "var(--text)", margin: 0 }}>
          {locale === "hy" ? "Հավելվածներ և Խրվակներ" : "Apps & Plugins"}
        </h1>
        <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "1.15rem", maxWidth: "720px", lineHeight: "1.6", margin: 0 }}>
          {locale === "hy"
            ? "Դիզայնի, անիմացիայի և ինժեներական աշխատանքների համար նախատեսված հատուկ գործիքներ, խրվակներ, սկրիպտներ և առանձին ծրագրեր։"
            : "Specialized tools, plugins, scripts, and standalone applications tailored for design, motion graphics, and CAD engineering."}
        </p>
      </div>

      {/* Filter Sandbox & Search Bar */}
      <div
        className="apps-filter-panel"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--panel-border)",
          borderRadius: "20px",
          padding: "20px 24px",
          marginBottom: "36px",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Search Input and Filter Toggle */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 240px", minWidth: "220px" }}>
            <hd-input
              suppressHydrationWarning
              placeholder={locale === "hy" ? "Որոնել ըստ անվան, ծրագրի կամ նկարագրության..." : "Search by title, host software, or description..."}
              value={searchQuery}
              onInput={(e: any) => setSearchQuery(e.target.value)}
              data-width="100%"
              data-height="36px"
              data-thickness="2px"
              data-font-size="12pt"
            />
          </div>

          {/* Type Switcher Segment */}
          <hd-segment
            suppressHydrationWarning
            value={selectedType}
            onChange={(e: any) => setSelectedType(e.target.value)}
            data-width="320px"
            data-height="36px"
            data-thickness="2px"
            data-font-size="0.82rem"
          >
            <span value="all" {...(selectedType === "all" ? { selected: true } : {})}>
              {locale === "hy" ? "Բոլորը" : "All"}
            </span>
            <span value="plugin" {...(selectedType === "plugin" ? { selected: true } : {})}>
              {locale === "hy" ? "Խրվակներ" : "Plugins"}
            </span>
            <span value="standalone" {...(selectedType === "standalone" ? { selected: true } : {})}>
              {locale === "hy" ? "Հավելվածներ" : "Applications"}
            </span>
          </hd-segment>

          {/* Pricing Tabs Quick Switch */}
          <hd-segment
            suppressHydrationWarning
            value={pricingFilter}
            onChange={(e: any) => setPricingFilter(e.target.value)}
            data-width="250px"
            data-height="36px"
            data-thickness="2px"
            data-font-size="0.82rem"
          >
            <span value="all" {...(pricingFilter === "all" ? { selected: true } : {})}>
              {locale === "hy" ? "Բոլորը" : "All"}
            </span>
            <span value="free" {...(pricingFilter === "free" ? { selected: true } : {})}>
              {locale === "hy" ? "Անվճար" : "Free"}
            </span>
            <span value="paid" {...(pricingFilter === "paid" ? { selected: true } : {})}>
              {locale === "hy" ? "Վճարովի" : "Paid"}
            </span>
          </hd-segment>

          <hd-button
            suppressHydrationWarning
            data-height="36px"
            data-thickness="2px"
            data-font-size="0.82rem"
            data-color={showAdvanced ? "var(--accent)" : "var(--bg)"}
            data-text-color={showAdvanced ? "#fff" : "var(--text)"}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 12px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              {locale === "hy" ? "Զտիչներ" : "Filters"}
            </span>
          </hd-button>
        </div>

        {/* Software Tag Quick Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", paddingTop: "2px" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)", marginRight: "4px", fontWeight: 600 }}>
            {locale === "hy" ? "Ծրագիր՝" : "Software:"}
          </span>
          <hd-button
            suppressHydrationWarning
            data-height="26px"
            data-thickness="2px"
            data-font-size="0.75rem"
            data-color={selectedHost === "all" ? "var(--accent)" : "var(--bg)"}
            data-text-color={selectedHost === "all" ? "#fff" : "var(--text)"}
            onClick={() => setSelectedHost("all")}
          >
            <span style={{ padding: "0 8px" }}>{locale === "hy" ? "Բոլորը" : "All"}</span>
          </hd-button>
          {hostAppsList.map(h => (
            <hd-button
              key={h}
              suppressHydrationWarning
              data-height="26px"
              data-thickness="2px"
              data-font-size="0.75rem"
              data-color={selectedHost === h ? "var(--accent)" : "var(--bg)"}
              data-text-color={selectedHost === h ? "#fff" : "var(--text)"}
              onClick={() => setSelectedHost(selectedHost === h ? "all" : h)}
            >
              <span style={{ padding: "0 8px" }}>{h}</span>
            </hd-button>
          ))}
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvanced && (
          <div
            style={{
              paddingTop: "20px",
              borderTop: "1px solid var(--panel-border)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
              animation: "fadeIn 0.2s ease"
            }}
          >
            {/* Type Filter: Plugin vs Standalone */}
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "10px" }}>
                {locale === "hy" ? "Կարգավիճակ / Տիպ" : "Type / Status"}
              </span>
              <hd-segment
                suppressHydrationWarning
                value={selectedType}
                onChange={(e: any) => setSelectedType(e.target.value)}
                data-width="100%"
                data-height="36px"
                data-thickness="2px"
              >
                <span value="all" {...(selectedType === "all" ? { selected: true } : {})}>
                  {locale === "hy" ? "Բոլորը" : "All"}
                </span>
                <span value="plugin" {...(selectedType === "plugin" ? { selected: true } : {})}>
                  {locale === "hy" ? "Խրվակ" : "Plugin"}
                </span>
                <span value="standalone" {...(selectedType === "standalone" ? { selected: true } : {})}>
                  {locale === "hy" ? "Առանձին Հավելված" : "Standalone App"}
                </span>
              </hd-segment>
            </div>

            {/* Price Range Filter Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)" }}>
                  {locale === "hy" ? "Գնային տիրույթ" : "Price Range"}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>
                  {minPrice.toLocaleString()} - {maxPrice.toLocaleString()} AMD
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <hd-slider
                  suppressHydrationWarning
                  min={0}
                  max={maxAvailablePrice}
                  step={500}
                  value={maxPrice}
                  onChange={(e: any) => setMaxPrice(Number(e.target.value))}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)" }}>
                  <span>0 AMD</span>
                  <span>{maxAvailablePrice.toLocaleString()} AMD</span>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <hd-button
                suppressHydrationWarning
                data-height="36px"
                data-thickness="2px"
                data-color="transparent"
                data-text-color="var(--muted)"
                onClick={resetFilters}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 10px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  {locale === "hy" ? "Վերակայել զտիչները" : "Reset Filters"}
                </span>
              </hd-button>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: "60px 0" }}>
          <LoadingAnimation message={locale === "hy" ? "Հավելվածները բեռնվում են..." : "Loading apps..."} fullPage={false} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#e53935" }}>
          <p>{error}</p>
        </div>
      )}

      {/* Empty result state */}
      {!loading && !error && filteredApps.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "var(--muted)",
            border: "1px dashed var(--panel-border)",
            borderRadius: "20px",
            background: "var(--panel)"
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5, marginBottom: "16px" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <h3 style={{ fontSize: "1.2rem", color: "var(--text)", margin: "0 0 8px 0" }}>
            {locale === "hy" ? "Հավելվածներ չեն գտնվել" : "No apps found"}
          </h3>
          <p style={{ margin: "0 0 16px 0", fontSize: "0.9rem" }}>
            {locale === "hy" ? "Փորձեք փոխել որոնման բառերը կամ վերակայել զտիչները։" : "Try adjusting your search criteria or resetting filters."}
          </p>
          <hd-button
            suppressHydrationWarning
            data-height="36px"
            data-thickness="2px"
            data-color="var(--accent)"
            data-text-color="#ffffff"
            onClick={resetFilters}
          >
            <span style={{ padding: "0 14px" }}>{locale === "hy" ? "Մաքրել զտիչները" : "Clear Filters"}</span>
          </hd-button>
        </div>
      )}

      {/* Responsive Grid of App Cards */}
      {!loading && !error && filteredApps.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "28px"
          }}
        >
          {filteredApps.map((app) => (
            <Link
              key={app.id}
              href={`/apps/${app.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="app-card"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--panel-border)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "var(--shadow)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  transition: "transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s ease",
                  cursor: "pointer"
                }}
              >
                {/* Card Media Preview */}
                <div style={{ position: "relative", height: "190px", width: "100%", background: "#111", overflow: "hidden" }}>
                  <img
                    src={app.cover_image || (app.gallery_images && app.gallery_images[0]) || "/logo.png"}
                    alt={getAppTitle(app)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s ease"
                    }}
                    className="app-card-img"
                  />
                  {/* Overlay Badges */}
                  <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", gap: "6px", flexWrap: "wrap", maxWidth: "80%" }}>
                    {app.app_type === "plugin" && app.host_app && (
                      <span
                        style={{
                          background: "rgba(0,0,0,0.65)",
                          backdropFilter: "blur(8px)",
                          color: "#fff",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        {app.host_app}
                      </span>
                    )}
                    <span
                      style={{
                        background: app.app_type === "standalone" ? "rgba(33, 150, 243, 0.85)" : "rgba(156, 39, 176, 0.85)",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase"
                      }}
                    >
                      {app.app_type === "standalone" ? (locale === "hy" ? "Ծրագիր" : "App") : (locale === "hy" ? "Խրվակ" : "Plugin")}
                    </span>
                  </div>

                  {/* Pricing Badge */}
                  <div style={{ position: "absolute", bottom: "12px", right: "12px" }}>
                    {app.is_paid ? (
                      <span
                        style={{
                          background: "rgba(229, 57, 53, 0.9)",
                          backdropFilter: "blur(8px)",
                          color: "#fff",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          fontWeight: 700
                        }}
                      >
                        {app.price ? `${app.price.toLocaleString()} ${app.currency || 'AMD'}` : (locale === "hy" ? "Վճարովի" : "Paid")}
                      </span>
                    ) : (
                      <span
                        style={{
                          background: "rgba(46, 125, 50, 0.9)",
                          backdropFilter: "blur(8px)",
                          color: "#fff",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          fontWeight: 700
                        }}
                      >
                        {locale === "hy" ? "Անվճար" : "Free"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: "22px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "10px" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text)", lineHeight: 1.3 }}>
                      {getAppTitle(app)}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", background: "rgba(74, 137, 124, 0.12)", padding: "2px 8px", borderRadius: "6px" }}>
                        {app.version}
                      </span>
                      {(app.updated_at || app.release_date) && (
                        <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                          {locale === "hy" ? "Թարմ․" : "Upd."} {new Date(app.updated_at || app.release_date).toLocaleDateString(locale === "hy" ? "hy-AM" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "0.88rem",
                      color: "var(--text)",
                      opacity: 0.75,
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      flex: 1
                    }}
                  >
                    {getAppDesc(app)}
                  </p>

                  {/* Card Footer: Rating & Action */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "14px",
                      borderTop: "1px solid var(--panel-border)",
                      marginTop: "auto"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <SingleHDesignStar size={16} active={true} />
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)" }}>
                        {app.avg_rating || 5.0}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        ({app.reviews_count || 0})
                      </span>
                    </div>

                    <hd-button
                      suppressHydrationWarning
                      data-height="30px"
                      data-thickness="2px"
                      data-font-size="0.78rem"
                      data-color="var(--accent)"
                      data-text-color="#ffffff"
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0 10px", whiteSpace: "nowrap" }}>
                        {locale === "hy" ? "Դիտել" : "View"}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </hd-button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
