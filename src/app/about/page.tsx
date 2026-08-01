"use client";
 
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
 
export default function AboutPage() {
  const { t } = useI18n();

  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "80vh", position: "relative" }}>
      {/* About Box Section */}
      <div 
        className="about-section-shell-width" 
        style={{ 
          background: "var(--panel)", 
          borderRadius: "24px", 
          overflow: "hidden", 
          position: "relative",
          padding: "80px 40px",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--shadow)"
        }}
      >
 
        {/* Floating background graphic lines */}
        <div className="about-vertical-lines top-left" style={{ opacity: 0.35 }}>
          <svg width="64" height="260" viewBox="0 0 64 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="24" height="180" rx="12" fill="var(--muted)"/>
            <rect x="40" y="80" width="24" height="180" rx="12" fill="var(--muted)"/>
          </svg>
        </div>
        <div className="about-vertical-lines bottom-right" style={{ opacity: 0.35 }}>
          <svg width="64" height="260" viewBox="0 0 64 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="80" width="24" height="180" rx="12" fill="var(--muted)"/>
            <rect x="40" y="0" width="24" height="180" rx="12" fill="var(--muted)"/>
          </svg>
        </div>
 
        <div style={{ position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "56px", alignItems: "stretch" }} className="about-grid">
          {/* Profile Photo */}
          <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", height: "100%", minHeight: "300px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}>
            <img 
              src="/profile_hrant.jpg" 
              alt="Hrant Hakobyan" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
 
          {/* Bio Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--text)", margin: 0, lineHeight: 1.1, marginTop: "-10px" }}>{t('about', 'title', 'Մասին')}</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75em", color: "var(--text)", opacity: 0.95, fontSize: "18pt", lineHeight: "1.6" }}>
              <p style={{ margin: 0 }}>
                {t('about', 'bio_p1', 'Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ճարտարապետության ֆակուլտետի 4-րդ կուրսի ուսանող եմ։ Ես մասնագիտանում եմ տառաստեղծության և բրենդինգի մեջ։')}
              </p>
              <p style={{ margin: 0 }}>
                {t('about', 'bio_p2', 'Իմ նախագծերում ես համատեղում եմ ճարտարապետական կառուցվածքայնությունն ու գրաֆիկական դիզայնի ճկունությունը: Յուրաքանչյուր տառատեսակ և տարբերանշան ինձ համար կառույց է, որն ունի իր սեփական հիմքերը, համամասնությունն ու գեղագիտական արժեքը:')}
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
              <Link href="/contact" style={{ textDecoration: "none" }}>
                <hd-button data-width="160px" data-height="52px" data-thickness="3px">
                  {t('about', 'contact_btn', 'Կապնվել')}
                </hd-button>
              </Link>
              <Link href="/works" style={{ textDecoration: "none" }}>
                <hd-button data-width="180px" data-height="52px" data-thickness="3px">
                  {t('about', 'works_btn', 'Աշխատանքներ')}
                </hd-button>
              </Link>
            </div>
          </div>
        </div>
      </div>
 
      {/* Specializations Grid Section */}
      <div style={{ marginTop: "60px" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text)", marginBottom: "32px", textAlign: "center" }}>{t('about', 'specs_title', 'Մասնագիտացումներ')}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "28px" }} className="specs-grid">
          
          {/* Spec 1 */}
          <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "20px", padding: "32px", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <span className="icon-Pencil" style={{ fontSize: "2rem", color: "var(--text)" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>{t('about', 'spec1_title', 'Տառատեսակների ստեղծում')}</h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.6" }}>
              {t('about', 'spec1_desc', 'Յուրահատուկ հայկական և լատինական տառատեսակների ձևավորում, որոնք համատեղում են պատմական ակունքները և ժամանակակից երկրաչափական միտումները:')}
            </p>
          </div>
 
          {/* Spec 2 */}
          <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "20px", padding: "32px", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <span className="icon-Image" style={{ fontSize: "2rem", color: "var(--text)" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>{t('about', 'spec2_title', 'Բրենդավորում')}</h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.6" }}>
              {t('about', 'spec2_desc', 'Տեսողական ինքնության մշակում՝ տարբերանշաններ, կորպորատիվ գույներ, տառատեսակային համակարգեր և փաթեթավորում, որոնք առանձնացնում են բրենդը շուկայում:')}
            </p>
          </div>
 
          {/* Spec 3 */}
          <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "20px", padding: "32px", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <span className="icon-Monitor" style={{ fontSize: "2rem", color: "var(--text)" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>{t('about', 'spec3_title', 'Ինտերֆեյսների դիզայն')}</h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.6" }}>
              {t('about', 'spec3_desc', 'Օգտագործողի փորձի (UX) և միջավայրերի (UI) նախագծում՝ հիմնված մոդուլային դիզայն-համակարգերի և ճշգրիտ կառուցվածքների վրա:')}
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
