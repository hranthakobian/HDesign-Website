"use client";

import React, { useState, useRef, useEffect } from "react";

export interface HdVideoPlayerProps {
  src?: string;
  poster?: string;
  width?: string;
  height?: string;
  thickness?: string;
  color?: string;
  textColor?: string;
  radius?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function HdVideoPlayer({
  src = "https://api.hakobian.am/libs/v1/promo/promo.mp4",
  poster = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
  width = "100%",
  height = "auto",
  thickness = "3px",
  color = "var(--primary-color, #083f39)",
  textColor = "#ffffff",
  radius = "24px",
  autoplay = false,
  loop = true,
  muted = false,
  showControls = true,
  className = "",
  style = {}
}: HdVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.volume = volume;
    video.playbackRate = playbackRate;

    if (autoplay) {
      video.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
      }).catch(() => {});
    }
  }, [autoplay, isMuted, volume, playbackRate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      setHasStarted(true);
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest(".hd-video-controls")) return;
    togglePlay();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.duration) {
      setDuration(video.duration);
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (video) {
      video.volume = newVol;
      if (newVol === 0) {
        setIsMuted(true);
        video.muted = true;
      } else {
        setIsMuted(false);
        video.muted = false;
      }
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  const getIframeSrc = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.includes("youtube.com/watch")) {
      const id = trimmed.split("v=")[1]?.split("&")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (trimmed.includes("youtu.be/")) {
      const id = trimmed.split("youtu.be/")[1]?.split("?")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (trimmed.includes("youtube.com/shorts/")) {
      const id = trimmed.split("youtube.com/shorts/")[1]?.split("?")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (trimmed.includes("youtube.com/embed/")) {
      return trimmed;
    }
    if (trimmed.includes("vimeo.com/")) {
      const id = trimmed.split("vimeo.com/")[1]?.split("?")[0]?.split("#")[0];
      if (id && !isNaN(Number(id))) return `https://player.vimeo.com/video/${id}`;
    }
    if (trimmed.includes("player.vimeo.com/video/")) {
      return trimmed;
    }
    if (trimmed.includes("loom.com/share/")) {
      const id = trimmed.split("loom.com/share/")[1]?.split("?")[0];
      if (id) return `https://www.loom.com/embed/${id}`;
    }
    if (trimmed.includes("loom.com/embed/")) {
      return trimmed;
    }
    return null;
  };

  const iframeUrl = getIframeSrc(src);

  if (iframeUrl) {
    return (
      <div
        className={`hd-video-container ${className}`}
        style={{
          position: "relative",
          width: width,
          maxWidth: "100%",
          aspectRatio: "16 / 9",
          height: height === "auto" || !height ? "auto" : height,
          borderRadius: radius,
          border: "none",
          overflow: "hidden",
          backgroundColor: "#060909",
          boxShadow: "0 0 30px rgba(0, 0, 0, 0.08)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          ...style
        }}
      >
        <iframe
          src={iframeUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsHoveringControls(false);
        setShowSpeedMenu(false);
        setCursorPos(null);
      }}
      onMouseMove={handleMouseMove}
      onClick={handleContainerClick}
      className={`hd-video-container ${className}`}
      style={{
        position: "relative",
        width: width,
        maxWidth: "100%",
        aspectRatio: "16 / 9",
        height: height === "auto" || !height ? "auto" : height,
        borderRadius: radius,
        border: "none",
        overflow: "hidden",
        backgroundColor: "#060909",
        boxShadow: "0 0 30px rgba(0, 0, 0, 0.08)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        userSelect: "none",
        transition: "all 0.3s ease",
        cursor: isHovered && !isHoveringControls ? "none" : "default",
        ...style
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        onPlay={() => {
          setIsPlaying(true);
          setHasStarted(true);
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block"
        }}
      />

      {/* Dynamic Cursor / Central Play/Pause Button */}
      <div
        style={{
          position: "absolute",
          left: isHovered && cursorPos ? `${cursorPos.x}px` : "50%",
          top: isHovered && cursorPos ? `${cursorPos.y}px` : "50%",
          transform: "translate(-50%, -50%)",
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, rgba(10,20,20,0.85) 100%)`,
          border: "none",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(10px)",
          pointerEvents: "none",
          zIndex: 8,
          opacity: isHoveringControls ? 0 : (!isPlaying || isHovered) ? 1 : 0,
          transition: isHovered
            ? "transform 0.05s ease-out, opacity 0.2s ease"
            : "left 0.3s ease, top 0.3s ease, transform 0.25s ease, opacity 0.25s ease"
        }}
      >
        {isPlaying ? (
          <span className="icon-Pause" style={{ fontSize: "28px", color: "#ffffff" }} />
        ) : (
          <span className="icon-Play" style={{ fontSize: "28px", color: "#ffffff" }} />
        )}
      </div>

      {/* Bottom Controls Bar (Only rendered/shown after video has started) */}
      {showControls && hasStarted && (
        <div
          className="hd-video-controls"
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)",
            backdropFilter: "blur(12px)",
            padding: "16px 20px 14px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            zIndex: 10,
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: isHovered ? "auto" : "none",
            cursor: "default"
          }}
        >
          {/* Custom Timeline Progress Slider */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSeek}
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "3px",
                appearance: "none",
                WebkitAppearance: "none",
                background: `linear-gradient(to right, ${color} ${progress}%, rgba(255, 255, 255, 0.2) ${progress}%)`,
                outline: "none",
                cursor: "pointer",
                transition: "height 0.15s ease"
              }}
            />
          </div>

          {/* Control Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#ffffff", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {/* Play/Pause (HDIcons) */}
              <button
                onClick={togglePlay}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px"
                }}
                title={isPlaying ? "Դադարեցնել" : "Նվագարկել"}
              >
                {isPlaying ? (
                  <span className="icon-Pause" style={{ fontSize: "18px" }} />
                ) : (
                  <span className="icon-Play" style={{ fontSize: "18px" }} />
                )}
              </button>

              {/* Mute/Volume (HDIcons) */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={toggleMute}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px"
                  }}
                  title={isMuted ? "Միացնել ձայնը" : "Անջատել ձայնը"}
                >
                  <span
                    className={
                      isMuted || volume === 0
                        ? "icon-Volume-Mute"
                        : volume < 0.5
                        ? "icon-Low-Volume"
                        : "icon-High-Volume"
                    }
                    style={{ fontSize: "18px" }}
                  />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{
                    width: "70px",
                    height: "4px",
                    appearance: "none",
                    WebkitAppearance: "none",
                    background: `linear-gradient(to right, ${color} ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 0%)`,
                    borderRadius: "2px",
                    outline: "none",
                    cursor: "pointer"
                  }}
                />
              </div>

              {/* Time display */}
              <span style={{ fontSize: "0.78rem", opacity: 0.85, fontFamily: "monospace" }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              {/* Playback speed selector */}
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title="Նվագարկման արագություն"
              >
                <span className="icon-Speed" style={{ fontSize: "14px" }} />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "36px",
                    right: "40px",
                    background: "rgba(15, 22, 22, 0.95)",
                    border: `1px solid ${color}88`,
                    borderRadius: "8px",
                    padding: "4px 0",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 20,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.5)"
                  }}
                >
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      style={{
                        background: playbackRate === rate ? color : "transparent",
                        border: "none",
                        color: "#ffffff",
                        padding: "6px 14px",
                        fontSize: "0.75rem",
                        textAlign: "left",
                        cursor: "pointer"
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}

              {/* Fullscreen / Expand icon */}
              <button
                onClick={toggleFullscreen}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px"
                }}
                title={isFullscreen ? "Փոքրացնել" : "Ամբողջ էկրանով"}
              >
                <span className={isFullscreen ? "icon-Expand" : "icon-Full-Screen"} style={{ fontSize: "18px" }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
