"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import SectionBackground from "@/components/SectionBackground";

export default function Footer({ 
  siteTitle,
  contactEmail = "hrant@hakobian.am",
  contactTel = "+374 00 000000",
  contactAddressHy = "Երևան, Հայաստան",
  contactAddressEn = "Yerevan, Armenia"
}: { 
  siteTitle?: { hy: string; en: string };
  contactEmail?: string;
  contactTel?: string;
  contactAddressHy?: string;
  contactAddressEn?: string;
}) {
  const pathname = usePathname();
  const { t, locale } = useI18n();

  // Subscription form states
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });
  const [submittingSubscribe, setSubmittingSubscribe] = useState(false);

  // If we are in the admin area, do not show the footer
  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail) {
      setSubscribeStatus({ type: "error", text: t('contact', 'subscribe_error', 'Խնդրում ենք լրացնել էլ. հասցեն:') });
      return;
    }
    
    setSubmittingSubscribe(true);
    setSubscribeStatus({ type: null, text: "" });

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subscribeEmail
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubscribeStatus({ 
          type: "success", 
          text: t('contact', 'subscribe_success', 'Շնորհակալություն բաժանորդագրվելու համար:') 
        });
        setSubscribeEmail("");
      } else {
        const errorText = data.error === 'Email already subscribed.' 
          ? t('contact', 'subscribe_already_exists', 'Այս էլ. հասցեն արդեն բաժանորդագրված է:')
          : (data.error || "Error occurred");
        setSubscribeStatus({ type: "error", text: errorText });
      }
    } catch (err) {
      setSubscribeStatus({ type: "error", text: t('contact', 'error_conn', 'Կապի սխալ. Խնդրում ենք փորել կրկին:') });
    } finally {
      setSubmittingSubscribe(false);
    }
  };

  return (
    <footer id="contact" className="footer-section-fullwidth" style={{ background: "transparent", borderRadius: "0", border: "none" }}>
      {/* Dynamic SVG Background */}
      <SectionBackground color="#6A3E73" className="footer-svg-bg" type="footer" />

      <div className="footer-content-container" style={{ maxWidth: "1500px", margin: "0 auto", padding: "80px 0 40px", position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: "40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px" }}>
          <hd-reveal data-direction="up" data-duration="900">
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <img src="/logo.png" alt="Logo" style={{ height: "30px", objectFit: "contain" }} />
                  <span style={{ fontSize: "1.4rem", fontWeight: "800", color: "#ffffff" }}>
                    {locale === 'en' ? (siteTitle?.en || "HDesign") : (siteTitle?.hy || "HDesign")}
                  </span>
                </div>
                <p style={{ color: "#ffffff", opacity: 0.8, fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>
                  {t('contact', 'desc', 'Ստեղծարար և Գործնական դիզայն լուծումներ: Յուրաքանչյուր ինտերֆեյս ստեղծված է սիրով և մաթեմատիկական ճշգրտությամբ:')}
                </p>
              </div>
              
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>
                  {t('contact', 'links_title', 'Հղումներ')}
                </h4>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <Link href="/" style={{ color: "#ffffff", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem" }}>
                    {t('contact', 'nav_home', 'Տուն')}
                  </Link>
                  <Link href="/about" style={{ color: "#ffffff", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem" }}>
                    {t('contact', 'nav_about', 'Մասին')}
                  </Link>
                  <Link href="/works" style={{ color: "#ffffff", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem" }}>
                    {t('contact', 'nav_works', 'Աշխատանքներ')}
                  </Link>
                  <Link href="/hdesign/docs" style={{ color: "#ffffff", opacity: 0.8, textDecoration: "none", fontSize: "0.9rem" }}>
                    {t('contact', 'nav_docs', 'Փաստաթղթեր')}
                  </Link>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>
                  {t('contact', 'contacts_title', 'Կոնտակտներ')}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", color: "#ffffff", opacity: 0.8, fontSize: "0.9rem" }}>
                  <div>{t('contact', 'email_label', 'Էլ. հասցե՝')} <a href={`mailto:${contactEmail}`} style={{ color: '#ffffff', textDecoration: 'none' }}>{contactEmail}</a></div>
                  <div>{t('contact', 'phone_label', 'Հեռախոս՝')} <a href={`tel:${contactTel.replaceAll(' ', '')}`} style={{ color: '#ffffff', textDecoration: 'none' }}>{contactTel}</a></div>
                  <div>{locale === 'en' ? contactAddressEn : contactAddressHy}</div>
                </div>
              </div>
            </div>
          </hd-reveal>

          {/* Subscription Form (White Card Style) */}
          <hd-reveal data-direction="up" data-delay="150" data-duration="1000">
            <div style={{ 
              background: "#ffffff", 
              border: "1px solid rgba(0, 0, 0, 0.08)", 
              padding: "30px", 
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
            }}>
              <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#1a202c", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
                {t('contact', 'subscribe_title', 'Բաժանորդագրվել')}
              </h4>
              <p style={{ color: "#4a5568", opacity: 0.9, fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>
                {t('contact', 'subscribe_desc', 'Բաժանորդագրվեք մեր էլ. նամակներին՝ նորությունները և թարմացումները բաց չթողնելու համար։')}
              </p>
              <form onSubmit={handleSubscribeSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <hd-input 
                    type="email"
                    placeholder={t('contact', 'email_placeholder', 'Էլ. հասցե...')}
                    value={subscribeEmail}
                    onInput={(e: any) => setSubscribeEmail(e.target.value)}
                    data-width="100%"
                    data-height="42px"
                    data-thickness="3px"
                    data-color="#6A3E73"
                    style={{ '--text-color': '#1a202c', '--primary-color': '#6A3E73' } as any}
                  data-font-size="14pt" />
                </div>

                {subscribeStatus.text && (
                  <div style={{ 
                    fontSize: "0.85rem", 
                    color: subscribeStatus.type === "success" ? "#276749" : "#9b2c2c",
                    background: subscribeStatus.type === "success" ? "rgba(72, 187, 120, 0.1)" : "rgba(245, 101, 101, 0.1)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: subscribeStatus.type === "success" ? "1px solid rgba(72, 187, 120, 0.2)" : "1px solid rgba(245, 101, 101, 0.2)",
                    fontWeight: "600"
                  }}>
                    {subscribeStatus.text}
                  </div>
                )}

                <hd-button 
                  type="submit"
                  data-width="100%" 
                  data-height="44px"
                  data-thickness="3px"
                  disabled={submittingSubscribe}
                  style={{ 
                    opacity: submittingSubscribe ? 0.7 : 1,
                    background: "linear-gradient(135deg, #6A3E73 0%, #ab47bc 100%)",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(106, 62, 115, 0.3)"
                  }}
                >
                  {submittingSubscribe ? t('contact', 'submitting_btn', 'Ուղարկվում է...') : t('contact', 'subscribe_btn', 'Բաժանորդագրվել')}
                </hd-button>
              </form>
            </div>
          </hd-reveal>
        </div>

        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ffffff", opacity: 0.7, fontSize: "0.85rem" }}>
          <div>© {new Date().getFullYear()} {t('contact', 'copyright', 'HDesign. Բոլոր իրավունքները պաշտպանված են։')}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>{t('contact', 'designed_by', 'Դիզայնը՝ Հրանտ Հակոբյանի')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
