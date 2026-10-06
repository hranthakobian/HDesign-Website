"use client";

import React, { useState } from "react";

export type SocialLinkItem = {
  id: string;
  platform?: string;
  label: string;
  url: string;
  brandColor?: string;
  customSvg?: string;
  enabled?: boolean;
};

export type SocialLinksData = SocialLinkItem[] | Record<string, string> | undefined;

export const PRESET_PLATFORMS: Array<{
  key: string;
  label: string;
  brandColor: string;
  defaultUrl: string;
  icon: React.ReactNode;
}> = [
  {
    key: "linkedin",
    label: "LinkedIn",
    brandColor: "#0A66C2",
    defaultUrl: "https://linkedin.com/in/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    )
  },
  {
    key: "instagram",
    label: "Instagram",
    brandColor: "#E4405F",
    defaultUrl: "https://instagram.com/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    )
  },
  {
    key: "gitlab",
    label: "GitLab",
    brandColor: "#FC6D26",
    defaultUrl: "https://gitlab.com/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 5.48 2a.44.44 0 0 1 .4.28l2.22 6.86h7.8l2.22-6.86a.44.44 0 0 1 .4-.28.42.42 0 0 1 .77.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z" />
      </svg>
    )
  },
  {
    key: "behance",
    label: "Behance",
    brandColor: "#0057FF",
    defaultUrl: "https://behance.net/",
    icon: (
      <svg viewBox="0 4.5 24 15.5" width="100%" height="100%" fill="currentColor">
        <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-4.971 3-3.401 0-5.755-2.168-5.755-5.676 0-3.468 2.373-5.675 5.568-5.675 3.391 0 5.155 2.126 5.155 5.374 0 .524-.07 1.053-.105 1.258h-7.797c.071 1.543 1.157 2.474 2.766 2.474 1.267 0 2.109-.545 2.502-1.397l2.642.642zm-5.029-4.733c-.07-1.12-.767-1.849-2.067-1.849-1.258 0-2.046.729-2.222 1.849h4.289zM8.361 11.028c1.396-.445 2.22-1.488 2.22-2.915 0-2.483-1.874-3.464-4.526-3.464H0v15h6.326c2.894 0 4.908-1.155 4.908-3.957 0-1.884-1.206-3.056-2.873-3.664zM3.409 6.945h2.516c1.295 0 2.138.547 2.138 1.674 0 1.09-.843 1.637-2.138 1.637H3.409V6.945zm2.748 10.758H3.409v-4.009h2.748c1.551 0 2.443.684 2.443 1.986 0 1.334-.892 2.023-2.443 2.023z" />
      </svg>
    )
  },
  {
    key: "github",
    label: "GitHub",
    brandColor: "#ffffff",
    defaultUrl: "https://github.com/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    )
  },
  {
    key: "facebook",
    label: "Facebook",
    brandColor: "#1877F2",
    defaultUrl: "https://facebook.com/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  },
  {
    key: "twitter",
    label: "X / Twitter",
    brandColor: "#1DA1F2",
    defaultUrl: "https://x.com/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  {
    key: "youtube",
    label: "YouTube",
    brandColor: "#FF0000",
    defaultUrl: "https://youtube.com/@",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  },
  {
    key: "telegram",
    label: "Telegram",
    brandColor: "#26A5E4",
    defaultUrl: "https://t.me/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    )
  },
  {
    key: "tiktok",
    label: "TikTok",
    brandColor: "#EE1D52",
    defaultUrl: "https://tiktok.com/@",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    )
  },
  {
    key: "discord",
    label: "Discord",
    brandColor: "#5865F2",
    defaultUrl: "https://discord.gg/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    )
  },
  {
    key: "dribbble",
    label: "Dribbble",
    brandColor: "#EA4C89",
    defaultUrl: "https://dribbble.com/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm9.897 10.987a10.02 10.02 0 0 0-4.084-6.49c1.94 1.832 3.275 4.3 3.738 7.074.122-.191.237-.386.346-.584zm-6.02-6.52c-2.073-.91-4.38-1.13-6.577-.63A10.04 10.04 0 0 1 12 1.996c1.378 0 2.698.28 3.877.791zm-8.49.52a9.99 9.99 0 0 0-4.992 5.31c.21-.08.423-.156.64-.229a17.067 17.067 0 0 1 7.218-.946 21.09 21.09 0 0 0-2.866-4.135zM2 12c0 .356.02.708.058 1.054a14.887 14.887 0 0 1 6.556-.255c.038.093.075.187.11.282A26.47 26.47 0 0 0 4.14 17.65 10.007 10.007 0 0 1 2 12zm3.327 7.03a24.475 24.475 0 0 1 4.34-4.28 20.354 20.354 0 0 1 3.522 7.07 10.042 10.042 0 0 1-7.862-2.79zm9.816 2.37a22.25 22.25 0 0 0-3.322-6.8c2.955-.783 5.46-.77 7.424-.53a10.043 10.043 0 0 1-4.102 7.33zm5.02-3.14a13.385 13.385 0 0 0-6.726.44 26.685 26.685 0 0 1-1.088-2.61c3.553-1.07 6.478-.813 7.814-.54v2.71z" />
      </svg>
    )
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    brandColor: "#25D366",
    defaultUrl: "https://wa.me/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.477-.15-.678.15-.2.301-.778.979-.954 1.18-.175.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.894-.798-1.498-1.784-1.674-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.678-1.633-.93-2.235-.245-.587-.494-.507-.678-.517-.176-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.23 3.11c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.377.198 1.896.12.577-.087 1.78-.728 2.03-1.43.25-.702.25-1.304.175-1.43-.075-.126-.276-.201-.577-.351zM12.04 21.758h-.002c-1.754 0-3.473-.472-4.981-1.365l-.357-.212-3.703.971.989-3.61-.233-.37A9.71 9.71 0 0 1 2.3 12.042c0-5.367 4.368-9.734 9.74-9.734 2.6 0 5.044 1.013 6.883 2.851a9.67 9.67 0 0 1 2.85 6.883c0 5.368-4.368 9.735-9.733 9.735zm8.268-18.003A11.642 11.642 0 0 0 12.04 0C5.4 0 0 5.402 0 12.043c0 2.122.554 4.192 1.608 6.015L0 24l6.115-1.603a11.637 11.637 0 0 0 5.925 1.607h.005c6.64 0 12.04-5.403 12.04-12.044 0-3.218-1.253-6.242-3.53-8.517z" />
      </svg>
    )
  },
  {
    key: "pinterest",
    label: "Pinterest",
    brandColor: "#E60023",
    defaultUrl: "https://pinterest.com/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.99-.12-2.52.02-3.6.14-.98.92-6.52.92-6.52s-.23-.47-.23-1.17c0-1.1.64-1.92 1.43-1.92.68 0 1 .5 1 1.12 0 .68-.43 1.7-.66 2.64-.19.79.4 1.44 1.18 1.44 1.42 0 2.51-1.5 2.51-3.66 0-1.91-1.38-3.25-3.34-3.25-2.28 0-3.62 1.71-3.62 3.47 0 .69.26 1.42.6 1.82.06.08.07.15.05.23-.07.28-.22.89-.25 1.01-.04.17-.14.2-.32.12-1.2-.56-1.94-2.31-1.94-3.72 0-3.03 2.2-5.81 6.35-5.81 3.33 0 5.93 2.38 5.93 5.56 0 3.31-2.09 5.98-4.99 5.98-.97 0-1.89-.5-2.2-.1l-.6 2.29c-.22.84-.81 1.9-1.2 2.54A12 12 0 1 0 12 0z" />
      </svg>
    )
  },
  {
    key: "threads",
    label: "Threads",
    brandColor: "#000000",
    defaultUrl: "https://threads.net/@",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12.186 24h-.007C5.463 24 0 18.608 0 12.003 0 5.395 5.463 0 12.179 0c6.48 0 11.577 5.034 11.82 11.777.014.398-.297.733-.695.748-.399.014-.733-.298-.748-.696C12.33 5.556 7.643 1.44 12.179 1.44c-5.874 0-10.74 4.74-10.74 10.563 0 5.823 4.866 10.557 10.74 10.557 5.097 0 9.243-3.61 9.98-8.629-1.263.69-2.736 1.09-4.321 1.09-4.225 0-7.397-2.955-7.397-6.887 0-3.86 3.125-6.85 7.157-6.85 4.316 0 7.377 3.167 7.377 7.632 0 6.012-4.78 10.774-10.789 10.774zm-.17-10.378c2.25 0 3.997-1.488 4.29-3.56-.63-.356-1.577-.565-2.67-.565-2.829 0-4.665 1.558-4.665 3.565 0 1.932 1.624 3.09 3.045 3.09v-.53z" />
      </svg>
    )
  },
  {
    key: "medium",
    label: "Medium",
    brandColor: "#00AB6C",
    defaultUrl: "https://medium.com/@",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
      </svg>
    )
  },
  {
    key: "artstation",
    label: "ArtStation",
    brandColor: "#13AFF0",
    defaultUrl: "https://artstation.com/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.332h13.757l-2.923-5.064L0 17.723zm24 .012c0-.308-.063-.604-.176-.877L15.352 2.45a2.41 2.41 0 0 0-2.148-1.39H9.42l11.455 19.837c1.862-.519 3.125-2.222 3.125-4.162zM8.307 4.795L2.83 14.282h10.954l-5.477-9.487z" />
      </svg>
    )
  },
  {
    key: "reddit",
    label: "Reddit",
    brandColor: "#FF4500",
    defaultUrl: "https://reddit.com/user/",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .616-.318 1.157-.798 1.468.03.208.046.42.046.634 0 3.228-3.756 5.845-8.388 5.845-4.633 0-8.39-2.617-8.39-5.845 0-.214.015-.426.046-.634-.48-.311-.798-.852-.798-1.468 0-.968.786-1.754 1.754-1.754.463 0 .873.174 1.179.467 1.194-.87 2.87-1.442 4.72-1.5l.93-4.364 3.32.7a1.248 1.248 0 0 1 1.248.742zm-7.666 7.64c-.754 0-1.365.611-1.365 1.365 0 .754.611 1.365 1.365 1.365.754 0 1.365-.611 1.365-1.365 0-.754-.611-1.365-1.365-1.365zm5.312 0c-.754 0-1.365.611-1.365 1.365 0 .754.611 1.365 1.365 1.365.754 0 1.365-.611 1.365-1.365 0-.754-.611-1.365-1.365-1.365zm-5.466 3.99a.327.327 0 0 0-.231.096.326.326 0 0 0 0 .462c1.09 1.09 3.037 1.09 4.127 0a.327.327 0 0 0 0-.462.327.327 0 0 0-.462 0c-.836.836-2.367.836-3.203 0a.327.327 0 0 0-.231-.096z" />
      </svg>
    )
  },
  {
    key: "website",
    label: "Website / Web",
    brandColor: "#00C49F",
    defaultUrl: "https://",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    )
  },
  {
    key: "custom",
    label: "Custom / Այլ",
    brandColor: "#00C49F",
    defaultUrl: "https://",
    icon: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    )
  }
];

export function normalizeSocialLinks(data: any): SocialLinkItem[] {
  if (Array.isArray(data)) {
    return data
      .filter((it) => it && typeof it === "object")
      .map((item, idx) => ({
        id: item.id || `soc-${idx}-${Date.now()}`,
        platform: item.platform || item.key || "custom",
        label: item.label || item.name || "Social Link",
        url: item.url || "",
        brandColor: item.brandColor || "#00C49F",
        customSvg: item.customSvg || "",
        enabled: item.enabled !== false
      }));
  }

  if (data && typeof data === "object") {
    const items: SocialLinkItem[] = [];
    const legacyKeys = ["linkedin", "instagram", "gitlab", "behance", "github"];
    legacyKeys.forEach((k) => {
      const preset = PRESET_PLATFORMS.find((p) => p.key === k);
      items.push({
        id: `soc-${k}`,
        platform: k,
        label: preset?.label || k,
        url: typeof data[k] === "string" ? data[k] : preset?.defaultUrl || "",
        brandColor: preset?.brandColor || "#00C49F",
        enabled: true
      });
    });

    Object.entries(data).forEach(([key, val]) => {
      if (!legacyKeys.includes(key) && typeof val === "string") {
        const preset = PRESET_PLATFORMS.find((p) => p.key === key);
        items.push({
          id: `soc-${key}`,
          platform: preset ? key : "custom",
          label: preset?.label || key,
          url: val,
          brandColor: preset?.brandColor || "#00C49F",
          enabled: true
        });
      }
    });

    return items;
  }

  // Default initial 5 links
  return [
    { id: "soc-linkedin", platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com", brandColor: "#0A66C2", enabled: true },
    { id: "soc-instagram", platform: "instagram", label: "Instagram", url: "https://instagram.com", brandColor: "#E4405F", enabled: true },
    { id: "soc-gitlab", platform: "gitlab", label: "GitLab", url: "https://gitlab.com", brandColor: "#FC6D26", enabled: true },
    { id: "soc-behance", platform: "behance", label: "Behance", url: "https://behance.net", brandColor: "#0057FF", enabled: true },
    { id: "soc-github", platform: "github", label: "GitHub", url: "https://github.com", brandColor: "#ffffff", enabled: true }
  ];
}

export function renderPlatformIcon(item: SocialLinkItem): React.ReactNode {
  if (item.customSvg && item.customSvg.trim().startsWith("<svg")) {
    return (
      <div
        style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        dangerouslySetInnerHTML={{ __html: item.customSvg }}
      />
    );
  }

  const pKey = (item.platform || "").toLowerCase();
  const preset =
    PRESET_PLATFORMS.find((p) => p.key === pKey) ||
    PRESET_PLATFORMS.find((p) => (item.label || "").toLowerCase().includes(p.key)) ||
    PRESET_PLATFORMS.find((p) => (item.url || "").toLowerCase().includes(p.key)) ||
    PRESET_PLATFORMS.find((p) => p.key === "custom") ||
    PRESET_PLATFORMS[0];

  return preset.icon;
}

interface SocialLinksProps {
  links?: SocialLinksData;
  variant?: "footer" | "contact" | "default";
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function SocialLinks({
  links,
  variant = "default",
  size = 42,
  className = "",
  style = {}
}: SocialLinksProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const items = normalizeSocialLinks(links).filter((item) => item.enabled !== false && item.url && item.url !== "#");

  if (items.length === 0) {
    return null;
  }

  const isFooter = variant === "footer";
  const isContact = variant === "contact";

  return (
    <div
      className={`social-links-container ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: isFooter ? "12px" : "12px",
        flexWrap: "wrap",
        ...style
      }}
    >
      {items.map((item) => {
        const isHovered = hoveredId === item.id;
        const targetUrl = item.url;

        let defaultBg = "rgba(255, 255, 255, 0.08)";
        let defaultColor = "rgba(255, 255, 255, 0.75)";

        if (isContact) {
          defaultBg = "var(--btn-bg)";
          defaultColor = "var(--text)";
        } else if (isFooter) {
          defaultBg = "rgba(255, 255, 255, 0.1)";
          defaultColor = "#ffffff";
        }

        const activeColor =
          isContact && item.platform === "github"
            ? "#181717"
            : item.brandColor || "#00C49F";

        const activeBg =
          isContact && item.platform === "github"
            ? "rgba(24, 23, 23, 0.1)"
            : item.brandColor
            ? `${item.brandColor}22`
            : "rgba(0, 196, 159, 0.15)";

        return (
          <a
            key={item.id}
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={item.label}
            aria-label={item.label}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              border: "none",
              boxShadow: "none",
              transform: "none",
              background: isHovered ? activeBg : defaultBg,
              color: isHovered ? activeColor : defaultColor,
              transition: "color 0.22s ease, background 0.22s ease",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: `${Math.round(size * 0.52)}px`,
                height: `${Math.round(size * 0.52)}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {renderPlatformIcon(item)}
            </div>
          </a>
        );
      })}
    </div>
  );
}
