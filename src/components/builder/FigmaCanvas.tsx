"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import pagesSchema from "@/config/pages-schema.json";
import CanvasToolbar, { WorldMode } from "./CanvasToolbar";

interface DevicePreset {
  id: string;
  name: string;
  width: number;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: "desktop", name: "Desktop", width: 1440 },
  { id: "tablet", name: "Tablet", width: 768 },
  { id: "mobile", name: "Mobile", width: 375 }
];

interface FrameState {
  deviceWidth: number;
  reloadKey: number;
}

export default function FigmaCanvas() {
  // World / Mode State: 'static_and_system' or 'dynamic_templates'
  const [worldMode, setWorldMode] = useState<WorldMode>("static_and_system");

  // Pan & Zoom State
  const [zoom, setZoom] = useState<number>(0.55);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 120 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  // Active theme state
  const [activeThemeId, setActiveThemeId] = useState<string>("default-minimal");
  const [availableThemes, setAvailableThemes] = useState<Array<{ id: string; name: string }>>([
    { id: "default-minimal", name: "Default Minimal (Մաքուր Լռելյայն)" }
  ]);

  // Selected mock data per page
  const [selectedMockIds, setSelectedMockIds] = useState<Record<string, string>>({
    "master-blog": "post-1",
    "master-product": "prod-1",
    "master-work": "work-pasta"
  });

  // Individual frame state (device width, reload key)
  const [frameStates, setFrameStates] = useState<Record<string, FrameState>>({});

  // Selected block from iframe click
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<{
    pageId: string;
    blockId: string;
    blockType: string;
    bounds?: any;
  } | null>(null);

  // References
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ startX: number; startY: number; panX: number; panY: number }>({
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0
  });
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

  // 1. Fetch active and available physical themes on mount
  useEffect(() => {
    fetch("/api/themes/active")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setActiveThemeId(data.activeThemeId);
          if (data.availableThemes && data.availableThemes.length > 0) {
            setAvailableThemes(data.availableThemes);
          }
        }
      })
      .catch((err) => console.warn("Failed to load active theme in canvas:", err));
  }, []);

  // 2. Filter pages according to active World / Mode
  const visiblePages = useMemo(() => {
    return pagesSchema.pages.filter((page) => page.world === worldMode);
  }, [worldMode]);

  const dynamicPages = useMemo(() => {
    return pagesSchema.pages.filter((page) => page.type === "dynamic_master");
  }, []);

  // 3. Spacebar tracking for Pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed && !(e.target as HTMLElement)?.isContentEditable && (e.target as HTMLElement)?.tagName !== "INPUT") {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  // 4. Smooth Mouse Drag (Pan) Handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Pan on spacebar + click, middle-click (button 1), or clicking canvas background
      if (e.button === 1 || isSpacePressed || e.target === canvasContainerRef.current) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          panX: pan.x,
          panY: pan.y
        };
      }
    },
    [isSpacePressed, pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      e.preventDefault();
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  // 5. Centered Mouse Wheel Zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Zoom on Ctrl/Cmd + wheel, Alt + wheel, or pinch gesture
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
        const newZoom = Math.min(2.0, Math.max(0.2, zoom + zoomDelta));

        // Center zoom relative to mouse coordinates
        if (canvasContainerRef.current) {
          const rect = canvasContainerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const scaleRatio = newZoom / zoom;
          setPan((prevPan) => ({
            x: mouseX - (mouseX - prevPan.x) * scaleRatio,
            y: mouseY - (mouseY - prevPan.y) * scaleRatio
          }));
        }

        setZoom(newZoom);
      } else {
        // Normal wheel pans the canvas vertically/horizontally
        e.preventDefault();
        setPan((prev) => ({
          x: prev.x - e.deltaX * 0.8,
          y: prev.y - e.deltaY * 0.8
        }));
      }
    },
    [zoom]
  );

  // 6. Zoom to Fit
  const handleZoomFit = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const containerWidth = canvasContainerRef.current.clientWidth;
    const totalFramesWidth = visiblePages.length * (1440 + 64);
    const fitZoom = Math.min(0.85, Math.max(0.25, (containerWidth - 120) / totalFramesWidth));
    setZoom(fitZoom);
    setPan({ x: 60, y: 100 });
  }, [visiblePages]);

  // 7. Theme Switcher Handler: Updates Supabase and broadcasts to all iframes
  const handleThemeChange = async (newThemeId: string) => {
    setActiveThemeId(newThemeId);
    try {
      const res = await fetch("/api/themes/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: newThemeId })
      });
      const data = await res.json();
      if (data.success) {
        // Broadcast to all active iframes with 0ms delay
        Object.values(iframeRefs.current).forEach((iframe) => {
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                type: "SWITCH_THEME",
                themeId: newThemeId,
                cssVariables: data.themeConfig?.cssVariables
              },
              "*"
            );
          }
        });
      }
    } catch (err) {
      console.error("Failed to switch theme:", err);
    }
  };

  // 8. Mock Data Switcher: Sends selected mock data to iframe live
  const handleMockDataChange = (pageId: string, mockId: string) => {
    setSelectedMockIds((prev) => ({ ...prev, [pageId]: mockId }));

    const pageDef = pagesSchema.pages.find((p) => p.id === pageId);
    const selectedDataset = pageDef?.mockDatasets?.find((d: any) => d.id === mockId);

    if (selectedDataset && iframeRefs.current[pageId]?.contentWindow) {
      iframeRefs.current[pageId]!.contentWindow!.postMessage(
        {
          type: "SET_MOCK_DATA",
          mockData: selectedDataset.data
        },
        "*"
      );
    }
  };

  // 9. Frame Device Switcher (Desktop 1440, Tablet 768, Mobile 375)
  const handleDeviceChange = (pageId: string, width: number) => {
    setFrameStates((prev) => ({
      ...prev,
      [pageId]: {
        ...(prev[pageId] || { reloadKey: 0 }),
        deviceWidth: width
      }
    }));
  };

  // 10. Frame Reload
  const handleReloadFrame = (pageId: string) => {
    setFrameStates((prev) => ({
      ...prev,
      [pageId]: {
        ...(prev[pageId] || { deviceWidth: 1440 }),
        reloadKey: (prev[pageId]?.reloadKey || 0) + 1
      }
    }));
  };

  // 11. Listen for messages from iframes
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "BLOCK_CLICKED") {
        setSelectedBlockInfo({
          pageId: "active",
          blockId: data.blockId,
          blockType: data.blockType,
          bounds: data.bounds
        });
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, []);

  return (
    <div
      ref={canvasContainerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#090d16",
        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        cursor: isPanning ? "grabbing" : isSpacePressed ? "grab" : "default",
        userSelect: "none"
      }}
    >
      {/* Canvas Top Floating Toolbar */}
      <CanvasToolbar
        currentWorld={worldMode}
        onWorldChange={setWorldMode}
        zoom={zoom}
        onZoomChange={setZoom}
        onResetZoom={() => setZoom(1.0)}
        onZoomFit={handleZoomFit}
        activeThemeId={activeThemeId}
        availableThemes={availableThemes}
        onThemeChange={handleThemeChange}
        selectedMockIds={selectedMockIds}
        onMockDataChange={handleMockDataChange}
        dynamicPages={dynamicPages}
      />

      {/* Transformable Canvas Workspace */}
      <div
        className="hd-canvas-transform-layer"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          gap: "64px",
          padding: "60px 40px",
          transition: isPanning ? "none" : "transform 0.05s ease-out"
        }}
      >
        {visiblePages.map((page) => {
          const frameWidth = frameStates[page.id]?.deviceWidth || page.width || 1440;
          const frameHeight = page.height || 900;
          const reloadKey = frameStates[page.id]?.reloadKey || 0;

          // Badges and styles per page type
          const isSystem = page.type === "system";
          const isDynamic = page.type === "dynamic_master";

          const badgeColor = isSystem ? "#ef4444" : isDynamic ? "#a855f7" : "#14b8a6";
          const badgeText = isSystem ? "SYSTEM" : isDynamic ? "MASTER TEMPLATE" : "STATIC";

          return (
            <div
              key={page.id}
              className="hd-canvas-frame-container"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                width: frameWidth
              }}
            >
              {/* Frame Header Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 14px",
                  backgroundColor: "rgba(30, 41, 59, 0.95)",
                  backdropFilter: "blur(12px)",
                  borderRadius: "10px 10px 0 0",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderBottom: "none",
                  color: "#f8fafc",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                {/* Title & Route Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: "4px",
                      backgroundColor: `${badgeColor}22`,
                      color: badgeColor,
                      border: `1px solid ${badgeColor}55`,
                      letterSpacing: "0.5px"
                    }}
                  >
                    {badgeText}
                  </span>
                  <span style={{ fontWeight: 700 }}>{page.title}</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>{page.route}</span>
                </div>

                {/* Device Breakpoint Switches & Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {DEVICE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleDeviceChange(page.id, preset.width)}
                      title={`Switch to ${preset.name} (${preset.width}px)`}
                      style={{
                        background: frameWidth === preset.width ? "rgba(20, 184, 166, 0.2)" : "transparent",
                        border: frameWidth === preset.width ? "1px solid #14b8a6" : "1px solid transparent",
                        color: frameWidth === preset.width ? "#14b8a6" : "#94a3b8",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "10px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}

                  {/* Reload Frame Button */}
                  <button
                    onClick={() => handleReloadFrame(page.id)}
                    title="Reload Frame"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "2px 6px",
                      fontSize: "12px"
                    }}
                  >
                    ↻
                  </button>

                  {/* Open standalone */}
                  <a
                    href={page.route}
                    target="_blank"
                    rel="noreferrer"
                    title="Open Page in New Tab"
                    style={{
                      color: "#94a3b8",
                      textDecoration: "none",
                      padding: "2px 6px",
                      fontSize: "12px"
                    }}
                  >
                    ↗
                  </a>
                </div>
              </div>

              {/* Iframe Viewport Container */}
              <div
                style={{
                  position: "relative",
                  width: frameWidth,
                  height: frameHeight,
                  backgroundColor: "#ffffff",
                  borderRadius: "0 0 10px 10px",
                  overflow: "hidden",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.12)"
                }}
              >
                {/* Pointer-events blocker during panning */}
                {isPanning && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 100,
                      cursor: "grabbing",
                      backgroundColor: "transparent"
                    }}
                  />
                )}

                <iframe
                  key={`${page.id}-${reloadKey}`}
                  ref={(el) => {
                    iframeRefs.current[page.id] = el;
                  }}
                  src={`${page.route}?builder=true`}
                  title={page.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    pointerEvents: isPanning ? "none" : "auto"
                  }}
                />
              </div>

              {/* Frame Dimensions Label */}
              <div style={{ textAlign: "center", fontSize: "11px", color: "rgba(255, 255, 255, 0.35)", fontWeight: 500 }}>
                {frameWidth} × {frameHeight} px
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Block Info Toast (Bottom Left) */}
      {selectedBlockInfo && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: 20,
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            border: "1px solid #14b8a6",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)"
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14b8a6" }}></span>
          <span>
            Selected Block: <strong>{selectedBlockInfo.blockId}</strong> ({selectedBlockInfo.blockType})
          </span>
          <button
            onClick={() => setSelectedBlockInfo(null)}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "12px",
              marginLeft: 8
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
