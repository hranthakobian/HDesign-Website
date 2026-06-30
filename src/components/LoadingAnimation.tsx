"use client";

import { useEffect, useRef } from 'react';
import animationData from '@/assets/loading-animation.json';

interface LoadingAnimationProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingAnimation({ message, fullPage = true }: LoadingAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    // Dynamically import lottie-web to avoid SSR "window is not defined" error
    import('lottie-web').then((lottieModule) => {
      if (!isMounted || !containerRef.current) return;

      const lottie = lottieModule.default;
      
      // Destroy any existing instance just in case
      if (animRef.current) {
        animRef.current.destroy();
      }

      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animationData,
      });
    });

    return () => {
      isMounted = false;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, []);

  const mergedContainerStyle: React.CSSProperties = {
    ...containerStyle,
    minHeight: fullPage ? '100vh' : 'auto',
    background: fullPage ? 'var(--bg)' : 'transparent',
    padding: fullPage ? '40px' : '0',
  };

  const mergedLottieStyle: React.CSSProperties = {
    ...lottieContainerStyle,
    width: fullPage ? '180px' : '100px',
    height: fullPage ? '180px' : '100px',
  };

  return (
    <div style={mergedContainerStyle}>
      <div style={contentStyle}>
        <div ref={containerRef} style={mergedLottieStyle} />
        {message && <p style={messageStyle}>{message}</p>}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  color: 'var(--text)',
  fontFamily: 'HDesign, sans-serif',
  boxSizing: 'border-box',
};

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '24px',
};

const lottieContainerStyle: React.CSSProperties = {
  width: '180px',
  height: '180px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  // Smooth entrance scale animation
  animation: 'fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  fontWeight: 500,
  color: 'var(--text)',
  opacity: 0.8,
  letterSpacing: '0.05em',
  // Pulse animation to make the loading text look alive
  animation: 'pulseText 2s ease-in-out infinite',
};

// Add raw CSS for animations keyframes (Next.js client-side injection)
if (typeof document !== 'undefined') {
  const styleId = 'loading-animation-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      @keyframes pulseText {
        0% { opacity: 0.5; }
        50% { opacity: 0.9; }
        100% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }
}
