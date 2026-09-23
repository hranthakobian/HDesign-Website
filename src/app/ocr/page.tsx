"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface OcrBlock {
  id: string;
  text: string;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
}

interface OcrStats {
  characters: number;
  words: number;
  lines: number;
  processingTimeMs: number;
}

type OcrMode = "full" | "armenian_enhanced" | "blocks" | "translate_hy" | "translate_en";

export default function OcrPage() {
  const { locale } = useI18n();

  // State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<OcrMode>("armenian_enhanced");
  
  // Results
  const [extractedText, setExtractedText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [blocks, setBlocks] = useState<OcrBlock[]>([]);
  const [stats, setStats] = useState<OcrStats | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("gemini-3.5-flash-lite");
  const [activeTab, setActiveTab] = useState<"text" | "blocks" | "translation">("text");

  // Visual Image Preview controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);

  // Settings & Keys
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Tools & Audio
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Camera
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Dropzone
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  // Load custom API key from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("hdesign_gemini_ocr_key");
      if (savedKey) setCustomApiKey(savedKey);
    } catch (_) {}
  }, []);

  // Save custom key
  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    try {
      if (key.trim()) {
        localStorage.setItem("hdesign_gemini_ocr_key", key.trim());
      } else {
        localStorage.removeItem("hdesign_gemini_ocr_key");
      }
    } catch (_) {}
    setShowSettingsModal(false);
  };

  // Clipboard paste listener (Ctrl+V anywhere on window)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in a textarea or input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            if (file) {
              handleNewFile(file);
              e.preventDefault();
              break;
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Handle new uploaded / pasted file
  const handleNewFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg(locale === "hy" ? "Խնդրում ենք ընտրել պատկերային նիշք (PNG, JPG, WEBP և այլն)։" : "Please select an image file (PNG, JPG, WEBP, etc.).");
      return;
    }

    setErrorMsg(null);
    setImageFile(file);
    setExtractedText("");
    setTranslatedText("");
    setBlocks([]);
    setStats(null);
    setZoomLevel(1);
    setRotation(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);

      // Measure dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Trigger OCR API
  const runOcr = async () => {
    if (!imageFile && !imagePreview) {
      setErrorMsg(locale === "hy" ? "Խնդրում ենք նախ բեռնել կամ տեղադրել նկար։" : "Please upload or paste an image first.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imagePreview) {
        formData.append("image", imagePreview);
      }
      formData.append("mode", mode);
      if (customApiKey.trim()) {
        formData.append("apiKey", customApiKey.trim());
      }

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (locale === "hy" ? "OCR ճանաչումը ձախողվեց։" : "OCR recognition failed."));
      }

      setExtractedText(data.text || "");
      setTranslatedText(data.translation || "");
      setBlocks(data.blocks || []);
      setStats(data.stats || null);
      setModelUsed(data.model || "Gemini Flash Lite");
      
      if (data.translation) {
        setActiveTab("translation");
      } else if (mode === "blocks" && data.blocks && data.blocks.length > 0) {
        setActiveTab("blocks");
      } else {
        setActiveTab("text");
      }
    } catch (err: any) {
      console.error("OCR Error:", err);
      setErrorMsg(err.message || (locale === "hy" ? "Տեղի ունեցավ սխալ տեքստի ճանաչման ընթացքում։" : "An error occurred during text recognition."));
    } finally {
      setIsLoading(false);
    }
  };

  // Camera Handling
  const startCamera = async () => {
    setErrorMsg(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMsg(locale === "hy" ? "Տեսախցիկի հասանելիությունը մերժվեց կամ անհասանելի է։" : "Camera access was denied or is unavailable.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-scan-${Date.now()}.jpg`, { type: "image/jpeg" });
          handleNewFile(file);
          stopCamera();
        }
      }, "image/jpeg", 0.95);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleNewFile(e.dataTransfer.files[0]);
    }
  };

  // Copy to clipboard
  const handleCopyText = (content?: string) => {
    const target = content !== undefined ? content : (activeTab === "translation" && translatedText ? translatedText : extractedText);
    if (!target) return;
    navigator.clipboard.writeText(target);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Text to Speech
  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = activeTab === "translation" && translatedText ? translatedText : extractedText;
    if (!textToRead.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Detect language
    const isArmenian = /[\u0530-\u058F]/.test(textToRead);
    utterance.lang = isArmenian ? "hy-AM" : "en-US";

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Download export
  const handleDownload = (format: "txt" | "md" | "json") => {
    const textData = activeTab === "translation" && translatedText ? translatedText : extractedText;
    let mime = "text/plain;charset=utf-8";
    let filename = `ocr-export-${Date.now()}.${format}`;
    let content = textData;

    if (format === "json") {
      mime = "application/json;charset=utf-8";
      content = JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          model: modelUsed,
          stats,
          extractedText,
          translatedText: translatedText || undefined,
          blocks,
        },
        null,
        2
      );
    } else if (format === "md") {
      mime = "text/markdown;charset=utf-8";
      content = `# OCR Transcription\n\n**Engine:** ${modelUsed}\n**Date:** ${new Date().toLocaleString()}\n\n---\n\n${textData}`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset entire tool
  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setExtractedText("");
    setTranslatedText("");
    setBlocks([]);
    setStats(null);
    setErrorMsg(null);
    setZoomLevel(1);
    setRotation(0);
    setSearchQuery("");
    if (isSpeaking && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Filter or highlight text
  const renderedText = () => {
    const text = activeTab === "translation" && translatedText ? translatedText : extractedText;
    if (!searchQuery.trim()) return text;
    return text;
  };

  return (
    <main className="shell" style={{ marginTop: "120px", marginBottom: "80px", minHeight: "85vh", position: "relative" }}>
      {/* Background Decorative Gradient Blobs */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "20%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(var(--hue), var(--saturation), 50%, 0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "300px",
          right: "10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(var(--hue), var(--saturation), 40%, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Top Header Card */}
        <header
          style={{
            background: "var(--panel)",
            borderRadius: "20px",
            padding: "24px 32px",
            border: "1px solid var(--panel-border)",
            boxShadow: "var(--shadow)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "hsla(var(--hue), var(--saturation), var(--text-lightness), 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7V4h3" />
                  <path d="M20 7V4h-3" />
                  <path d="M4 17v3h3" />
                  <path d="M20 17v3h-3" />
                  <rect x="7" y="7" width="10" height="10" rx="2" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                </svg>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: "700", margin: 0, letterSpacing: "-0.02em" }}>
                {locale === "hy" ? "Gemini Flash Lite Vision OCR" : "Gemini Flash Lite Vision OCR"}
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "hsla(150, 80%, 40%, 0.15)",
                  color: "#10b981",
                  border: "1px solid hsla(150, 80%, 40%, 0.25)",
                  letterSpacing: "0.03em",
                }}
              >
                FREE VISION ENGINE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>
              {locale === "hy"
                ? "Բարձր ճշգրտության OCR գործիք՝ հայերեն տպագիր, ձեռագիր և բազմալեզու տեքստերի վայրկենական ճանաչմամբ։"
                : "High-accuracy multimodal OCR tool powered by Google Gemini Vision with instant recognition."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Custom API Key Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              title={locale === "hy" ? "Կարգավորումներ / Սեփական API Key" : "Settings / Custom API Key"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid var(--panel-border)",
                background: customApiKey ? "hsla(var(--hue), var(--saturation), 50%, 0.12)" : "var(--btn-bg)",
                color: "var(--text)",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{customApiKey ? "API Key: Ակտիվ" : "API Key"}</span>
            </button>

            {/* Clear Button */}
            {(imagePreview || extractedText) && (
              <button
                onClick={handleReset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid hsla(0, 80%, 60%, 0.25)",
                  background: "hsla(0, 80%, 60%, 0.08)",
                  color: "#ef4444",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                <span>{locale === "hy" ? "Մաքրել" : "Clear"}</span>
              </button>
            )}
          </div>
        </header>

        {/* Error notification banner */}
        {errorMsg && (
          <div
            style={{
              background: "hsla(0, 85%, 60%, 0.12)",
              border: "1px solid hsla(0, 85%, 60%, 0.3)",
              color: "#ef4444",
              padding: "14px 20px",
              borderRadius: "14px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "18px" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Main 2-Column Grid Workspace */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1.25fr",
            gap: "24px",
            alignItems: "start",
          }}
          className="ocr-grid-layout"
        >
          {/* ================= LEFT COLUMN: Image Input & Preview ================= */}
          <section
            style={{
              background: "var(--panel)",
              borderRadius: "20px",
              padding: "24px",
              border: "1px solid var(--panel-border)",
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleNewFile(e.target.files[0]);
                }
              }}
            />

            {/* Mode selection buttons */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
                {locale === "hy" ? "ՃԱՆԱՉՄԱՆ ՌԵԺԻՄ" : "RECOGNITION MODE"}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { id: "armenian_enhanced", label: "🇦🇲 Հայերեն (տպագիր / ձեռագիր)" },
                  { id: "full", label: "📝 Ամբողջական տեքստ" },
                  { id: "blocks", label: "📦 Կոորդինատներով (Boxes)" },
                  { id: "translate_hy", label: "🌐 Թարգմանել հայերեն" },
                  { id: "translate_en", label: "🇬🇧 Թարգմանել անգլերեն" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as OcrMode)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: "1px solid",
                      borderColor: mode === item.id ? "var(--accent)" : "var(--panel-border)",
                      background: mode === item.id ? "var(--accent)" : "var(--btn-bg)",
                      color: mode === item.id ? "#ffffff" : "var(--text)",
                      fontSize: "12px",
                      fontWeight: "600",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropzone / Preview Area */}
            {!imagePreview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "var(--accent)" : "var(--panel-border)"}`,
                  background: isDragging ? "hsla(var(--hue), var(--saturation), 50%, 0.08)" : "var(--input-bg)",
                  borderRadius: "16px",
                  padding: "48px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  cursor: "pointer",
                  minHeight: "320px",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "hsla(var(--hue), var(--saturation), var(--text-lightness), 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                    marginBottom: "16px",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 8px 0" }}>
                  {locale === "hy" ? "Քաշեք նկարն այստեղ կամ սեղմեք ընտրելու համար" : "Drop image here or click to browse"}
                </h3>
                <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--muted)", maxWidth: "340px" }}>
                  {locale === "hy"
                    ? "Աջակցվում է PNG, JPG, JPEG, WEBP, GIF, BMP: Կարող եք նաև սեղմել Ctrl+V՝ պատճենված նկարը տեղադրելու համար։"
                    : "Supports PNG, JPG, JPEG, WEBP. You can also press Ctrl+V anywhere to paste an image from clipboard."}
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      background: "var(--accent)",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {locale === "hy" ? "Ընտրել նիշք" : "Choose File"}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCamera();
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      background: "var(--btn-bg)",
                      color: "var(--text)",
                      border: "1px solid var(--panel-border)",
                      fontSize: "13px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>{locale === "hy" ? "Տեսախցիկ (Camera)" : "Camera"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Image Toolbar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    padding: "6px 12px",
                    background: "var(--input-bg)",
                    borderRadius: "10px",
                    border: "1px solid var(--panel-border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      title="Zoom Out"
                      style={{
                        padding: "5px 10px",
                        background: "var(--panel)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "6px",
                        color: "var(--text)",
                        fontSize: "12px",
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: "12px", color: "var(--muted)", minWidth: "45px", textAlign: "center" }}>
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                      title="Zoom In"
                      style={{
                        padding: "5px 10px",
                        background: "var(--panel)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "6px",
                        color: "var(--text)",
                        fontSize: "12px",
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      title="Rotate 90°"
                      style={{
                        padding: "5px 10px",
                        background: "var(--panel)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "6px",
                        color: "var(--text)",
                        fontSize: "12px",
                      }}
                    >
                      ↻ 90°
                    </button>
                    <button
                      onClick={() => {
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      title="Reset"
                      style={{
                        padding: "5px 10px",
                        background: "var(--panel)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "6px",
                        color: "var(--text)",
                        fontSize: "12px",
                      }}
                    >
                      Reset
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {blocks.length > 0 && (
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--muted)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={showBoxes}
                          onChange={(e) => setShowBoxes(e.target.checked)}
                        />
                        <span>{locale === "hy" ? "Բլոկներ" : "Boxes"}</span>
                      </label>
                    )}

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "5px 10px",
                        background: "var(--panel)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "6px",
                        color: "var(--text)",
                        fontSize: "12px",
                      }}
                    >
                      {locale === "hy" ? "Փոխել" : "Change"}
                    </button>
                  </div>
                </div>

                {/* Interactive Zoomable Image Preview Area with Bounding Box Overlays */}
                <div
                  style={{
                    position: "relative",
                    overflow: "auto",
                    maxHeight: "480px",
                    background: "#0d1117",
                    borderRadius: "14px",
                    border: "1px solid var(--panel-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "inline-block",
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transformOrigin: "center center",
                      transition: "transform 0.15s ease-out",
                    }}
                  >
                    <img
                      ref={previewImageRef}
                      src={imagePreview}
                      alt="OCR Input"
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: "440px",
                        borderRadius: "6px",
                      }}
                    />

                    {/* Bounding Box Overlays */}
                    {showBoxes &&
                      blocks.map((block) => {
                        const [ymin, xmin, ymax, xmax] = block.box;
                        const top = `${ymin / 10}%`;
                        const left = `${xmin / 10}%`;
                        const width = `${(xmax - xmin) / 10}%`;
                        const height = `${(ymax - ymin) / 10}%`;
                        const isHighlighted = highlightedBlockId === block.id;

                        return (
                          <div
                            key={block.id}
                            onMouseEnter={() => setHighlightedBlockId(block.id)}
                            onMouseLeave={() => setHighlightedBlockId(null)}
                            title={block.text}
                            style={{
                              position: "absolute",
                              top,
                              left,
                              width,
                              height,
                              border: isHighlighted
                                ? "2px solid #10b981"
                                : "1px solid hsla(var(--hue), var(--saturation), 50%, 0.8)",
                              background: isHighlighted
                                ? "hsla(150, 80%, 40%, 0.35)"
                                : "hsla(var(--hue), var(--saturation), 50%, 0.12)",
                              borderRadius: "2px",
                              cursor: "pointer",
                              pointerEvents: "auto",
                              transition: "all 0.15s ease",
                              zIndex: isHighlighted ? 10 : 2,
                            }}
                          />
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Run OCR Action Button */}
            <button
              onClick={runOcr}
              disabled={isLoading || !imagePreview}
              style={{
                width: "100%",
                padding: "14px 24px",
                borderRadius: "14px",
                background: isLoading || !imagePreview ? "var(--btn-bg)" : "var(--accent)",
                color: isLoading || !imagePreview ? "var(--muted)" : "#ffffff",
                border: "none",
                fontSize: "15px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                cursor: isLoading || !imagePreview ? "not-allowed" : "pointer",
                boxShadow: isLoading || !imagePreview ? "none" : "0 4px 20px hsla(var(--hue), var(--saturation), var(--text-lightness), 0.25)",
                transition: "all 0.2s ease",
              }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#ffffff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>{locale === "hy" ? "Ճանաչում է Gemini Flash Lite-ով..." : "Processing with Gemini Flash Lite..."}</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>{locale === "hy" ? "Կարդալ պատկերը (Run OCR)" : "Extract Text (Run OCR)"}</span>
                </>
              )}
            </button>
          </section>

          {/* ================= RIGHT COLUMN: OCR Output & Tools ================= */}
          <section
            style={{
              background: "var(--panel)",
              borderRadius: "20px",
              padding: "24px",
              border: "1px solid var(--panel-border)",
              boxShadow: "var(--shadow)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minHeight: "560px",
            }}
          >
            {/* Header: Tabs & Utilities */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--panel-border)",
              }}
            >
              {/* Output Tabs */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => setActiveTab("text")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: activeTab === "text" ? "var(--btn-hover-bg)" : "transparent",
                    color: activeTab === "text" ? "var(--accent)" : "var(--muted)",
                    border: activeTab === "text" ? "1px solid var(--panel-border)" : "1px solid transparent",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {locale === "hy" ? "📄 Տեքստ" : "📄 Text"}
                </button>

                {blocks.length > 0 && (
                  <button
                    onClick={() => setActiveTab("blocks")}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: activeTab === "blocks" ? "var(--btn-hover-bg)" : "transparent",
                      color: activeTab === "blocks" ? "var(--accent)" : "var(--muted)",
                      border: activeTab === "blocks" ? "1px solid var(--panel-border)" : "1px solid transparent",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {locale === "hy" ? `📦 Հատվածներ (${blocks.length})` : `📦 Blocks (${blocks.length})`}
                  </button>
                )}

                {translatedText && (
                  <button
                    onClick={() => setActiveTab("translation")}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: activeTab === "translation" ? "var(--btn-hover-bg)" : "transparent",
                      color: activeTab === "translation" ? "var(--accent)" : "var(--muted)",
                      border: activeTab === "translation" ? "1px solid var(--panel-border)" : "1px solid transparent",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {locale === "hy" ? "🌐 Թարգմանություն" : "🌐 Translation"}
                  </button>
                )}
              </div>

              {/* Action Buttons: Copy, TTS, Export */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Copy button */}
                <button
                  onClick={() => handleCopyText()}
                  disabled={!extractedText && !translatedText}
                  title={locale === "hy" ? "Պատճենել տեքստը" : "Copy Text"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    background: copied ? "hsla(150, 80%, 40%, 0.15)" : "var(--btn-bg)",
                    border: "1px solid",
                    borderColor: copied ? "#10b981" : "var(--panel-border)",
                    color: copied ? "#10b981" : "var(--text)",
                    fontSize: "12px",
                    fontWeight: "600",
                    transition: "all 0.15s ease",
                  }}
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{locale === "hy" ? "Պատճենված է" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>{locale === "hy" ? "Պատճենել" : "Copy"}</span>
                    </>
                  )}
                </button>

                {/* Text to Speech button */}
                <button
                  onClick={toggleSpeech}
                  disabled={!extractedText && !translatedText}
                  title={isSpeaking ? "Դադարեցնել ընթերցումը" : "Բարձրաձայն ընթերցել (Text to Speech)"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    background: isSpeaking ? "hsla(var(--hue), var(--saturation), 50%, 0.2)" : "var(--btn-bg)",
                    border: "1px solid var(--panel-border)",
                    color: isSpeaking ? "var(--accent)" : "var(--text)",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span>{isSpeaking ? (locale === "hy" ? "Դադարեցնել" : "Stop") : (locale === "hy" ? "Լսել" : "Listen")}</span>
                </button>

                {/* Export Dropdown / Buttons */}
                <button
                  onClick={() => handleDownload("txt")}
                  disabled={!extractedText && !translatedText}
                  title="Ներբեռնել .TXT"
                  style={{
                    padding: "7px 10px",
                    borderRadius: "8px",
                    background: "var(--btn-bg)",
                    border: "1px solid var(--panel-border)",
                    color: "var(--text)",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  .TXT
                </button>
                <button
                  onClick={() => handleDownload("md")}
                  disabled={!extractedText && !translatedText}
                  title="Ներբեռնել .MD (Markdown)"
                  style={{
                    padding: "7px 10px",
                    borderRadius: "8px",
                    background: "var(--btn-bg)",
                    border: "1px solid var(--panel-border)",
                    color: "var(--text)",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  .MD
                </button>
                <button
                  onClick={() => handleDownload("json")}
                  disabled={!extractedText && !translatedText}
                  title="Ներբեռնել .JSON"
                  style={{
                    padding: "7px 10px",
                    borderRadius: "8px",
                    background: "var(--btn-bg)",
                    border: "1px solid var(--panel-border)",
                    color: "var(--text)",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  .JSON
                </button>
              </div>
            </div>

            {/* Quick in-text search bar */}
            {(extractedText || translatedText) && (
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder={locale === "hy" ? "Որոնել արդյունքի մեջ..." : "Search in recognized text..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 36px",
                    background: "var(--input-bg)",
                    border: "1px solid var(--panel-border)",
                    borderRadius: "10px",
                    color: "var(--text)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* Content Display: Text Area or Blocks View */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {activeTab === "blocks" && blocks.length > 0 ? (
                /* Interactive Blocks List */
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    maxHeight: "440px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    paddingRight: "6px",
                  }}
                >
                  {blocks.map((b) => (
                    <div
                      key={b.id}
                      onMouseEnter={() => setHighlightedBlockId(b.id)}
                      onMouseLeave={() => setHighlightedBlockId(null)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: highlightedBlockId === b.id ? "var(--accent)" : "var(--panel-border)",
                        background: highlightedBlockId === b.id ? "var(--btn-hover-bg)" : "var(--input-bg)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent)" }}>{b.id}</span>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          [{b.box.join(", ")}]
                        </span>
                      </div>
                      <div style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--text)" }}>{b.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Main Editable Text Area */
                <textarea
                  value={renderedText()}
                  onChange={(e) => {
                    if (activeTab === "translation") {
                      setTranslatedText(e.target.value);
                    } else {
                      setExtractedText(e.target.value);
                    }
                  }}
                  placeholder={
                    locale === "hy"
                      ? "Ճանաչված տեքստը կհայտնվի այստեղ։ Կարող եք նաև այն անմիջապես խմբագրել կամ պատճենել..."
                      : "Recognized text will appear here. You can also edit it or copy it directly..."
                  }
                  style={{
                    width: "100%",
                    flex: 1,
                    minHeight: "380px",
                    background: "var(--input-bg)",
                    border: "1px solid var(--panel-border)",
                    borderRadius: "14px",
                    padding: "16px",
                    color: "var(--text)",
                    fontSize: "14px",
                    lineHeight: "1.65",
                    fontFamily: "HDesign, inherit, sans-serif",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              )}
            </div>

            {/* Bottom Stats Footer */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                paddingTop: "12px",
                borderTop: "1px solid var(--panel-border)",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span>
                  <strong>{stats ? stats.characters : (activeTab === "translation" ? translatedText.length : extractedText.length)}</strong> {locale === "hy" ? "նիշ" : "chars"}
                </span>
                <span>
                  <strong>{stats ? stats.words : (activeTab === "translation" ? (translatedText.split(/\s+/).filter(Boolean).length) : (extractedText.split(/\s+/).filter(Boolean).length))}</strong> {locale === "hy" ? "բառ" : "words"}
                </span>
                <span>
                  <strong>{stats ? stats.lines : (activeTab === "translation" ? (translatedText.split('\n').filter(Boolean).length) : (extractedText.split('\n').filter(Boolean).length))}</strong> {locale === "hy" ? "տող" : "lines"}
                </span>
                {stats && stats.processingTimeMs > 0 && (
                  <span style={{ color: "var(--accent)" }}>
                    ⚡ {(stats.processingTimeMs / 1000).toFixed(2)} {locale === "hy" ? "վրկ" : "s"}
                  </span>
                )}
              </div>

              <div>
                <span style={{ opacity: 0.8 }}>Մոդել: </span>
                <strong style={{ color: "var(--text)" }}>{modelUsed}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ================= Camera Modal ================= */}
      {isCameraActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--panel)",
              borderRadius: "20px",
              padding: "24px",
              width: "100%",
              maxWidth: "680px",
              border: "1px solid var(--panel-border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                {locale === "hy" ? "Լուսանկարել փաստաթուղթը" : "Take Document Photo"}
              </h3>
              <button
                onClick={stopCamera}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                background: "#000",
                borderRadius: "14px",
                overflow: "hidden",
                aspectRatio: "16/9",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {/* Document guide frame */}
              <div
                style={{
                  position: "absolute",
                  inset: "15%",
                  border: "2px dashed rgba(255,255,255,0.7)",
                  borderRadius: "12px",
                  pointerEvents: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button
                onClick={captureCameraFrame}
                style={{
                  padding: "12px 28px",
                  borderRadius: "12px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                📸 {locale === "hy" ? "Նկարել և ճանաչել" : "Capture"}
              </button>
              <button
                onClick={stopCamera}
                style={{
                  padding: "12px 20px",
                  borderRadius: "12px",
                  background: "var(--btn-bg)",
                  color: "var(--text)",
                  border: "1px solid var(--panel-border)",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {locale === "hy" ? "Չեղարկել" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Custom API Key Settings Modal ================= */}
      {showSettingsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--panel)",
              borderRadius: "20px",
              padding: "28px",
              width: "100%",
              maxWidth: "500px",
              border: "1px solid var(--panel-border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                {locale === "hy" ? "Gemini API Կարգավորումներ" : "Gemini API Settings"}
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "1.5" }}>
              {locale === "hy"
                ? "Լռելյայն օգտագործվում է կայքի համակարգային Gemini Flash Lite Vision բանալին։ Եթե ցանկանում եք օգտագործել ձեր սեփական Google AI Studio բանալին, տեղադրեք այն ներքևում։ Այն կպահպանվի միայն ձեր բրաուզերում։"
                : "By default, the server system Gemini Flash Lite key is used. If you wish to use your personal Google AI Studio API key, paste it below. It will be stored only in your browser."}
            </p>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)", marginBottom: "6px", display: "block" }}>
                Google Gemini API Key
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                defaultValue={customApiKey}
                id="custom-ocr-api-key-input"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "var(--input-bg)",
                  border: "1px solid var(--panel-border)",
                  color: "var(--text)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => handleSaveApiKey("")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  background: "var(--btn-bg)",
                  color: "var(--text)",
                  border: "1px solid var(--panel-border)",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                {locale === "hy" ? "Օգտագործել լռելյայնը" : "Reset to Default"}
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById("custom-ocr-api-key-input") as HTMLInputElement;
                  handleSaveApiKey(input ? input.value : "");
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: "10px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {locale === "hy" ? "Պահպանել" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Animations and Responsive Layout */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .ocr-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
