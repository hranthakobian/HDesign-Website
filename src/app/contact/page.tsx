"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      return;
    }
    
    setStatus("sending");
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
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
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
              <h1 style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--text)", margin: "0 0 8px 0" }}>Կապ</h1>
              <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "1.05rem", margin: 0 }}>
                Ունե՞ք հարցեր կամ առաջարկներ: Գրեք ինձ և ես կպատասխանեմ հնարավորինս սեղմ ժամկետներում:
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
                <h3 style={{ fontSize: "1.4rem", fontWeight: "bold", margin: 0, color: "var(--text)" }}>Հաղորդագրությունը հաջողությամբ ուղարկվել է:</h3>
                <p style={{ color: "var(--text)", opacity: 0.8, margin: 0 }}>Շնորհակալություն կապնվելու համար: Ես կպատասխանեմ ձեզ շուտով:</p>
                <div style={{ marginTop: "12px" }}>
                  <hd-button 
                    onClick={() => setStatus("idle")} 
                    data-width="180px" 
                    data-height="46px" 
                    data-thickness="3px"
                  >
                    Գրել նոր նամակ
                  </hd-button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="contact-form-row">
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Անուն *</span>
                    <hd-input 
                      placeholder="Ձեր անունը" 
                      value={formData.name}
                      onInput={(e: any) => setFormData({ ...formData, name: e.target.value })}
                      data-width="100%"
                      data-height="48px"
                      data-thickness="3px"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Էլ. հասցե *</span>
                    <hd-input 
                      placeholder="Ձեր էլ. հասցեն" 
                      value={formData.email}
                      onInput={(e: any) => setFormData({ ...formData, email: e.target.value })}
                      data-width="100%"
                      data-height="48px"
                      data-thickness="3px"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Թեմա</span>
                  <hd-input 
                    placeholder="Նամակի թեման" 
                    value={formData.subject}
                    onInput={(e: any) => setFormData({ ...formData, subject: e.target.value })}
                    data-width="100%"
                    data-height="48px"
                    data-thickness="3px"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Հաղորդագրություն *</span>
                  <hd-textarea 
                    placeholder="Գրեք ձեր հաղորդագրությունը այստեղ..." 
                    value={formData.message}
                    onInput={(e: any) => setFormData({ ...formData, message: e.target.value })}
                    data-width="100%"
                  />
                </div>

                {status === "error" && (
                  <p style={{ color: "#ff6b6b", fontSize: "0.9rem", margin: 0 }}>
                    * Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը:
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
                    {status === "sending" ? "Ուղարկվում է..." : "Ուղարկել"}
                  </hd-button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Contact Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingLeft: "24px", borderLeft: "1px solid var(--panel-border)" }} className="contact-details-col">
            <div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--text)", margin: "0 0 16px 0" }}>Կոնտակտներ</h3>
              <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.6", margin: 0 }}>
                Ազատ զգացեք կապվելու ցանկացած հարցով կամ համագործակցության առաջարկներով:
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
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Էլ. հասցե</span>
                  <a href="mailto:hrant@hakobian.am" style={{ color: "var(--text)", textDecoration: "none", fontWeight: "600" }}>hrant@hakobian.am</a>
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
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Հեռախոս</span>
                  <a href="tel:+37400000000" style={{ color: "var(--text)", textDecoration: "none", fontWeight: "600" }}>+374 00 000000</a>
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
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Հասցե</span>
                  <span style={{ color: "var(--text)", fontWeight: "600" }}>Երևան, Հայաստան</span>
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
