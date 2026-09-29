"use client";

import React from 'react';
import { UploadProgressState, formatBytes } from '@/lib/mediaUpload';

export interface UploadProgressOverlayProps {
  isUploading: boolean;
  progress: UploadProgressState | null;
  mode?: 'fixed' | 'inline';
}

export default function UploadProgressOverlay({
  isUploading,
  progress,
  mode = 'fixed'
}: UploadProgressOverlayProps) {
  if (!isUploading || !progress) return null;

  const percent = Math.min(100, Math.max(0, progress.percent || 0));

  const content = (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(59, 130, 246, 0.35)',
        color: '#ffffff',
        width: mode === 'fixed' ? '380px' : '100%',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 99999,
        animation: 'uploadPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <style>{`
        @keyframes uploadPopIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes uploadShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes uploadPulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 8px #38BDF8); }
        }
        @keyframes uploadRingRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* Animated Spinner Icon */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(6, 182, 212, 0.25))',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-2px',
                borderRadius: '12px',
                border: '2px dashed #38BDF8',
                borderTopColor: 'transparent',
                borderLeftColor: 'transparent',
                animation: 'uploadRingRotate 2s linear infinite'
              }}
            />
            <span
              style={{
                fontSize: '1.2rem',
                animation: 'uploadPulseGlow 1.8s ease-in-out infinite'
              }}
            >
              ☁️
            </span>
          </div>

          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Վերբեռնվում է</span>
              {progress.totalFiles > 1 && (
                <span
                  style={{
                    background: 'rgba(59, 130, 246, 0.3)',
                    color: '#93C5FD',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 600
                  }}
                >
                  {progress.fileIndex + 1} / {progress.totalFiles}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94A3B8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '220px'
              }}
              title={progress.fileName}
            >
              {progress.fileName}
            </div>
          </div>
        </div>

        {/* Percentage Display */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '-0.5px',
              color: '#38BDF8',
              textShadow: '0 0 12px rgba(56, 189, 248, 0.5)'
            }}
          >
            {percent}%
          </div>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '10px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #3B82F6 100%)',
            backgroundSize: '200% 100%',
            borderRadius: '999px',
            animation: 'uploadShimmer 1.8s linear infinite',
            transition: 'width 0.2s ease-out',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.7)'
          }}
        />
      </div>

      {/* Footer Details */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#94A3B8'
        }}
      >
        <span>
          {formatBytes(progress.loadedBytes)} / {formatBytes(progress.totalBytes)}
        </span>
        <span style={{ color: percent === 100 ? '#10B981' : '#60A5FA', fontWeight: 600 }}>
          {percent === 100 ? '✓ Մշակվում է սերվերում...' : 'Տվյալների փոխանցում...'}
        </span>
      </div>
    </div>
  );

  if (mode === 'fixed') {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          pointerEvents: 'auto'
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
