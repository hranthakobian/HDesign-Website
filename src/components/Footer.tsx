"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import SectionBackground from "@/components/SectionBackground";

export default function Footer() {
  const pathname = usePathname();
  const { t } = useI18n();

  // Contact form states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });
  const [submittingContact, setSubmittingContact] = useState(false);

  // If we are in the admin area, do not show the footer
  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      setContactStatus({ type: "error", text: t('contact', 'error_fields', 'Խնդրում ենք լրացնել բոլոր դաշտերը:') });
      return;
    }
    
    setSubmittingContact(true);
    setContactStatus({ type: null, text: "" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage
        })
      });

      const data = await res.json();
      if (res.ok) {
        setContactStatus({ type: "success", text: t('contact', 'success_msg', 'Շնորհակալություն! Ձեր հաղորդագրությունը հաջողությամբ ուղարկվեց:') });
        setContactName("");
        setContactEmail("");
        setContactMessage("");
      } else {
        setContactStatus({ type: "error", text: data.error || "Error occurred" });
      }
    } catch (err) {
      setContactStatus({ type: "error", text: t('contact', 'error_conn', 'Կապի սխալ. Խնդրում ենք փորձել կրկին:') });
    } finally {
      setSubmittingContact(false);
    }
  };

  return (
    <footer id="contact" className="footer-section-fullwidth" style={{ background: "transparent", borderRadius: "0", border: "none" }}>
      {/* Dynamic SVG Background */}
      <SectionBackground color="#6A3E73" className="footer-svg-bg" type="footer" />

      <div className="footer-content-container" style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 0 40px", position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: "40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <img src="/logo.png" alt="Logo" style={{ height: "30px", objectFit: "contain" }} />
                <span style={{ fontSize: "1.4rem", fontWeight: "800", color: "#ffffff" }}>HDesign</span>
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
                <div>{t('contact', 'email_label', 'Էլ. հասցե՝')} info@hakobian.am</div>
                <div>{t('contact', 'phone_label', 'Հեռախոս՝')} +374 00 000000</div>
                <div>{t('contact', 'address_label', 'Երևան, Հայաստան')}</div>
              </div>
            </div>
          </div>

          {/* Glassmorphic Contact Form */}
          <div style={{ 
            background: "rgba(255, 255, 255, 0.05)", 
            backdropFilter: "blur(20px)", 
            border: "1px solid rgba(255, 255, 255, 0.1)", 
            padding: "30px", 
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#ffffff", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
              {t('contact', 'form_title', 'Հետադարձ Կապ')}
            </h4>
            <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <hd-input 
                  placeholder={t('contact', 'name_placeholder', 'Ձեր անունը...')}
                  value={contactName}
                  onInput={(e: any) => setContactName(e.target.value)}
                  data-width="100%"
                  data-height="42px"
                  data-thickness="3px"
                />
              </div>
              <div>
                <hd-input 
                  type="email"
                  placeholder={t('contact', 'email_placeholder', 'Էլ. հասցե...')}
                  value={contactEmail}
                  onInput={(e: any) => setContactEmail(e.target.value)}
                  data-width="100%"
                  data-height="42px"
                  data-thickness="3px"
                />
              </div>
              <div>
                <hd-textarea 
                  placeholder={t('contact', 'message_placeholder', 'Ձեր հաղորդագրությունը...')}
                  value={contactMessage}
                  onInput={(e: any) => setContactMessage(e.target.value)}
                  data-width="100%"
                  data-disable-horizontal-resize="true"
                  style={{ minHeight: "100px" }}
                />
              </div>

              {contactStatus.text && (
                <div style={{ 
                  fontSize: "0.85rem", 
                  color: contactStatus.type === "success" ? "#81c784" : "#e57373",
                  background: contactStatus.type === "success" ? "rgba(129, 199, 132, 0.1)" : "rgba(229, 115, 115, 0.1)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: contactStatus.type === "success" ? "1px solid rgba(129, 199, 132, 0.2)" : "1px solid rgba(229, 115, 115, 0.2)"
                }}>
                  {contactStatus.text}
                </div>
              )}

              <hd-button 
                type="submit"
                data-width="100%" 
                data-height="44px"
                data-thickness="3px"
                disabled={submittingContact}
                style={{ opacity: submittingContact ? 0.7 : 1 }}
              >
                {submittingContact ? t('contact', 'submitting_btn', 'Ուղարկվում է...') : t('contact', 'submit_btn', 'Ուղարկել')}
              </hd-button>
            </form>
          </div>
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
