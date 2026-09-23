"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
 
export default function ContactPage() {
  const { t, locale } = useI18n();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [contactEmail, setContactEmail] = useState("hrant@hakobian.am");
  const [contactTel, setContactTel] = useState("+374 00 000000");
  const [contactAddressHy, setContactAddressHy] = useState("Երևան, Հայաստան");
  const [contactAddressEn, setContactAddressEn] = useState("Yerevan, Armenia");

  useEffect(() => {
    fetch("/api/general-settings")
      .then(res => res.json())
      .then(data => {
        if (data.contact_email) setContactEmail(data.contact_email);
        if (data.contact_tel) setContactTel(data.contact_tel);
        if (data.contact_address_hy) setContactAddressHy(data.contact_address_hy);
        if (data.contact_address_en) setContactAddressEn(data.contact_address_en);
      })
      .catch(err => console.error("Failed to load contact settings:", err));
  }, []);
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      setErrorMessage(t('contact_page', 'error_fields', 'Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը:'));
      return;
    }
    
    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message
        })
      });
      
      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        const errorData = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(errorData.error || t('contact_page', 'error_send', 'Տեղի ունեցավ սխալ: Խնդրում ենք փորձել մի փոքր ուշ:'));
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(t('contact_page', 'error_network', 'Ցանցային սխալ: Խնդրում ենք ստուգել կապը և փորձել կրկին:'));
    }
  };
 
  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "80vh", position: "relative" }}>
      {/* Dynamic Background Pattern */}
      <div 
        className="about-section-shell-width" 
        style={{ 
          background: "var(--panel)", 
          borderRadius: "24px", 
          overflow: "hidden", 
          position: "relative",
          padding: "60px 40px",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--shadow)"
        }}
      >
 
        <div style={{ position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "48px" }} className="contact-grid">
          
          {/* Left Column: Contact Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h1 style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--text)", margin: "0 0 8px 0" }}>{t('contact_page', 'title', 'Կապ')}</h1>
              <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "1.05rem", margin: 0 }}>
                {t('contact_page', 'subtitle', 'Ունե՞ք հարցեր կամ առաջարկներ: Գրեք ինձ և ես կպատասխանեմ հնարավորինս սեղմ ժամկետներում:')}
              </p>
            </div>
 
            {status === "success" ? (
              <div style={{ 
                background: "rgba(74, 137, 124, 0.1)", 
                border: "1px solid #4a897c", 
                borderRadius: "16px", 
                padding: "32px", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                textAlign: "center",
                gap: "16px"
              }}>
                <span className="icon-Check" style={{ fontSize: "3rem", color: "#4a897c" }} />
                <h3 style={{ fontSize: "1.4rem", fontWeight: "bold", margin: 0, color: "var(--text)" }}>{t('contact_page', 'success_title', 'Հաղորդագրությունը հաջողությամբ ուղարկվել է:')}</h3>
                <p style={{ color: "var(--text)", opacity: 0.8, margin: 0 }}>{t('contact_page', 'success_desc', 'Շնորհակալություն կապնվելու համար: Ես կպատասխանեմ ձեզ շուտով:')}</p>
                <div style={{ marginTop: "12px" }}>
                  <hd-button 
                    onClick={() => setStatus("idle")} 
                    data-width="180px" 
                    data-height="46px" 
                    data-thickness="3px"
                  >
                    {t('contact_page', 'new_msg_btn', 'Գրել նոր նամակ')}
                  </hd-button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="contact-form-row">
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{t('contact_page', 'name_label', 'Անուն *')}</span>
                    <hd-input 
                      placeholder={t('contact_page', 'name_placeholder', 'Ձեր անունը')} 
                      value={formData.name}
                      onInput={(e: any) => setFormData({ ...formData, name: e.target.value })}
                      data-width="100%"
                      data-height="48px"
                      data-thickness="3px"
                    data-font-size="14pt" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{t('contact_page', 'email_label', 'Էլ. հասցե *')}</span>
                    <hd-input 
                      placeholder={t('contact_page', 'email_placeholder', 'Ձեր էլ. հասցեն')} 
                      value={formData.email}
                      onInput={(e: any) => setFormData({ ...formData, email: e.target.value })}
                      data-width="100%"
                      data-height="48px"
                      data-thickness="3px"
                    data-font-size="14pt" />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{t('contact_page', 'subject_label', 'Թեմա')}</span>
                  <hd-input 
                    placeholder={t('contact_page', 'subject_placeholder', 'Նամակի թեման')} 
                    value={formData.subject}
                    onInput={(e: any) => setFormData({ ...formData, subject: e.target.value })}
                    data-width="100%"
                    data-height="48px"
                    data-thickness="3px"
                  data-font-size="14pt" />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{t('contact_page', 'message_label', 'Հաղորդագրություն *')}</span>
                  <hd-textarea 
                    placeholder={t('contact_page', 'message_placeholder', 'Գրեք ձեր հաղորդագրությունը այստեղ...')} 
                    value={formData.message}
                    onInput={(e: any) => setFormData({ ...formData, message: e.target.value })}
                    data-width="100%"
                  data-font-size="14pt" data-height="200pt" />
                </div>

                {status === "error" && (
                  <p style={{ color: "#ff6b6b", fontSize: "0.9rem", margin: 0 }}>
                    * {errorMessage || t('contact_page', 'error_fields', 'Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը:')}
                  </p>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                  <hd-button 
                    onClick={handleSubmit}
                    data-width="160px"
                    data-height="52px"
                    data-thickness="3px"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? t('contact_page', 'submitting_btn', 'Ուղարկվում է...') : t('contact_page', 'submit_btn', 'Ուղարկել')}
                  </hd-button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Contact Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingLeft: "24px", borderLeft: "1px solid var(--panel-border)" }} className="contact-details-col">
            <div>
              <h2 style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--text)", margin: "0 0 8px 0" }}>{t('contact_page', 'details_title', 'Կապորդներ')}</h2>
              <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.6", margin: 0 }}>
                {t('contact_page', 'details_desc', 'Ազատ զգացեք կապվելու ցանկացած հարցով կամ համագործակցության առաջարկներով:')}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  background: "var(--btn-bg)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center"
                }}>
                  <span className="icon-Mail" style={{ fontSize: "1.2rem", color: "var(--text)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{t('contact_page', 'email_label_small', 'Էլ. հասցե')}</span>
                  <a href={`mailto:${contactEmail}`} style={{ color: "var(--text)", textDecoration: "none", fontWeight: "600" }}>{contactEmail}</a>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  background: "var(--btn-bg)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center"
                }}>
                  <span className="icon-Call" style={{ fontSize: "1.2rem", color: "var(--text)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{t('contact_page', 'phone_label_small', 'Հեռախոս')}</span>
                  <a href={`tel:${contactTel.replaceAll(" ", "")}`} style={{ color: "var(--text)", textDecoration: "none", fontWeight: "600" }}>{contactTel}</a>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  background: "var(--btn-bg)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center"
                }}>
                  <span className="icon-Map-Pin" style={{ fontSize: "1.2rem", color: "var(--text)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{t('contact_page', 'address_label_small', 'Հասցե')}</span>
                  <span style={{ color: "var(--text)", fontWeight: "600" }}>
                    {locale === 'en' ? contactAddressEn : contactAddressHy}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Icons / Links */}
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              {["icon-Earth", "icon-Cursor", "icon-Notifications"].map((icon, idx) => (
                <a 
                  key={idx} 
                  href="#" 
                  style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "10px", 
                    background: "var(--btn-bg)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "var(--text)",
                    transition: "all 0.3s ease"
                  }}
                  className="social-btn-hover"
                >
                  <span className={icon} style={{ fontSize: "1rem" }} />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
