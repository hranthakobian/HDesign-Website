"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";

interface EditorBridgeContextType {
  isInsideIframe: boolean;
  isEditorActive: boolean;
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  mockData: Record<string, any>;
  activeThemeId: string;
  selectBlock: (blockId: string | null) => void;
  updateMockData: (data: Record<string, any>) => void;
}

const EditorBridgeContext = createContext<EditorBridgeContextType>({
  isInsideIframe: false,
  isEditorActive: false,
  selectedBlockId: null,
  hoveredBlockId: null,
  mockData: {},
  activeThemeId: "default-minimal",
  selectBlock: () => {},
  updateMockData: () => {}
});

export function useEditorBridgeContext() {
  return useContext(EditorBridgeContext);
}

interface EditorBridgeProviderProps {
  children: ReactNode;
  initialThemeId?: string;
  initialMockData?: Record<string, any>;
}

export function EditorBridgeProvider({
  children,
  initialThemeId = "default-minimal",
  initialMockData = {}
}: EditorBridgeProviderProps) {
  const [isInsideIframe, setIsInsideIframe] = useState<boolean>(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [mockData, setMockData] = useState<Record<string, any>>(initialMockData);
  const [activeThemeId, setActiveThemeId] = useState<string>(initialThemeId);

  // 1. Strict Security Boundary: Check if running inside iframe
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const inIframe = window.self !== window.top;
      setIsInsideIframe(inIframe);

      if (inIframe) {
        document.documentElement.classList.add("hd-builder-iframe-mode");
        // Inform parent builder that guest frame is ready
        window.parent.postMessage(
          {
            type: "EDITOR_BRIDGE_READY",
            url: window.location.pathname + window.location.search,
            timestamp: Date.now()
          },
          "*"
        );
      }
    } catch (e) {
      // In case cross-origin iframe security throws, treat as inside iframe
      setIsInsideIframe(true);
    }
  }, []);

  // 2. Inject scoped editor styles ONLY if inside iframe
  useEffect(() => {
    if (!isInsideIframe || typeof document === "undefined") return;

    const styleId = "hd-injected-editor-bridge-styles";
    if (document.getElementById(styleId)) return;

    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = `
      .hd-builder-editable-block,
      [data-block-id] {
        position: relative !important;
        cursor: pointer !important;
        transition: outline 0.12s ease, box-shadow 0.12s ease !important;
      }

      .hd-builder-editable-block:hover,
      [data-block-id]:hover {
        outline: 2px dashed #14b8a6 !important;
        outline-offset: -2px !important;
      }

      .hd-builder-editable-block.is-selected,
      [data-block-id].is-selected {
        outline: 2px solid #0d9488 !important;
        outline-offset: -2px !important;
        box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.25) !important;
      }

      .hd-block-badge {
        position: absolute;
        top: 8px;
        left: 12px;
        background: #0f172a;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 3px 8px;
        border-radius: 4px;
        pointer-events: none;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 4px;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      [contenteditable="true"] {
        cursor: text !important;
      }

      [contenteditable="true"]:focus {
        outline: 2px solid #0284c7 !important;
        background-color: rgba(2, 132, 199, 0.05) !important;
        border-radius: 4px !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
    };
  }, [isInsideIframe]);

  // 3. PostMessage Event Listener for 0ms Live Sync
  useEffect(() => {
    if (!isInsideIframe || typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      switch (data.type) {
        // 0ms delay direct style manipulation
        case "UPDATE_BLOCK_STYLES": {
          const { blockId, styles } = data;
          if (!blockId || !styles) return;

          const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
          if (el) {
            Object.entries(styles).forEach(([prop, val]) => {
              if (val !== undefined && val !== null) {
                el.style.setProperty(prop, String(val));
              }
            });
          }
          break;
        }

        // 0ms delay direct text update
        case "UPDATE_BLOCK_TEXT": {
          const { blockId, key, text } = data;
          if (!blockId || !key) return;

          const target = document.querySelector(`[data-block-id="${blockId}"] [data-editable-key="${key}"]`) as HTMLElement;
          if (target && target.innerText !== text) {
            target.innerText = text;
          }
          break;
        }

        // Live mock data replacement for dynamic master templates
        case "SET_MOCK_DATA": {
          if (data.mockData) {
            setMockData(data.mockData);
          }
          break;
        }

        // Instant theme switcher
        case "SWITCH_THEME": {
          if (data.themeId) {
            setActiveThemeId(data.themeId);
            // Replace theme class on root
            document.documentElement.className = document.documentElement.className
              .replace(/theme-[a-zA-Z0-9_-]+/g, "")
              .trim();
            document.documentElement.classList.add(`theme-${data.themeId}`);

            // Apply custom CSS variables if provided
            if (data.cssVariables) {
              Object.entries(data.cssVariables).forEach(([k, v]) => {
                document.documentElement.style.setProperty(k, String(v));
              });
            }
          }
          break;
        }

        // Select a block programmatically from builder sidebar/layers
        case "SELECT_BLOCK": {
          setSelectedBlockId(data.blockId || null);
          document.querySelectorAll(".is-selected").forEach((el) => el.classList.remove("is-selected"));

          if (data.blockId) {
            const el = document.querySelector(`[data-block-id="${data.blockId}"]`) as HTMLElement;
            if (el) {
              el.classList.add("is-selected");
              el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          }
          break;
        }

        // Hover block
        case "HOVER_BLOCK": {
          setHoveredBlockId(data.blockId || null);
          break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isInsideIframe]);

  // 4. Click & ContentEditable Interceptors (Active ONLY inside iframe)
  useEffect(() => {
    if (!isInsideIframe || typeof document === "undefined") return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find nearest block container
      const blockEl = target.closest("[data-block-id]") as HTMLElement;
      if (blockEl) {
        // Prevent accidental link navigation while in visual builder
        if (target.tagName.toLowerCase() === "a" || target.closest("a")) {
          e.preventDefault();
        }

        const blockId = blockEl.getAttribute("data-block-id");
        const blockType = blockEl.getAttribute("data-block-type") || "block";
        const bounds = blockEl.getBoundingClientRect();

        setSelectedBlockId(blockId);

        // Highlight in DOM
        document.querySelectorAll(".is-selected").forEach((el) => el.classList.remove("is-selected"));
        blockEl.classList.add("is-selected");

        // Send click to parent builder
        window.parent.postMessage(
          {
            type: "BLOCK_CLICKED",
            blockId,
            blockType,
            bounds: {
              top: bounds.top,
              left: bounds.left,
              width: bounds.width,
              height: bounds.height
            }
          },
          "*"
        );
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || !target.isContentEditable) return;

      const blockEl = target.closest("[data-block-id]") as HTMLElement;
      const key = target.getAttribute("data-editable-key");
      const blockId = blockEl ? blockEl.getAttribute("data-block-id") : null;

      if (blockId && key) {
        window.parent.postMessage(
          {
            type: "BLOCK_TEXT_CHANGED",
            blockId,
            key,
            text: target.innerText
          },
          "*"
        );
      }
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("input", handleInput, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("input", handleInput, true);
    };
  }, [isInsideIframe]);

  const selectBlock = useCallback(
    (blockId: string | null) => {
      setSelectedBlockId(blockId);
      if (typeof window !== "undefined" && isInsideIframe) {
        window.parent.postMessage({ type: "BLOCK_SELECTED", blockId }, "*");
      }
    },
    [isInsideIframe]
  );

  const updateMockData = useCallback((data: Record<string, any>) => {
    setMockData(data);
  }, []);

  const contextValue = useMemo(
    () => ({
      isInsideIframe,
      isEditorActive: isInsideIframe,
      selectedBlockId,
      hoveredBlockId,
      mockData,
      activeThemeId,
      selectBlock,
      updateMockData
    }),
    [isInsideIframe, selectedBlockId, hoveredBlockId, mockData, activeThemeId, selectBlock, updateMockData]
  );

  return <EditorBridgeContext.Provider value={contextValue}>{children}</EditorBridgeContext.Provider>;
}
