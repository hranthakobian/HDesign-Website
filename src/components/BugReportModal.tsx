"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  appTitle: string;
  appVersion?: string;
}

export default function BugReportModal({
  isOpen,
  onClose,
  appId,
  appTitle,
  appVersion = "v1.0.0"
}: BugReportModalProps) {
  const { locale } = useI18n();

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [os, setOs] = useState("Windows 11");
  const [version, setVersion] = useState(appVersion);
  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<{ url: string; filename: string; size?: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  useEffect(() => {
    if (!isRendered || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRendered, isClosing, onClose]);

  if (!isRendered) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/apps/bug-reports/upload", {
          method: "POST",
          body: formData
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Սխալ ֆայլը վերբեռնելիս:");
        }

        const data = await res.json();
        setMediaFiles(prev => [...prev, { url: data.url, filename: data.filename || file.name, size: data.size || file.size }]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ֆայլի վերբեռնումը ձախողվեց:");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!userEmail.trim() || !userEmail.includes("@")) {
      setErrorMessage(locale === "hy" ? "Խնդրում ենք լրացնել վավեր էլ․ հասցե:" : "Please provide a valid email.");
      return;
    }

    if (!subject.trim()) {
      setErrorMessage(locale === "hy" ? "Խնդրում ենք նշել թեման / վերնագիրը:" : "Please provide a subject.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage(locale === "hy" ? "Խնդրում ենք մանրամասն նկարագրել վրեպը:" : "Please describe the bug.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/apps/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          app_title: appTitle,
          user_name: userName.trim() || undefined,
          user_email: userEmail.trim(),
          subject: subject.trim(),
          description: description.trim(),
          version: version.trim() || undefined,
          os: os.trim() || undefined,
          media_files: mediaFiles.map(m => m.url)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Սխալ զեկույցն ուղարկելիս:");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Չհաջողվեց ուղարկել զեկույցը:");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`hd-modal-backdrop ${isClosing ? "closing" : ""}`}
      data-modal-backdrop="true"
      data-closing={isClosing ? "true" : undefined}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto"
      }}
      onClick={onClose}
    >
      <div
        className={`hd-modal-container ${isClosing ? "closing" : ""}`}
        data-modal-container="true"
        data-closing={isClosing ? "true" : undefined}
        style={{
          background: "var(--panel)",
          border: "1px solid var(--panel-border)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.6)",
          overflow: "hidden",
          willChange: "transform, opacity"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "22px 28px",
            borderBottom: "1px solid var(--panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "rgba(245, 158, 11, 0.15)",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--text)" }}>
                {locale === "hy" ? "Զեկուցել վրեպի մասին" : "Report a Bug / Issue"}
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                {appTitle} {appVersion ? `(${appVersion})` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: "1.4rem",
              lineHeight: 1,
              padding: "6px 10px",
              borderRadius: "8px",
              transition: "color 0.2s"
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {isSuccess ? (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(46, 125, 50, 0.15)",
                  color: "#2e7d32",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto"
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text)" }}>
                {locale === "hy" ? "Զեկույցը հաջողությամբ ուղարկվեց" : "Report Successfully Sent"}
              </h4>
              <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5, maxWidth: "460px", margin: "0 auto 24px auto" }}>
                {locale === "hy"
                  ? "Շնորհակալություն: Ձեր զեկույցը փոխանցվել է հեղինակին (hrant@hakobian.am), իսկ հաստատման նամակն ուղարկվել է Ձեր էլ․ հասցեին (noreply@hakobian.am-ից):"
                  : "Thank you! Your report has been delivered to the developer, and a confirmation email has been sent to your inbox."}
              </p>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 24px",
                  background: "var(--accent)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer"
                }}
              >
                {locale === "hy" ? "Փակել" : "Close"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {errorMessage && (
                <div
                  style={{
                    background: "rgba(229, 57, 53, 0.12)",
                    border: "1px solid rgba(229, 57, 53, 0.35)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#e53935",
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>
                    {locale === "hy" ? "Ձեր Անունը" : "Your Name"}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder={locale === "hy" ? "Օրինակ՝ Արամ Սարգսյան" : "e.g. John Doe"}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--bg)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "10px",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>
                    {locale === "hy" ? "Էլ․ Հասցե *" : "Email Address *"}
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--bg)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "10px",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>
                  {locale === "hy" ? "Թեմա / Վերնագիր *" : "Issue Subject *"}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={locale === "hy" ? "Օրինակ՝ Ֆայլը ներմուծելիս ծրագիրը փակվում է" : "e.g. App crashes when importing SVG"}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "var(--bg)",
                    border: "1px solid var(--panel-border)",
                    borderRadius: "10px",
                    color: "var(--text)",
                    fontSize: "0.9rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* OS & Version */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>
                    {locale === "hy" ? "Օպերացիոն Համակարգ" : "Operating System"}
                  </label>
                  <select
                    value={os}
                    onChange={e => setOs(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--bg)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "10px",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="Windows 11">Windows 11</option>
                    <option value="Windows 10">Windows 10</option>
                    <option value="macOS Sonoma">macOS Sonoma</option>
                    <option value="macOS Sequoia">macOS Sequoia</option>
                    <option value="macOS Ventura">macOS Ventura</option>
                    <option value="Linux (Ubuntu / Debian)">Linux (Ubuntu / Debian)</option>
                    <option value="Այլ / Other">{locale === "hy" ? "Այլ" : "Other"}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>
                    {locale === "hy" ? "Հավելվածի տարբերակ" : "App Version"}
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    placeholder="v1.0.0"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--bg)",
                      border: "1px solid var(--panel-border)",
                      borderRadius: "10px",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>
                  {locale === "hy" ? "Վրեպի Մանրամասն Նկարագրություն *" : "Bug Description & Steps to Reproduce *"}
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={
                    locale === "hy"
                      ? "Խնդրում ենք նկարագրել․\n1. Ինչ քայլեր եք արել,\n2. Ինչ պետք է լիներ,\n3. Ինչ սխալ կամ վրեպ է տեղի ունեցել:"
                      : "Please describe what happened, steps to reproduce, and any error message you saw."
                  }
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--bg)",
                    border: "1px solid var(--panel-border)",
                    borderRadius: "10px",
                    color: "var(--text)",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Media Attachments */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text)" }}>
                  {locale === "hy" ? "Կցել մեդիա նիշքեր (նկար, սքրինշոթ, վիդեո, log)" : "Attach Media Files (Screenshots, Video, Log)"}
                </label>

                {/* Upload Trigger Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "1.5px dashed var(--panel-border)",
                    borderRadius: "12px",
                    padding: "18px",
                    textAlign: "center",
                    cursor: isUploading ? "wait" : "pointer",
                    background: "rgba(255, 255, 255, 0.01)",
                    transition: "border-color 0.2s"
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.txt,.log,.zip"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                    disabled={isUploading}
                  />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" }}>
                      {isUploading
                        ? (locale === "hy" ? "Վերբեռնվում է..." : "Uploading files...")
                        : (locale === "hy" ? "Սեղմեք նիշքեր ընտրելու համար" : "Click to select files")}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      PNG, JPG, MP4, WebM, TXT, LOG, ZIP (առավ․ 30MB)
                    </span>
                  </div>
                </div>

                {/* Uploaded Files Chips */}
                {mediaFiles.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                    {mediaFiles.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "var(--bg)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          fontSize: "0.82rem"
                        }}
                      >
                        <span style={{ color: "var(--accent)" }}>📎</span>
                        <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text)" }}>
                          {f.filename}
                        </span>
                        {f.size && (
                          <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
                            ({formatFileSize(f.size)})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--muted)",
                            cursor: "pointer",
                            padding: "0 2px",
                            fontWeight: "bold",
                            fontSize: "1rem"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notice */}
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "0.8rem",
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span>ℹ️</span>
                <span>
                  {locale === "hy"
                    ? "Զեկույցն ուղարկելիս Դուք կստանաք հաստատման նամակ noreply@hakobian.am-ից, իսկ մանրամասները կփոխանցվեն հեղինակին (hrant@hakobian.am)։"
                    : "You will receive a confirmation from noreply@hakobian.am, and details will be forwarded to the developer (hrant@hakobian.am)."}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: "1px solid var(--panel-border)",
                    borderRadius: "10px",
                    color: "var(--muted)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {locale === "hy" ? "Չեղարկել" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  style={{
                    padding: "10px 24px",
                    background: "#d97706",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    cursor: isSubmitting || isUploading ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 2px 10px rgba(217, 119, 6, 0.3)"
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span>⏳</span>
                      <span>{locale === "hy" ? "Ուղարկվում է..." : "Sending..."}</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>{locale === "hy" ? "Ուղարկել Զեկույցը" : "Send Report"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
