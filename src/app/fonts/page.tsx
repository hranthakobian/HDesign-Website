"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import LoadingAnimation from "@/components/LoadingAnimation";

type Font = {
  id: string;
  name_am: string;
  name_en: string;
  category: string;
  creator?: string;
  year?: string;
  description_am?: string;
  description_en?: string;
  downloadable: boolean;
  paid: boolean;
  price?: string;
  font_file_url: string;
  download_url?: string;
  purchase_url?: string;
  created_at?: string;
};

export default function FontsListingPage() {
  const { locale, t } = useI18n();
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]); // "free", "paid"
  const [selectedDownloadable, setSelectedDownloadable] = useState<string>("all"); // "all", "yes", "no"
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    async function loadFonts() {
      try {
        const res = await fetch("/api/fonts");
        if (!res.ok) throw new Error("Failed to fetch fonts");
        const data = await res.json();
        setFonts(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load fonts");
      } finally {
        setLoading(false);
      }
    }
    loadFonts();
  }, []);

  // Filtered Fonts
  const filteredFonts = useMemo(() => {
    return fonts.filter((f) => {
      // 1. Search Query
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        f.name_am.toLowerCase().includes(query) ||
        f.name_en.toLowerCase().includes(query) ||
        (f.creator && f.creator.toLowerCase().includes(query)) ||
        (f.description_am && f.description_am.toLowerCase().includes(query)) ||
        (f.description_en && f.description_en.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Categories
      if (selectedCategories.length > 0 && !selectedCategories.includes(f.category)) {
        return false;
      }

      // 3. Licenses (Free / Paid)
      if (selectedLicenses.length > 0) {
        const isFree = !f.paid;
        const wantsFree = selectedLicenses.includes("free");
        const wantsPaid = selectedLicenses.includes("paid");
        if (wantsFree && wantsPaid) {
          // both selected, allow all
        } else if (wantsFree && f.paid) {
          return false;
        } else if (wantsPaid && !f.paid) {
          return false;
        }
      }

      // 4. Downloadable status
      if (selectedDownloadable === "yes" && !f.downloadable) return false;
      if (selectedDownloadable === "no" && f.downloadable) return false;

      return true;
    });
  }, [fonts, searchQuery, selectedCategories, selectedLicenses, selectedDownloadable]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleLicense = (lic: string) => {
    setSelectedLicenses((prev) =>
      prev.includes(lic) ? prev.filter((l) => l !== lic) : [...prev, lic]
    );
  };

  const activePreviewText = customText || (locale === "hy" ? "Հրանտ Հակոբյան Դիզայն 2026" : "Hrant Hakobyan Design 2026");

  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "85vh", paddingBottom: "80px" }}>
      {/* Dynamic Font Face Loading for listing previews */}
      {fonts.map((f) => (
        <style
          key={f.id}
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'preview-font-${f.id}';
                src: url('${f.font_file_url}') format('${
              f.font_file_url.endsWith(".otf")
                ? "opentype"
                : f.font_file_url.endsWith(".woff")
                ? "woff"
                : f.font_file_url.endsWith(".woff2")
                ? "woff2"
                : "truetype"
            }');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
              }
            `,
          }}
        />
      ))}

      {/* Header Panel */}
      <div
        className="about-section-shell-width"
        style={{
          background: "var(--panel)",
          borderRadius: "24px",
          overflow: "hidden",
          position: "relative",
          padding: "50px 40px",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--shadow)",
          marginBottom: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h1 style={{ fontSize: "2.8rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>
          {t("fonts", "title", "HDesign Տառատեսակներ")}
        </h1>
        <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "1.15rem", maxWidth: "700px", lineHeight: "1.6", margin: 0 }}>
          {t("fonts", "subtitle", "Մասնագիտացված հայերեն և անգլերեն տառատեսակներ ձեր դիզայն նախագծերի համար")}
        </p>
      </div>

      {/* Control Sandbox / Search & Filters */}
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--panel-border)",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "32px",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Search row */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <hd-input
              placeholder={t("fonts", "search_placeholder", "Որոնել տառատեսակներ...")}
              value={searchQuery}
              onInput={(e: any) => setSearchQuery(e.target.value)}
              data-width="100%"
              data-height="46px"
            />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <hd-button
              onClick={() => setShowAdvanced(!showAdvanced)}
              data-width="200px"
              data-height="46px"
              data-thickness="1px"
              style={{
                background: showAdvanced ? "var(--btn-hover-bg)" : "transparent",
                color: "var(--text)",
              }}
            >
              {t("fonts", "advanced_search", "Ընդլայնված որոնում")}
            </hd-button>
          </div>
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvanced && (
          <div
            style={{
              paddingTop: "20px",
              borderTop: "1px solid var(--panel-border)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "24px",
              animation: "fadeIn 0.2s ease",
            }}
          >
            {/* Category Filter */}
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "12px" }}>
                {t("fonts", "category_label", "Կատեգորիա")}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {["Sans-Serif", "Serif", "Display", "Monospace", "Handwriting"].map((cat) => (
                  <label key={cat} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      style={{ accentColor: "var(--accent)", width: "16px", height: "16px" }}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            {/* License Filter */}
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "12px" }}>
                {t("fonts", "license_label", "Լիցենզիա")}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={selectedLicenses.includes("free")}
                    onChange={() => toggleLicense("free")}
                    style={{ accentColor: "var(--accent)", width: "16px", height: "16px" }}
                  />
                  {t("fonts", "price_free", "Անվճար")}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={selectedLicenses.includes("paid")}
                    onChange={() => toggleLicense("paid")}
                    style={{ accentColor: "var(--accent)", width: "16px", height: "16px" }}
                  />
                  {t("fonts", "price_paid", "Վճարովի")}
                </label>
              </div>
            </div>

            {/* Downloadable Filter */}
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "12px" }}>
                {t("fonts", "downloadable", "Ներբեռնելի")}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="downloadable_status"
                    checked={selectedDownloadable === "all"}
                    onChange={() => setSelectedDownloadable("all")}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {t("fonts", "all", "Բոլորը")}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="downloadable_status"
                    checked={selectedDownloadable === "yes"}
                    onChange={() => setSelectedDownloadable("yes")}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {t("fonts", "downloadable", "Ներբեռնելի")}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="radio"
                    name="downloadable_status"
                    checked={selectedDownloadable === "no"}
                    onChange={() => setSelectedDownloadable("no")}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {locale === "hy" ? "Ոչ ներբեռնելի" : "View Only"}
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Global custom text preview row */}
        <div style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "20px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
            {t("fonts", "preview_text_placeholder", "Գրեք տեքստ փորձարկման համար...")}
          </label>
          <hd-input
            placeholder={activePreviewText}
            value={customText}
            onInput={(e: any) => setCustomText(e.target.value)}
            data-width="100%"
            data-height="44px"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <LoadingAnimation fullPage={false} message={locale === "hy" ? "Տառատեսակները բեռնվում են..." : "Loading fonts..."} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ textAlign: "center", padding: "40px", color: "#ff6b6b", background: "rgba(255,107,107,0.05)", borderRadius: "16px", border: "1px solid rgba(255,107,107,0.2)" }}>
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredFonts.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)", border: "1px dashed var(--panel-border)", borderRadius: "20px" }}>
          <span className="icon-Search" style={{ fontSize: "2.5rem", display: "block", marginBottom: "16px", opacity: 0.5 }} />
          <span>{t("fonts", "no_fonts", "Տառատեսակներ չեն գտնվել:")}</span>
        </div>
      )}

      {/* Grid of Fonts */}
      {!loading && !error && filteredFonts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          {filteredFonts.map((font) => (
            <Link
              key={font.id}
              href={`/fonts/${font.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="font-item-card"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--panel-border)",
                  borderRadius: "20px",
                  padding: "30px",
                  boxShadow: "var(--shadow)",
                  display: "grid",
                  gridTemplateColumns: "1.2fr 2fr",
                  gap: "30px",
                  transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                  cursor: "pointer",
                }}
              >
                {/* Left Card: Information */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderRight: "1px solid var(--panel-border)", paddingRight: "30px" }} className="font-card-info-side">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div>
                      <h3 style={{ fontSize: "1.3rem", fontWeight: "800", margin: "0 0 4px 0", color: "var(--text)" }}>
                        {locale === "hy" ? font.name_am : font.name_en}
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {font.category}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {font.paid ? (
                        <span style={{ background: "rgba(229, 57, 53, 0.15)", color: "#ef5350", border: "1px solid rgba(229,57,53,0.3)", padding: "3px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "bold" }}>
                          {font.price || t("fonts", "price_paid", "Վճարովի")}
                        </span>
                      ) : (
                        <span style={{ background: "rgba(67, 160, 71, 0.15)", color: "#66bb6a", border: "1px solid rgba(67,160,71,0.3)", padding: "3px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "bold" }}>
                          {t("fonts", "price_free", "Անվճար")}
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.75, lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {locale === "hy" ? font.description_am : font.description_en}
                  </p>

                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--muted)" }}>
                    {font.creator && (
                      <span>
                        {t("fonts", "creator_label", "Հեղինակ")}՝ <strong>{font.creator}</strong>
                      </span>
                    )}
                    {font.year && <span>{font.year}</span>}
                  </div>
                </div>

                {/* Right Card: Interactive Preview display */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }} className="font-card-preview-side">
                  <div
                    style={{
                      fontFamily: `preview-font-${font.id}, sans-serif`,
                      fontSize: "2.4rem",
                      color: "var(--text)",
                      lineHeight: "1.3",
                      wordBreak: "break-word",
                      padding: "10px 0",
                    }}
                  >
                    {activePreviewText}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Styled Hover Micro-Animations via standard embedded CSS styling tag */}
      <style jsx global>{`
        .font-item-card:hover {
          transform: translateY(-4px) scale(1.005);
          border-color: var(--accent) !important;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15) !important;
        }
        @media (max-width: 768px) {
          .font-item-card {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .font-card-info-side {
            border-right: none !important;
            padding-right: 0 !important;
            border-bottom: 1px solid var(--panel-border) !important;
            padding-bottom: 20px !important;
          }
        }
      `}</style>
    </main>
  );
}
