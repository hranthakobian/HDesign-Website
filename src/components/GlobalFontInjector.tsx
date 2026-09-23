"use client";

import { useEffect, useState } from 'react';

export default function GlobalFontInjector({ initialFontUrl, initialFontName }: { initialFontUrl?: string; initialFontName?: string }) {
  const [fontUrl, setFontUrl] = useState<string>(initialFontUrl || 'https://api.hakobian.am/libs/v1/fonts/hdesign.ttf');
  const [fontName, setFontName] = useState<string>(initialFontName || 'HDesign');
  const [fontWeights, setFontWeights] = useState<Record<number, string>>({});
  const [iconFontCssUrl, setIconFontCssUrl] = useState<string>('https://api.hakobian.am/libs/v1/icons/style.css');
  const [iconFontWeights, setIconFontWeights] = useState<Record<number, string>>({});
  const [customIconCss, setCustomIconCss] = useState<string>('');
  const [hdIconRules, setHdIconRules] = useState<Array<{ id: string; content: string; font_family?: string }>>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/general-settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.site_font_url) setFontUrl(data.site_font_url);
          if (data.site_font_name) setFontName(data.site_font_name);
          if (data.site_font_weights) setFontWeights(data.site_font_weights);
        }
      } catch (err) {
        console.error('Failed to fetch general font settings:', err);
      }

      try {
        const iconsRes = await fetch('/api/icons-settings', { cache: 'no-store' });
        if (iconsRes.ok) {
          const iconsData = await iconsRes.json();
          if (iconsData.icon_font_css_url) setIconFontCssUrl(iconsData.icon_font_css_url);
          if (iconsData.icon_font_weights) setIconFontWeights(iconsData.icon_font_weights);
          if (iconsData.custom_icon_css) setCustomIconCss(iconsData.custom_icon_css);
          if (Array.isArray(iconsData.hd_icon_rules)) setHdIconRules(iconsData.hd_icon_rules);
        }
      } catch (iconsErr) {
        console.error('Failed to fetch icon settings:', iconsErr);
      }
    };

    fetchSettings();

    const handleFontUpdate = (e: any) => {
      if (e.detail?.fontUrl) setFontUrl(e.detail.fontUrl);
      if (e.detail?.fontName) setFontName(e.detail.fontName);
      if (e.detail?.fontWeights) setFontWeights(e.detail.fontWeights);
      if (e.detail?.iconFontCssUrl) setIconFontCssUrl(e.detail.iconFontCssUrl);
      if (e.detail?.iconFontWeights) setIconFontWeights(e.detail.iconFontWeights);
      if (e.detail?.customIconCss !== undefined) setCustomIconCss(e.detail.customIconCss);
      if (e.detail?.hdIconRules) setHdIconRules(e.detail.hdIconRules);
    };

    window.addEventListener('site-font-updated', handleFontUpdate);
    return () => window.removeEventListener('site-font-updated', handleFontUpdate);
  }, []);

  const weightsList = [100, 200, 300, 400, 500, 600, 700, 800, 900];

  const customWeightsFontFaceCss = weightsList
    .map((w) => {
      const url = fontWeights[w];
      if (!url) return '';
      return `
        @font-face {
          font-family: 'HDesign';
          src: url('${url}') format('truetype'), url('${url}');
          font-weight: ${w};
          font-style: normal;
          font-display: swap;
          unicode-range: U+0000-001F, U+0021-009F, U+00A1-DFFF, U+EA00-10FFFF;
        }
      `;
    })
    .join('\n');

  const customIconWeightsFontFaceCss = weightsList
    .map((w) => {
      const url = iconFontWeights[w];
      if (!url) return '';
      return `
        @font-face {
          font-family: 'HDIcons';
          src: url('${url}') format('truetype'), url('${url}');
          font-weight: ${w};
          font-style: normal;
          font-display: swap;
        }
      `;
    })
    .join('\n');

  const generatedHdIconRulesCss = hdIconRules
    .map((rule) => {
      const className = rule.id.startsWith('.') ? rule.id.substring(1) : (rule.id.startsWith('hd-icon-') || rule.id.startsWith('icon-') ? rule.id : `hd-icon-${rule.id}`);
      const fontFamily = rule.font_family || 'HDIcons';
      const content = rule.content.replace(/^\\/, '\\');
      return `
        .${className}:before {
          font-family: '${fontFamily}' !important;
          content: "${content}";
          speak: never;
          font-style: normal;
          font-weight: normal;
          font-variant: normal;
          text-transform: none;
          line-height: 1;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `;
    })
    .join('\n');

  const sanitizedCustomIconCss = (customIconCss || '')
    .replace(/url\((['"]?)varFonts\//g, "url($1https://api.hakobian.am/libs/v1/icons/varFonts/")
    .replace(/font-family:\s*['"]HDesign['"]/g, "font-family: 'HDIcons'");

  return (
    <>
      <link rel="stylesheet" href={iconFontCssUrl || "https://api.hakobian.am/libs/v1/icons/style.css"} />
      <style dangerouslySetInnerHTML={{
        __html: `
          @font-face {
            font-family: 'HDesign';
            src: url('${fontUrl}') format('truetype'), url('${fontUrl}');
            font-weight: 100 900;
            font-style: normal;
            font-display: swap;
            unicode-range: U+0000-001F, U+0021-009F, U+00A1-DFFF, U+EA00-10FFFF;
          }

          ${customWeightsFontFaceCss}
          ${customIconWeightsFontFaceCss}
          ${generatedHdIconRulesCss}
          ${sanitizedCustomIconCss}
        `
      }} />
    </>
  );
}
