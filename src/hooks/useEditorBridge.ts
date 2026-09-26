"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { BlockStyles, BoundingRect, EditorBridgeMessage } from '@/types/builder';

/**
 * Client component to be embedded in layout.tsx to activate the live editor bridge
 */
export function EditorBridge() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isBuilder = window.location.search.includes('builder=true') || (window.parent && window.parent !== window);
    if (isBuilder && !document.getElementById('hd-editor-bridge-script')) {
      const script = document.createElement('script');
      script.id = 'hd-editor-bridge-script';
      script.src = '/editor-bridge.js';
      document.head.appendChild(script);
    }
  }, []);

  return null;
}

interface UseEditorBridgeProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onBlockSelect?: (blockId: string | null) => void;
  onBlockBoundsChange?: (bounds: BoundingRect) => void;
  onPageNavigate?: (url: string) => void;
  onDynamicRouteDetected?: (info: { masterTemplate: string; instanceId: string; url: string }) => void;
}

/**
 * Host-side hook for communicating with the builder canvas iframe with 0ms style injection.
 */
export function useEditorBridge({
  iframeRef,
  onBlockSelect,
  onBlockBoundsChange,
  onPageNavigate,
  onDynamicRouteDetected
}: UseEditorBridgeProps) {
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBounds, setSelectedBounds] = useState<BoundingRect | null>(null);

  // Send message to iframe with wildcard or target origin
  const postToCanvas = useCallback((message: EditorBridgeMessage) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  }, [iframeRef]);

  /**
   * 0ms Real-time Style Injection:
   * Sends style update directly to iframe, which immediately updates
   * element inline styles & CSS variables without waiting for React re-render.
   */
  const injectStyles = useCallback((blockId: string, styles: Partial<BlockStyles>) => {
    postToCanvas({
      type: 'UPDATE_BLOCK_STYLES',
      blockId,
      styles
    });
  }, [postToCanvas]);

  /**
   * Select a block programmatically
   */
  const selectBlock = useCallback((blockId: string | null, blockType?: string) => {
    setSelectedBlockId(blockId);
    postToCanvas({
      type: 'SELECT_BLOCK',
      blockId,
      blockType
    });
  }, [postToCanvas]);

  /**
   * Hover over a block
   */
  const hoverBlock = useCallback((blockId: string | null) => {
    postToCanvas({
      type: 'HOVER_BLOCK',
      blockId
    });
  }, [postToCanvas]);

  /**
   * Reinitialize GSAP, Parallax and Scroll triggers after layout shifts
   */
  const reinitAnimations = useCallback(() => {
    postToCanvas({
      type: 'REINIT_ANIMATIONS'
    });
  }, [postToCanvas]);

  // Handle incoming messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'EDITOR_BRIDGE_READY':
          setIsIframeReady(true);
          break;

        case 'BLOCK_CLICKED':
          if (data.blockId) {
            setSelectedBlockId(data.blockId);
            onBlockSelect?.(data.blockId);
            if (data.bounds) {
              setSelectedBounds(data.bounds);
              onBlockBoundsChange?.(data.bounds);
            }
          }
          break;

        case 'BLOCK_BOUNDS_CHANGED':
          if (data.bounds) {
            setSelectedBounds(data.bounds);
            onBlockBoundsChange?.(data.bounds);
          }
          break;

        case 'NAVIGATE_PAGE':
          if (data.url) {
            onPageNavigate?.(data.url);
          }
          break;

        case 'DYNAMIC_ROUTE_DETECTED':
          if (data.masterTemplate) {
            onDynamicRouteDetected?.({
              masterTemplate: data.masterTemplate,
              instanceId: data.instanceId,
              url: data.url
            });
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBlockSelect, onBlockBoundsChange, onPageNavigate, onDynamicRouteDetected]);

  return {
    isIframeReady,
    selectedBlockId,
    selectedBounds,
    selectBlock,
    hoverBlock,
    injectStyles,
    reinitAnimations,
    postToCanvas
  };
}
