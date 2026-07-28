"use client";

import { useEffect } from "react";

export default function HdVideoInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const registerHdVideo = (tagName: string) => {
      if (!customElements.get(tagName)) {
        class HdVideoElement extends HTMLElement {
          private root: ShadowRoot | null = null;
          private videoEl: HTMLVideoElement | null = null;

          connectedCallback() {
            if (this.root) return;
            this.root = this.attachShadow({ mode: "open" });

            const src = this.getAttribute("src") || "https://api.hakobian.am/libs/v1/promo/promo.mp4";
            const poster = this.getAttribute("poster") || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
            const thickness = this.getAttribute("data-thickness") || "3px";
            const color = this.getAttribute("data-color") || "var(--primary-color, #083f39)";
            const radius = this.getAttribute("data-radius") || "16px";
            const width = this.getAttribute("data-width") || "100%";
            const height = this.getAttribute("data-height") || "320px";
            const autoplay = this.hasAttribute("autoplay");
            const loop = this.hasAttribute("loop");
            const muted = this.hasAttribute("muted");
            const controls = !this.hasAttribute("no-controls");

            this.root.innerHTML = `
              <style>
                :host {
                  display: block;
                  width: ${width};
                  height: ${height};
                }
                .player-wrap {
                  position: relative;
                  width: 100%;
                  height: 100%;
                  border-radius: ${radius};
                  border: ${thickness} solid ${color};
                  overflow: hidden;
                  background-color: #060909;
                  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
                  box-sizing: border-box;
                }
                video {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  display: block;
                }
                .badge {
                  position: absolute;
                  top: 12px;
                  left: 12px;
                  background: rgba(0,0,0,0.65);
                  backdrop-filter: blur(8px);
                  border: 1px solid ${color}aa;
                  padding: 4px 10px;
                  border-radius: 20px;
                  color: #ffffff;
                  font-family: system-ui, sans-serif;
                  font-size: 0.7rem;
                  font-weight: bold;
                  letter-spacing: 0.5px;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  z-index: 2;
                }
                .dot {
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  background: #00ffaa;
                  box-shadow: 0 0 6px #00ffaa;
                }
              </style>
              <div class="player-wrap">
                <video src="${src}" poster="${poster}" ${autoplay ? "autoplay" : ""} ${loop ? "loop" : ""} ${muted ? "muted" : ""} ${controls ? "controls" : ""}></video>
              </div>
            `;

            this.videoEl = this.root.querySelector("video");
          }
        }
        customElements.define(tagName, HdVideoElement);
      }
    };

    const timer = setTimeout(() => {
      registerHdVideo("hd-video");
      registerHdVideo("hd-video-player");
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
