"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BoundingRect, BlockStyles } from '@/types/builder';

interface VisualSelectionBoxProps {
  bounds: BoundingRect | null;
  blockId: string | null;
  blockType?: string;
  blockTitle?: string;
  styles?: BlockStyles;
  onResize?: (width: number, height: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  iframeOffset?: { top: number; left: number };
}

type HandleDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'se' | 'sw';

export default function VisualSelectionBox({
  bounds,
  blockId,
  blockType = 'BLOCK',
  blockTitle,
  styles,
  onResize,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  iframeOffset = { top: 0, left: 0 }
}: VisualSelectionBoxProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandleDirection | null>(null);
  const [currentSize, setCurrentSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const startDragRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number }>({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0
  });

  useEffect(() => {
    if (bounds) {
      setCurrentSize({
        width: Math.round(bounds.width),
        height: Math.round(bounds.height)
      });
    }
  }, [bounds]);

  const handleMouseDown = (e: React.MouseEvent, handle: HandleDirection) => {
    e.preventDefault();
    e.stopPropagation();
    if (!bounds) return;

    setIsResizing(true);
    setActiveHandle(handle);
    startDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: bounds.width,
      startHeight: bounds.height
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startDragRef.current.startX;
      const deltaY = moveEvent.clientY - startDragRef.current.startY;

      let newWidth = startDragRef.current.startWidth;
      let newHeight = startDragRef.current.startHeight;

      if (handle.includes('e')) newWidth += deltaX;
      if (handle.includes('w')) newWidth -= deltaX;
      if (handle.includes('s')) newHeight += deltaY;
      if (handle.includes('n')) newHeight -= deltaY;

      newWidth = Math.max(100, Math.round(newWidth));
      newHeight = Math.max(40, Math.round(newHeight));

      setCurrentSize({ width: newWidth, height: newHeight });
      onResize?.(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveHandle(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!bounds || !blockId) return null;

  const top = bounds.top + iframeOffset.top;
  const left = bounds.left + iframeOffset.left;
  const width = bounds.width;
  const height = bounds.height;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
        border: '2px solid #14b8a6',
        borderRadius: '2px',
        zIndex: 9999,
        boxSizing: 'border-box',
        transition: isResizing ? 'none' : 'all 0.1s ease-out'
      }}
    >
      {/* Top Floating Action Tag */}
      <div
        style={{
          position: 'absolute',
          top: '-32px',
          left: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#083f39',
          color: '#ffffff',
          borderRadius: '6px 6px 0 0',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          pointerEvents: 'auto',
          userSelect: 'none'
        }}
      >
        <span style={{ color: '#14b8a6', fontWeight: 800 }}>⚡</span>
        <span>{blockTitle || blockType.toUpperCase()}</span>
        <span style={{ color: '#99f6e4', fontSize: '10px', opacity: 0.85 }}>
          {currentSize.width} × {currentSize.height}px
        </span>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              title="Տեղափոխել վերև"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                borderRadius: '3px',
                padding: '2px 5px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              ▲
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              title="Տեղափոխել ներքև"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                borderRadius: '3px',
                padding: '2px 5px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              ▼
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              title="Կրկնօրինակել"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                borderRadius: '3px',
                padding: '2px 5px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              ⧉
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Հեռացնել բլոկը"
              style={{
                background: 'rgba(239, 68, 68, 0.4)',
                border: 'none',
                color: '#fca5a5',
                borderRadius: '3px',
                padding: '2px 5px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Resize Handles (Wix Style) */}
      {(['nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'] as HandleDirection[]).map((handle) => {
        let cursorStyle = 'default';
        let styleObj: React.CSSProperties = {
          position: 'absolute',
          width: '10px',
          height: '10px',
          backgroundColor: '#ffffff',
          border: '2px solid #14b8a6',
          borderRadius: '50%',
          pointerEvents: 'auto',
          zIndex: 10000,
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
        };

        if (handle === 'nw') {
          cursorStyle = 'nwse-resize';
          styleObj.top = '-6px';
          styleObj.left = '-6px';
        } else if (handle === 'ne') {
          cursorStyle = 'nesw-resize';
          styleObj.top = '-6px';
          styleObj.right = '-6px';
        } else if (handle === 'se') {
          cursorStyle = 'nwse-resize';
          styleObj.bottom = '-6px';
          styleObj.right = '-6px';
        } else if (handle === 'sw') {
          cursorStyle = 'nesw-resize';
          styleObj.bottom = '-6px';
          styleObj.left = '-6px';
        } else if (handle === 'n') {
          cursorStyle = 'ns-resize';
          styleObj.top = '-6px';
          styleObj.left = 'calc(50% - 5px)';
          styleObj.borderRadius = '2px';
          styleObj.width = '14px';
          styleObj.height = '6px';
        } else if (handle === 's') {
          cursorStyle = 'ns-resize';
          styleObj.bottom = '-6px';
          styleObj.left = 'calc(50% - 5px)';
          styleObj.borderRadius = '2px';
          styleObj.width = '14px';
          styleObj.height = '6px';
        } else if (handle === 'e') {
          cursorStyle = 'ew-resize';
          styleObj.right = '-6px';
          styleObj.top = 'calc(50% - 5px)';
          styleObj.borderRadius = '2px';
          styleObj.height = '14px';
          styleObj.width = '6px';
        } else if (handle === 'w') {
          cursorStyle = 'ew-resize';
          styleObj.left = '-6px';
          styleObj.top = 'calc(50% - 5px)';
          styleObj.borderRadius = '2px';
          styleObj.height = '14px';
          styleObj.width = '6px';
        }

        return (
          <div
            key={handle}
            onMouseDown={(e) => handleMouseDown(e, handle)}
            style={{
              ...styleObj,
              cursor: cursorStyle,
              transform: activeHandle === handle ? 'scale(1.3)' : 'scale(1)',
              backgroundColor: activeHandle === handle ? '#14b8a6' : '#ffffff'
            }}
          />
        );
      })}

      {/* Live Resizing Tooltip */}
      {isResizing && (
        <div
          style={{
            position: 'absolute',
            bottom: '-28px',
            right: '0',
            backgroundColor: '#14b8a6',
            color: '#ffffff',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            pointerEvents: 'none'
          }}
        >
          {currentSize.width}px × {currentSize.height}px
        </div>
      )}
    </div>
  );
}
