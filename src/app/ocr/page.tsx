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

interface MultiPageItem {
  id: string;
  name: string;
  file: File;
  previewUrl: string;
  jpegDataUrl: string;
  status: "pending" | "processing" | "done" | "error";
  text: string;
  blocks: OcrBlock[];
  error?: string;
}

function fileToJpegDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1800;
        let w = img.naturalWidth || img.width || 1200;
        let h = img.naturalHeight || img.height || 1600;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.88));
        } else {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export default function OcrPage() {
  const { locale } = useI18n();

  // Primary mode: single image or multi-page PDF
  const [appMode, setAppMode] = useState<"single" | "multipage">("single");

  // Single mode state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<OcrMode>("armenian_enhanced");
  
  // Single mode results
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

  // Dropzone single
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  // ================= MULTI-PAGE SEARCHABLE PDF STATE =================
  const [multiPages, setMultiPages] = useState<MultiPageItem[]>([]);
  const [selectedMultiPageIndex, setSelectedMultiPageIndex] = useState<number>(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isMultiDragging, setIsMultiDragging] = useState<boolean>(false);

  // Load custom API key from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("hdesign_gemini_ocr_key");
      if (savedKey) setCustomApiKey(savedKey);
    } catch (_) {}
  }, []);

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

  // Clipboard paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            if (file) {
              if (appMode === "single") {
                handleNewSingleFile(file);
              } else {
                handleNewMultiFiles([file]);
              }
              e.preventDefault();
              break;
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [appMode]);

  // Single file handling
  const handleNewSingleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg(locale === "hy" ? "Խնդրում ենք ընտրել պատկերային նիշք (PNG, JPG, WEBP և այլն)։" : "Please select an image file.");
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
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Auto-start OCR immediately upon dropping image
      runSingleOcr(file, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Single OCR API call
  const runSingleOcr = async (overrideFile?: File, overrideDataUrl?: string) => {
    const targetFile = overrideFile || imageFile;
    const targetDataUrl = overrideDataUrl || imagePreview;

    if (!targetFile && !targetDataUrl) {
      setErrorMsg(locale === "hy" ? "Խնդրում ենք նախ բեռնել կամ տեղադրել նկար։" : "Please upload or paste an image first.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      let res: Response;
      if (targetDataUrl) {
        res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: targetDataUrl,
            mode,
            apiKey: customApiKey.trim() || undefined,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("image", targetFile as File);
        formData.append("mode", mode);
        if (customApiKey.trim()) {
          formData.append("apiKey", customApiKey.trim());
        }
        res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "OCR recognition failed.");
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
      setErrorMsg(err.message || "An error occurred during text recognition.");
    } finally {
      setIsLoading(false);
    }
  };

  const runOcr = () => runSingleOcr();

  // ================= MULTI-PAGE HANDLERS =================
  const handleNewMultiFiles = async (files: File[]) => {
    setErrorMsg(null);
    const validImageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (validImageFiles.length === 0) {
      setErrorMsg(locale === "hy" ? "Խնդրում ենք ընտրել պատկերային նիշքեր (JPG, PNG, WEBP և այլն)։" : "Please select valid image files.");
      return;
    }

    const newPages: MultiPageItem[] = [];

    for (let i = 0; i < validImageFiles.length; i++) {
      const file = validImageFiles[i];
      const jpegDataUrl = await fileToJpegDataUrl(file);
      newPages.push({
        id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        file,
        previewUrl: jpegDataUrl,
        jpegDataUrl,
        status: "pending",
        text: "",
        blocks: [],
      });
    }

    const combined = [...multiPages, ...newPages];
    setMultiPages(combined);

    // AUTO-START OCR ON ALL PAGES IMMEDIATELY UPON DROPPING!
    runBatchOcr(combined);
  };

  const removeMultiPage = (index: number) => {
    setMultiPages((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    if (selectedMultiPageIndex >= index && selectedMultiPageIndex > 0) {
      setSelectedMultiPageIndex(selectedMultiPageIndex - 1);
    }
  };

  const moveMultiPage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= multiPages.length) return;

    setMultiPages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
    setSelectedMultiPageIndex(targetIndex);
  };

  // Recognize single page in multi-page mode using clean JSON payload
  const recognizePage = async (pageIndex: number, currentList: MultiPageItem[]): Promise<{ text: string; blocks: OcrBlock[] }> => {
    const page = currentList[pageIndex];
    if (!page) return { text: "", blocks: [] };

    const res = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: page.jpegDataUrl,
        mode,
        apiKey: customApiKey.trim() || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Էջ ${pageIndex + 1}-ի ճանաչումը ձախողվեց։`);
    }

    return {
      text: data.text || "",
      blocks: data.blocks || [],
    };
  };

  // Recognize all pages in batch
  const runBatchOcr = async (pagesToProcess?: MultiPageItem[]) => {
    const pages = pagesToProcess || multiPages;
    if (pages.length === 0) {
      setErrorMsg(locale === "hy" ? "Խնդրում ենք նախ ավելացնել էջեր։" : "Please add images/pages first.");
      return;
    }

    setIsBatchProcessing(true);
    setErrorMsg(null);
    setBatchProgress({ current: 0, total: pages.length });

    const updatedPages = [...pages];

    for (let i = 0; i < updatedPages.length; i++) {
      if (updatedPages[i].status === "done" && updatedPages[i].text) {
        setBatchProgress({ current: i + 1, total: updatedPages.length });
        continue;
      }

      setBatchProgress({ current: i + 1, total: updatedPages.length });
      updatedPages[i].status = "processing";
      setMultiPages([...updatedPages]);

      try {
        const result = await recognizePage(i, updatedPages);
        updatedPages[i].text = result.text;
        updatedPages[i].blocks = result.blocks;
        updatedPages[i].status = "done";
      } catch (err: any) {
        console.error(`Page ${i + 1} OCR error:`, err);
        updatedPages[i].status = "error";
        updatedPages[i].error = err.message || "Սխալ";
      }

      setMultiPages([...updatedPages]);
    }

    setIsBatchProcessing(false);
  };

  const recognizeAllMultiPages = () => runBatchOcr();

  // Generate & Download Searchable PDF
  const generateSearchablePdf = async () => {
    if (multiPages.length === 0) {
      setErrorMsg(locale === "hy" ? "Ոչ մի էջ չկա PDF ստեղծելու համար։" : "No pages available to create PDF.");
      return;
    }

    setIsGeneratingPdf(true);
    setErrorMsg(null);

    try {
      // 1. If any pages haven't been recognized yet, recognize them first!
      let currentPages = [...multiPages];
      const hasUnrecognized = currentPages.some((p) => p.status !== "done" || !p.text);

      if (hasUnrecognized) {
        setIsBatchProcessing(true);
        for (let i = 0; i < currentPages.length; i++) {
          if (currentPages[i].status !== "done" || !currentPages[i].text) {
            setBatchProgress({ current: i + 1, total: currentPages.length });
            currentPages[i].status = "processing";
            setMultiPages([...currentPages]);

            try {
              const res = await recognizePage(i, currentPages);
              currentPages[i].text = res.text;
              currentPages[i].blocks = res.blocks;
              currentPages[i].status = "done";
            } catch (err: any) {
              currentPages[i].status = "error";
            }
            setMultiPages([...currentPages]);
          }
        }
        setIsBatchProcessing(false);
      }

      // 2. Generate Searchable PDF (Try client-side first for instant speed & zero payload limits)
      let pdfBlob: Blob | null = null;

      try {
        const { PDFDocument, rgb, TextRenderingMode, setTextRenderingMode } = await import("pdf-lib");
        const fontkitModule = await import("@pdf-lib/fontkit");
        const fontkit = fontkitModule.default || fontkitModule;

        const doc = await PDFDocument.create();
        doc.registerFontkit(fontkit);

        let customFont: any = null;
        try {
          const fontRes = await fetch("/HDesign.ttf");
          if (fontRes.ok) {
            const fontBytes = await fontRes.arrayBuffer();
            customFont = await doc.embedFont(fontBytes);
          }
        } catch (_) {}

        for (let i = 0; i < currentPages.length; i++) {
          const page = currentPages[i];
          if (!page.jpegDataUrl) continue;

          const base64Data = page.jpegDataUrl.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
          const binaryStr = window.atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let k = 0; k < binaryStr.length; k++) {
            bytes[k] = binaryStr.charCodeAt(k);
          }

          let embeddedImg: any = null;
          try {
            embeddedImg = await doc.embedJpg(bytes);
          } catch (_) {
            try {
              embeddedImg = await doc.embedPng(bytes);
            } catch (e) {
              continue;
            }
          }

          if (!embeddedImg) continue;

          const imgWidth = embeddedImg.width;
          const imgHeight = embeddedImg.height;
          const pdfPage = doc.addPage([imgWidth, imgHeight]);

          pdfPage.drawImage(embeddedImg, { x: 0, y: 0, width: imgWidth, height: imgHeight });

          if (customFont) {
            pdfPage.pushOperators(setTextRenderingMode(TextRenderingMode.Invisible));

            const blocks = page.blocks || [];
            if (blocks.length > 0) {
              for (const block of blocks) {
                const rawText = (block.text || "").replace(/[\r\n\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ").trim();
                if (!rawText) continue;

                const [ymin, xmin, ymax, xmax] = block.box;
                const x = (xmin / 1000) * imgWidth;
                const boxHeight = Math.max(6, ((ymax - ymin) / 1000) * imgHeight);
                const y = imgHeight - (ymax / 1000) * imgHeight;
                const fontSize = Math.max(6, Math.min(boxHeight * 0.85, 48));

                try {
                  pdfPage.drawText(rawText, {
                    x: Math.max(0, x),
                    y: Math.max(0, y),
                    size: fontSize,
                    font: customFont,
                    color: rgb(0, 0, 0),
                  });
                } catch (_) {}
              }
            } else if (page.text && page.text.trim()) {
              const lines = page.text.split("\n").map((l) => l.trim()).filter(Boolean);
              const lineHeight = Math.min(24, Math.max(10, imgHeight / (lines.length + 4)));
              let currentY = imgHeight - lineHeight * 2;

              for (const line of lines) {
                if (currentY < lineHeight) break;
                try {
                  pdfPage.drawText(line, {
                    x: 40,
                    y: currentY,
                    size: Math.max(8, lineHeight * 0.8),
                    font: customFont,
                    color: rgb(0, 0, 0),
                  });
                } catch (_) {}
                currentY -= lineHeight;
              }
            }

            pdfPage.pushOperators(setTextRenderingMode(TextRenderingMode.Fill));
          }
        }

        if (doc.getPageCount() > 0) {
          const pdfBytes = await doc.save();
          pdfBlob = new Blob([pdfBytes as any], { type: "application/pdf" });
        }
      } catch (clientPdfErr) {
        console.warn("Client-side PDF failed, trying server API fallback...", clientPdfErr);
      }

      // If client-side produced no pages, fall back to server API
      if (!pdfBlob) {
        const payloadPages = currentPages.map((p) => ({
          imageData: p.jpegDataUrl,
          text: p.text,
          blocks: p.blocks,
        }));

        const res = await fetch("/api/ocr/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pages: payloadPages,
            docTitle: "Searchable Document",
          }),
        });

        if (!res.ok) {
          let errDetail = "";
          try {
            const errText = await res.text();
            try {
              const parsed = JSON.parse(errText);
              errDetail = parsed.error || parsed.message;
            } catch (_) {
              errDetail = errText.slice(0, 200);
            }
          } catch (_) {}
          throw new Error(errDetail || `Սերվերի սխալ (Կոդ: ${res.status})`);
        }

        pdfBlob = await res.blob();
      }

      // 3. Download the generated PDF blob
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `searchable_document_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      setErrorMsg(err.message || "Searchable PDF ստեղծումը ձախողվեց։");
    } finally {
      setIsGeneratingPdf(false);
      setIsBatchProcessing(false);
    }
  };

  // Camera capture handlers
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
      setErrorMsg(locale === "hy" ? "Տեսախցիկի հասանելիությունը մերժվեց։" : "Camera access denied.");
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
          if (appMode === "single") {
            handleNewSingleFile(file);
          } else {
            handleNewMultiFiles([file]);
          }
          stopCamera();
        }
      }, "image/jpeg", 0.95);
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
    const isArmenian = /[\u0530-\u058F]/.test(textToRead);
    utterance.lang = isArmenian ? "hy-AM" : "en-US";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Single download
  const handleDownloadSingle = (format: "txt" | "md" | "json") => {
    const textData = activeTab === "translation" && translatedText ? translatedText : extractedText;
    let mime = "text/plain;charset=utf-8";
    let filename = `ocr-export-${Date.now()}.${format}`;
    let content = textData;

    if (format === "json") {
      mime = "application/json;charset=utf-8";
      content = JSON.stringify({ timestamp: new Date().toISOString(), model: modelUsed, stats, extractedText, translatedText, blocks }, null, 2);
    } else if (format === "md") {
      mime = "text/markdown;charset=utf-8";
      content = `# OCR Transcription\n\n**Engine:** ${modelUsed}\n\n---\n\n${textData}`;
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

  const handleResetSingle = () => {
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

  return (
    <main className="shell" style={{ marginTop: "120px", marginBottom: "80px", minHeight: "85vh", position: "relative" }}>
      {/* Background Glow */}
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

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header Bar */}
        <header
          style={{
            background: "var(--panel)",
            borderRadius: "20px",
            padding: "20px 28px",
            border: "1px solid var(--panel-border)",
            boxShadow: "var(--shadow)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "hsla(var(--hue), var(--saturation), var(--text-lightness), 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h3" />
                  <path d="M20 7V4h-3" />
                  <path d="M4 17v3h3" />
                  <path d="M20 17v3h-3" />
                  <rect x="7" y="7" width="10" height="10" rx="2" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                </svg>
              </div>
              <h1 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>
                Gemini Vision OCR & Searchable PDF
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "3px 8px",
                  borderRadius: "16px",
                  background: "hsla(150, 80%, 40%, 0.15)",
                  color: "#10b981",
                  border: "1px solid hsla(150, 80%, 40%, 0.25)",
                }}
              >
                FREE TIER
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
              {locale === "hy"
                ? "Բարձր ճշգրտության OCR ընթերցիչ և բազմաէջ Searchable (որոնելի) PDF գեներատոր։"
                : "Multimodal OCR reader and multi-page Searchable PDF generator."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Mode Switcher Pill */}
            <div
              style={{
                display: "inline-flex",
                background: "var(--input-bg)",
                padding: "3px",
                borderRadius: "12px",
                border: "1px solid var(--panel-border)",
              }}
            >
              <button
                onClick={() => setAppMode("single")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9px",
                  background: appMode === "single" ? "var(--accent)" : "transparent",
                  color: appMode === "single" ? "#ffffff" : "var(--muted)",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                📄 {locale === "hy" ? "Մեկ նկար" : "Single Image"}
              </button>
              <button
                onClick={() => setAppMode("multipage")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9px",
                  background: appMode === "multipage" ? "var(--accent)" : "transparent",
                  color: appMode === "multipage" ? "#ffffff" : "var(--muted)",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                📚 {locale === "hy" ? "Բազմաէջ Searchable PDF" : "Multi-Page PDF"}
              </button>
            </div>

            {/* Custom API Key Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              title="API Key Settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 12px",
                borderRadius: "10px",
                border: "1px solid var(--panel-border)",
                background: customApiKey ? "hsla(var(--hue), var(--saturation), 50%, 0.12)" : "var(--btn-bg)",
                color: "var(--text)",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>{customApiKey ? "Key: Ակտիվ" : "API Key"}</span>
            </button>
          </div>
        </header>

        {/* Error notification banner */}
        {errorMsg && (
          <div
            style={{
              background: "hsla(0, 85%, 60%, 0.12)",
              border: "1px solid hsla(0, 85%, 60%, 0.3)",
              color: "#ef4444",
              padding: "12px 18px",
              borderRadius: "14px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}

        {/* Mode-specific content */}
        {appMode === "single" ? (
          /* ============================================================== */
          /* ================= SINGLE IMAGE MODE ========================== */
          /* ============================================================== */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 1.25fr",
              gap: "24px",
              alignItems: "start",
            }}
            className="ocr-grid-layout"
          >
            {/* Left Column: Image Input & Preview */}
            <section
              style={{
                background: "var(--panel)",
                borderRadius: "20px",
                padding: "24px",
                border: "1px solid var(--panel-border)",
                boxShadow: "var(--shadow)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleNewSingleFile(e.target.files[0]);
                  }
                }}
              />

              {/* Mode Selection */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)", marginBottom: "8px", display: "block" }}>
                  {locale === "hy" ? "ՃԱՆԱՉՄԱՆ ԿԵՐՊ" : "RECOGNITION MODE"}
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
                        padding: "7px 12px",
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: mode === item.id ? "var(--accent)" : "var(--panel-border)",
                        background: mode === item.id ? "var(--accent)" : "var(--btn-bg)",
                        color: mode === item.id ? "#ffffff" : "var(--text)",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropzone or Preview */}
              {!imagePreview ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleNewSingleFile(e.dataTransfer.files[0]);
                    }
                  }}
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
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                      ? "Աջակցվում է PNG, JPG, WEBP: Կարող եք նաև սեղմել Ctrl+V՝ պատճենված նկարը տեղադրելու համար։"
                      : "Supports PNG, JPG, WEBP. You can also press Ctrl+V anywhere to paste."}
                  </p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      style={{ padding: "8px 16px", borderRadius: "10px", background: "var(--accent)", color: "#fff", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                    >
                      {locale === "hy" ? "Ընտրել նիշք" : "Choose File"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startCamera(); }}
                      style={{ padding: "8px 16px", borderRadius: "10px", background: "var(--btn-bg)", color: "var(--text)", border: "1px solid var(--panel-border)", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      📸 <span>{locale === "hy" ? "Տեսախցիկ" : "Camera"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Toolbar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "6px 12px", background: "var(--input-bg)", borderRadius: "10px", border: "1px solid var(--panel-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))} style={{ padding: "4px 8px", background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "6px", color: "var(--text)", fontSize: "12px", cursor: "pointer" }}>−</button>
                      <span style={{ fontSize: "12px", color: "var(--muted)", minWidth: "40px", textAlign: "center" }}>{Math.round(zoomLevel * 100)}%</span>
                      <button onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))} style={{ padding: "4px 8px", background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "6px", color: "var(--text)", fontSize: "12px", cursor: "pointer" }}>+</button>
                      <button onClick={() => setRotation((r) => (r + 90) % 360)} style={{ padding: "4px 8px", background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "6px", color: "var(--text)", fontSize: "12px", cursor: "pointer" }}>↻ 90°</button>
                      <button onClick={() => { setZoomLevel(1); setRotation(0); }} style={{ padding: "4px 8px", background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "6px", color: "var(--text)", fontSize: "12px", cursor: "pointer" }}>Reset</button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {blocks.length > 0 && (
                        <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--muted)", cursor: "pointer" }}>
                          <input type="checkbox" checked={showBoxes} onChange={(e) => setShowBoxes(e.target.checked)} />
                          <span>{locale === "hy" ? "Բլոկներ" : "Boxes"}</span>
                        </label>
                      )}
                      <button onClick={() => fileInputRef.current?.click()} style={{ padding: "4px 8px", background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "6px", color: "var(--text)", fontSize: "12px", cursor: "pointer" }}>
                        {locale === "hy" ? "Փոխել" : "Change"}
                      </button>
                    </div>
                  </div>

                  {/* Canvas View */}
                  <div style={{ position: "relative", overflow: "auto", maxHeight: "460px", background: "#0d1117", borderRadius: "14px", border: "1px solid var(--panel-border)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div style={{ position: "relative", display: "inline-block", transform: `scale(${zoomLevel}) rotate(${rotation}deg)`, transformOrigin: "center center", transition: "transform 0.15s ease-out" }}>
                      <img ref={previewImageRef} src={imagePreview} alt="OCR Input" style={{ display: "block", maxWidth: "100%", height: "auto", maxHeight: "420px", borderRadius: "6px" }} />
                      {showBoxes && blocks.map((block) => {
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
                              border: isHighlighted ? "2px solid #10b981" : "1px solid hsla(var(--hue), var(--saturation), 50%, 0.8)",
                              background: isHighlighted ? "hsla(150, 80%, 40%, 0.35)" : "hsla(var(--hue), var(--saturation), 50%, 0.12)",
                              borderRadius: "2px",
                              cursor: "pointer",
                              zIndex: isHighlighted ? 10 : 2,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Run OCR Button */}
              <button
                onClick={runOcr}
                disabled={isLoading || !imagePreview}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  borderRadius: "14px",
                  background: isLoading || !imagePreview ? "var(--btn-bg)" : "var(--accent)",
                  color: isLoading || !imagePreview ? "var(--muted)" : "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: isLoading || !imagePreview ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span>{locale === "hy" ? "Ճանաչում է Gemini Flash Lite-ով..." : "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <span>⚡ {locale === "hy" ? "Կարդալ պատկերը (Run OCR)" : "Extract Text"}</span>
                  </>
                )}
              </button>
            </section>

            {/* Right Column: Output */}
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
                minHeight: "540px",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", paddingBottom: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => setActiveTab("text")} style={{ padding: "6px 12px", borderRadius: "8px", background: activeTab === "text" ? "var(--btn-hover-bg)" : "transparent", color: activeTab === "text" ? "var(--accent)" : "var(--muted)", border: activeTab === "text" ? "1px solid var(--panel-border)" : "1px solid transparent", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>📄 Տեքստ</button>
                  {blocks.length > 0 && (
                    <button onClick={() => setActiveTab("blocks")} style={{ padding: "6px 12px", borderRadius: "8px", background: activeTab === "blocks" ? "var(--btn-hover-bg)" : "transparent", color: activeTab === "blocks" ? "var(--accent)" : "var(--muted)", border: activeTab === "blocks" ? "1px solid var(--panel-border)" : "1px solid transparent", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>📦 Բլոկներ ({blocks.length})</button>
                  )}
                  {translatedText && (
                    <button onClick={() => setActiveTab("translation")} style={{ padding: "6px 12px", borderRadius: "8px", background: activeTab === "translation" ? "var(--btn-hover-bg)" : "transparent", color: activeTab === "translation" ? "var(--accent)" : "var(--muted)", border: activeTab === "translation" ? "1px solid var(--panel-border)" : "1px solid transparent", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>🌐 Թարգմանություն</button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button onClick={() => handleCopyText()} disabled={!extractedText && !translatedText} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: "8px", background: copied ? "hsla(150, 80%, 40%, 0.15)" : "var(--btn-bg)", border: "1px solid", borderColor: copied ? "#10b981" : "var(--panel-border)", color: copied ? "#10b981" : "var(--text)", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                    {copied ? "✓ Պատճենված" : "📋 Պատճենել"}
                  </button>
                  <button onClick={toggleSpeech} disabled={!extractedText && !translatedText} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: "8px", background: isSpeaking ? "hsla(var(--hue), var(--saturation), 50%, 0.2)" : "var(--btn-bg)", border: "1px solid var(--panel-border)", color: isSpeaking ? "var(--accent)" : "var(--text)", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                    🔊 {isSpeaking ? "Կանգնեցնել" : "Լսել"}
                  </button>
                  <button onClick={() => handleDownloadSingle("txt")} disabled={!extractedText && !translatedText} style={{ padding: "6px 8px", borderRadius: "8px", background: "var(--btn-bg)", border: "1px solid var(--panel-border)", color: "var(--text)", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>.TXT</button>
                  <button onClick={() => handleDownloadSingle("md")} disabled={!extractedText && !translatedText} style={{ padding: "6px 8px", borderRadius: "8px", background: "var(--btn-bg)", border: "1px solid var(--panel-border)", color: "var(--text)", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>.MD</button>
                  <button onClick={() => handleDownloadSingle("json")} disabled={!extractedText && !translatedText} style={{ padding: "6px 8px", borderRadius: "8px", background: "var(--btn-bg)", border: "1px solid var(--panel-border)", color: "var(--text)", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>.JSON</button>
                </div>
              </div>

              {/* Text / Blocks Output */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {activeTab === "blocks" && blocks.length > 0 ? (
                  <div style={{ flex: 1, overflowY: "auto", maxHeight: "420px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {blocks.map((b) => (
                      <div
                        key={b.id}
                        onMouseEnter={() => setHighlightedBlockId(b.id)}
                        onMouseLeave={() => setHighlightedBlockId(null)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: "1px solid",
                          borderColor: highlightedBlockId === b.id ? "var(--accent)" : "var(--panel-border)",
                          background: highlightedBlockId === b.id ? "var(--btn-hover-bg)" : "var(--input-bg)",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent)" }}>{b.id}</span>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>[{b.box.join(", ")}]</span>
                        </div>
                        <div style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--text)" }}>{b.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={activeTab === "translation" ? translatedText : extractedText}
                    onChange={(e) => activeTab === "translation" ? setTranslatedText(e.target.value) : setExtractedText(e.target.value)}
                    placeholder={locale === "hy" ? "Ճանաչված տեքստը կհայտնվի այստեղ..." : "Extracted text will appear here..."}
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

              {/* Stats Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid var(--panel-border)", fontSize: "12px", color: "var(--muted)" }}>
                <div>
                  <strong>{extractedText.length}</strong> նիշ | <strong>{extractedText.split(/\s+/).filter(Boolean).length}</strong> բառ
                  {stats && stats.processingTimeMs > 0 && <span style={{ marginLeft: "10px", color: "var(--accent)" }}>⚡ {(stats.processingTimeMs / 1000).toFixed(2)} վրկ</span>}
                </div>
                <div>Մոդել: <strong style={{ color: "var(--text)" }}>{modelUsed}</strong></div>
              </div>
            </section>
          </div>
        ) : (
          /* ============================================================== */
          /* ================= MULTI-PAGE SEARCHABLE PDF ================== */
          /* ============================================================== */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Hidden multi-file input */}
            <input
              type="file"
              ref={multiFileInputRef}
              multiple
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleNewMultiFiles(Array.from(e.target.files));
                }
              }}
            />

            {/* Top Multi-Page Control Banner */}
            <div
              style={{
                background: "var(--panel)",
                borderRadius: "20px",
                padding: "24px",
                border: "1px solid var(--panel-border)",
                boxShadow: "var(--shadow)",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 6px 0" }}>
                  {locale === "hy" ? "Բազմաէջ Searchable PDF փաստաթուղթ" : "Multi-Page Searchable PDF"}
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
                  {locale === "hy"
                    ? `Բեռնված է ${multiPages.length} էջ: Բոլոր նկարները կմիավորվեն մեկ PDF ֆայլում՝ որոնելի տեքստով (Ctrl+F)։`
                    : `${multiPages.length} pages loaded. All images will be merged into a single Searchable PDF.`}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {/* Add more images button */}
                <button
                  onClick={() => multiFileInputRef.current?.click()}
                  disabled={isBatchProcessing || isGeneratingPdf}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "10px",
                    background: "var(--btn-bg)",
                    border: "1px solid var(--panel-border)",
                    color: "var(--text)",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>{locale === "hy" ? "Ավելացնել նկարներ" : "Add Pages"}</span>
                </button>

                {/* Camera button */}
                <button
                  onClick={startCamera}
                  disabled={isBatchProcessing || isGeneratingPdf}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "10px",
                    background: "var(--btn-bg)",
                    border: "1px solid var(--panel-border)",
                    color: "var(--text)",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  📸 <span>{locale === "hy" ? "Տեսախցիկ" : "Camera"}</span>
                </button>

                {/* Recognize All Button */}
                {multiPages.length > 0 && (
                  <button
                    onClick={recognizeAllMultiPages}
                    disabled={isBatchProcessing || isGeneratingPdf}
                    style={{
                      padding: "9px 16px",
                      borderRadius: "10px",
                      background: "var(--btn-hover-bg)",
                      border: "1px solid var(--panel-border)",
                      color: "var(--accent)",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: isBatchProcessing || isGeneratingPdf ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    ⚡ <span>{locale === "hy" ? "Ճանաչել բոլորը" : "OCR All Pages"}</span>
                  </button>
                )}

                {/* Primary Action: Generate Searchable PDF */}
                <button
                  onClick={generateSearchablePdf}
                  disabled={multiPages.length === 0 || isGeneratingPdf || isBatchProcessing}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "12px",
                    background: multiPages.length === 0 ? "var(--btn-bg)" : "var(--accent)",
                    color: multiPages.length === 0 ? "var(--muted)" : "#ffffff",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: multiPages.length === 0 || isGeneratingPdf || isBatchProcessing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: multiPages.length === 0 ? "none" : "0 4px 16px hsla(var(--hue), var(--saturation), 30%, 0.25)",
                  }}
                >
                  {isGeneratingPdf ? (
                    <>
                      <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span>{locale === "hy" ? "Ստեղծում է Searchable PDF..." : "Building PDF..."}</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                      <span>{locale === "hy" ? "📥 Ստեղծել և ներբեռնել Searchable PDF" : "📥 Download Searchable PDF"}</span>
                    </>
                  )}
                </button>

                {multiPages.length > 0 && (
                  <button
                    onClick={() => { setMultiPages([]); setSelectedMultiPageIndex(0); }}
                    style={{
                      padding: "9px 12px",
                      borderRadius: "10px",
                      background: "hsla(0, 80%, 60%, 0.08)",
                      border: "1px solid hsla(0, 80%, 60%, 0.25)",
                      color: "#ef4444",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {locale === "hy" ? "Մաքրել բոլորը" : "Clear All"}
                  </button>
                )}
              </div>
            </div>

            {/* Batch Progress Bar */}
            {isBatchProcessing && (
              <div
                style={{
                  background: "var(--panel)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  border: "1px solid var(--panel-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  <span>
                    {locale === "hy"
                      ? `Ճանաչում է էջ ${batchProgress.current} / ${batchProgress.total}...`
                      : `Recognizing page ${batchProgress.current} of ${batchProgress.total}...`}
                  </span>
                  <span style={{ color: "var(--accent)" }}>
                    {Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%
                  </span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "var(--input-bg)", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(batchProgress.current / (batchProgress.total || 1)) * 100}%`,
                      height: "100%",
                      background: "var(--accent)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Empty State / Dropzone */}
            {multiPages.length === 0 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsMultiDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsMultiDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsMultiDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleNewMultiFiles(Array.from(e.dataTransfer.files));
                  }
                }}
                onClick={() => multiFileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isMultiDragging ? "var(--accent)" : "var(--panel-border)"}`,
                  background: isMultiDragging ? "hsla(var(--hue), var(--saturation), 50%, 0.08)" : "var(--panel)",
                  borderRadius: "20px",
                  padding: "60px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  cursor: "pointer",
                  minHeight: "360px",
                }}
              >
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "20px",
                    background: "hsla(var(--hue), var(--saturation), var(--text-lightness), 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                    marginBottom: "18px",
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 10px 0" }}>
                  {locale === "hy" ? "Քաշեք մի քանի նկար այստեղ (10, 20 կամ ավելի էջ)" : "Drop multiple images here (10, 20+ pages)"}
                </h3>
                <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "var(--muted)", maxWidth: "460px" }}>
                  {locale === "hy"
                    ? "Գցեք փաստաթղթի կամ գրքի բոլոր էջերը: Gemini Vision-ը կճանաչի բոլորը և կստեղծի մեկ միասնական որոնելի PDF (Searchable PDF)՝ հայերեն և այլ լեզուներով։"
                    : "Drop all pages of your document or book. Gemini Vision will recognize all of them and compile a unified Searchable PDF."}
                </p>
                <button
                  type="button"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "12px",
                    background: "var(--accent)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {locale === "hy" ? "Ընտրել նկարները համակարգչից" : "Select Images"}
                </button>
              </div>
            ) : (
              /* Two-Column Multi-Page Workspace */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "360px 1fr",
                  gap: "24px",
                  alignItems: "start",
                }}
                className="ocr-grid-layout"
              >
                {/* Left: Pages Thumbnails Strip */}
                <div
                  style={{
                    background: "var(--panel)",
                    borderRadius: "20px",
                    padding: "20px",
                    border: "1px solid var(--panel-border)",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    maxHeight: "750px",
                    overflowY: "auto",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                      {locale === "hy" ? `Էջերի ցանկ (${multiPages.length})` : `Pages (${multiPages.length})`}
                    </span>
                    <button
                      onClick={() => multiFileInputRef.current?.click()}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: "var(--btn-bg)",
                        border: "1px solid var(--panel-border)",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      + {locale === "hy" ? "Էջ" : "Page"}
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {multiPages.map((page, idx) => {
                      const isSelected = selectedMultiPageIndex === idx;
                      return (
                        <div
                          key={page.id}
                          onClick={() => setSelectedMultiPageIndex(idx)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px",
                            borderRadius: "12px",
                            border: "1px solid",
                            borderColor: isSelected ? "var(--accent)" : "var(--panel-border)",
                            background: isSelected ? "var(--btn-hover-bg)" : "var(--input-bg)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {/* Page Thumbnail */}
                          <div
                            style={{
                              width: "48px",
                              height: "64px",
                              borderRadius: "6px",
                              overflow: "hidden",
                              background: "#000",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              src={page.previewUrl}
                              alt={`Page ${idx + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>

                          {/* Info & Status */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                              <strong style={{ fontSize: "13px" }}>Էջ {idx + 1}</strong>
                              {page.status === "done" && (
                                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "600" }}>✓ Պատրաստ է</span>
                              )}
                              {page.status === "processing" && (
                                <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>Ճանաչվում է...</span>
                              )}
                              {page.status === "pending" && (
                                <span style={{ fontSize: "11px", color: "var(--muted)" }}>Սպասում է</span>
                              )}
                              {page.status === "error" && (
                                <span style={{ fontSize: "11px", color: "#ef4444" }}>Սխալ</span>
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {page.name}
                            </div>
                            {page.text && (
                              <div style={{ fontSize: "11px", color: "var(--accent)", marginTop: "2px" }}>
                                {page.text.split(/\s+/).filter(Boolean).length} բառ
                              </div>
                            )}
                          </div>

                          {/* Reorder and Delete Actions */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveMultiPage(idx, "up"); }}
                              disabled={idx === 0}
                              style={{ background: "transparent", border: "none", color: idx === 0 ? "var(--muted)" : "var(--text)", opacity: idx === 0 ? 0.3 : 1, cursor: "pointer", fontSize: "12px", padding: 0 }}
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveMultiPage(idx, "down"); }}
                              disabled={idx === multiPages.length - 1}
                              style={{ background: "transparent", border: "none", color: idx === multiPages.length - 1 ? "var(--muted)" : "var(--text)", opacity: idx === multiPages.length - 1 ? 0.3 : 1, cursor: "pointer", fontSize: "12px", padding: 0 }}
                              title="Move Down"
                            >
                              ▼
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeMultiPage(idx); }}
                              style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px", padding: 0 }}
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Selected Page Inspector & Transcription */}
                {multiPages[selectedMultiPageIndex] && (
                  <div
                    style={{
                      background: "var(--panel)",
                      borderRadius: "20px",
                      padding: "24px",
                      border: "1px solid var(--panel-border)",
                      boxShadow: "var(--shadow)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "18px",
                      minHeight: "680px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700" }}>
                          Էջ {selectedMultiPageIndex + 1}: {multiPages[selectedMultiPageIndex].name}
                        </h3>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                          {multiPages[selectedMultiPageIndex].status === "done" ? "Ճանաչված է Gemini Vision-ով" : "Դեռ ճանաչված չէ"}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={async () => {
                            try {
                              const updated = [...multiPages];
                              updated[selectedMultiPageIndex].status = "processing";
                              setMultiPages([...updated]);
                              const res = await recognizePage(selectedMultiPageIndex, updated);
                              updated[selectedMultiPageIndex].text = res.text;
                              updated[selectedMultiPageIndex].blocks = res.blocks;
                              updated[selectedMultiPageIndex].status = "done";
                              setMultiPages([...updated]);
                            } catch (err: any) {
                              setErrorMsg(err.message);
                            }
                          }}
                          disabled={multiPages[selectedMultiPageIndex].status === "processing"}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            background: "var(--btn-bg)",
                            border: "1px solid var(--panel-border)",
                            color: "var(--accent)",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          ⚡ {locale === "hy" ? "Ճանաչել այս էջը" : "OCR this page"}
                        </button>

                        {multiPages[selectedMultiPageIndex].text && (
                          <button
                            onClick={() => handleCopyText(multiPages[selectedMultiPageIndex].text)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: copied ? "hsla(150, 80%, 40%, 0.15)" : "var(--btn-bg)",
                              border: "1px solid",
                              borderColor: copied ? "#10b981" : "var(--panel-border)",
                              color: copied ? "#10b981" : "var(--text)",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            {copied ? "✓ Պատճենված" : "📋 Պատճենել"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preview & Editor split for selected page */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        flex: 1,
                      }}
                      className="ocr-page-split"
                    >
                      {/* Image Viewer */}
                      <div
                        style={{
                          background: "#0d1117",
                          borderRadius: "14px",
                          padding: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "auto",
                          maxHeight: "520px",
                        }}
                      >
                        <img
                          src={multiPages[selectedMultiPageIndex].previewUrl}
                          alt={`Page ${selectedMultiPageIndex + 1}`}
                          style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "6px" }}
                        />
                      </div>

                      {/* Text Editor */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>
                          {locale === "hy" ? "Ճանաչված տեքստ (Խմբագրելի)" : "Recognized Text (Editable)"}
                        </label>
                        <textarea
                          value={multiPages[selectedMultiPageIndex].text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMultiPages((prev) => {
                              const updated = [...prev];
                              updated[selectedMultiPageIndex].text = val;
                              return updated;
                            });
                          }}
                          placeholder={
                            locale === "hy"
                              ? "Այս էջի ճանաչված տեքստը կհայտնվի այստեղ։ Սեղմեք «Ճանաչել այս էջը» կամ վերևից «Ստեղծել Searchable PDF»..."
                              : "Recognized text for this page will appear here..."
                          }
                          style={{
                            width: "100%",
                            flex: 1,
                            minHeight: "440px",
                            background: "var(--input-bg)",
                            border: "1px solid var(--panel-border)",
                            borderRadius: "14px",
                            padding: "14px",
                            color: "var(--text)",
                            fontSize: "14px",
                            lineHeight: "1.65",
                            fontFamily: "HDesign, inherit, sans-serif",
                            resize: "none",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Modal */}
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
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                {locale === "hy" ? "Լուսանկարել փաստաթուղթը" : "Capture Document"}
              </h3>
              <button onClick={stopCamera} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: "22px", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ position: "relative", width: "100%", background: "#000", borderRadius: "14px", overflow: "hidden", aspectRatio: "16/9" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: "15%", border: "2px dashed rgba(255,255,255,0.7)", borderRadius: "12px", pointerEvents: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button onClick={captureCameraFrame} style={{ padding: "12px 28px", borderRadius: "12px", background: "var(--accent)", color: "#fff", border: "none", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>
                📸 {locale === "hy" ? "Նկարել" : "Capture"}
              </button>
              <button onClick={stopCamera} style={{ padding: "12px 20px", borderRadius: "12px", background: "var(--btn-bg)", color: "var(--text)", border: "1px solid var(--panel-border)", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
                {locale === "hy" ? "Չեղարկել" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--panel)", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "500px", border: "1px solid var(--panel-border)", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Gemini API Կարգավորումներ</h3>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: "22px", cursor: "pointer" }}>×</button>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: "1.5" }}>
              Լռելյայն օգտագործվում է կայքի համակարգային Gemini Flash Lite Vision բանալին։ Եթե ցանկանում եք օգտագործել ձեր սեփական Google AI Studio բանալին, տեղադրեք այն ներքևում։
            </p>
            <input type="password" placeholder="AIzaSy..." defaultValue={customApiKey} id="custom-ocr-api-key-input" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "var(--input-bg)", border: "1px solid var(--panel-border)", color: "var(--text)", fontSize: "13px", outline: "none" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => handleSaveApiKey("")} style={{ padding: "8px 16px", borderRadius: "10px", background: "var(--btn-bg)", color: "var(--text)", border: "1px solid var(--panel-border)", fontSize: "13px", cursor: "pointer" }}>Լռելյայն</button>
              <button onClick={() => { const input = document.getElementById("custom-ocr-api-key-input") as HTMLInputElement; handleSaveApiKey(input ? input.value : ""); }} style={{ padding: "8px 20px", borderRadius: "10px", background: "var(--accent)", color: "#fff", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Պահել</button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations & Responsive */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .ocr-grid-layout {
            grid-template-columns: 1fr !important;
          }
          .ocr-page-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
