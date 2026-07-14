"use client";

import { useEffect } from "react";

export default function HDesignRevealInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Define the custom element hd-reveal if it hasn't been registered yet
    if (!customElements.get("hd-reveal")) {
      class HdReveal extends HTMLElement {
        private observer: IntersectionObserver | null = null;
        private initTimeout: any = null;

        connectedCallback() {
          this.initTimeout = setTimeout(() => {
            // Set display block to allow width/height/transformations
            this.style.display = "block";
            
            const direction = this.getAttribute("data-direction") || "up"; // up, down, left, right, scale, fade
            const delay = this.getAttribute("data-delay") || "0";
            const duration = this.getAttribute("data-duration") || "800";
            const threshold = parseFloat(this.getAttribute("data-threshold") || "0.1");

            this.classList.add("hd-reveal");
            this.classList.add(`reveal-${direction}`);
            
            if (delay && delay !== "0") {
              this.style.transitionDelay = `${delay}ms`;
            }
            if (duration && duration !== "800") {
              this.style.transitionDuration = `${duration}ms`;
            }

            this.observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    this.classList.add("hd-revealed");
                    // Animate once and stop observing
                    if (this.observer) {
                      this.observer.disconnect();
                    }
                  }
                });
              },
              {
                threshold: threshold,
                rootMargin: "0px 0px -50px 0px" // Trigger slightly before reaching the bottom of the viewport
              }
            );

            this.observer.observe(this);
          }, 0);
        }

        disconnectedCallback() {
          if (this.initTimeout) {
            clearTimeout(this.initTimeout);
          }
          if (this.observer) {
            this.observer.disconnect();
          }
        }
      }

      customElements.define("hd-reveal", HdReveal);
    }
  }, []);

  return null;
}
