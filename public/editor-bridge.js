/**
 * HDesign Live Site Editor SDK (editor-bridge.js)
 * Written from scratch - Clean, non-intrusive, zero global CSS overrides.
 */
(function() {
  'use strict';

  if (window.__HD_EDITOR_BRIDGE_ACTIVE__) return;
  window.__HD_EDITOR_BRIDGE_ACTIVE__ = true;

  // 1. Scoped, non-destructive editing styles (ZERO overrides to site layout, fonts, or margins)
  const style = document.createElement('style');
  style.id = 'hd-editor-bridge-clean-styles';
  style.textContent = `
    .hd-builder-editable-block,
    [data-block-id] {
      cursor: pointer !important;
      position: relative;
      transition: outline 0.12s ease !important;
    }

    .hd-builder-editable-block:hover,
    [data-block-id]:hover {
      outline: 2px dashed #14b8a6 !important;
      outline-offset: -2px !important;
    }

    .hd-builder-editable-block.is-selected,
    [data-block-id].is-selected {
      outline: 2px solid #14b8a6 !important;
      outline-offset: -2px !important;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.25) !important;
    }

    .hd-builder-block-tag {
      position: absolute !important;
      top: 8px !important;
      left: 12px !important;
      background: #083f39 !important;
      color: #ffffff !important;
      font-size: 11px !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-weight: 700 !important;
      letter-spacing: 0.5px !important;
      padding: 3px 8px !important;
      border-radius: 4px !important;
      border: 1px solid #14b8a6 !important;
      pointer-events: none !important;
      z-index: 999999 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      text-transform: uppercase !important;
      line-height: 1.2 !important;
    }

    [contenteditable="true"]:focus {
      outline: 2px solid #0284c7 !important;
      outline-offset: 2px !important;
      background: rgba(2, 132, 199, 0.04) !important;
      border-radius: 3px !important;
    }

    hd-reveal, .hd-reveal {
      opacity: 1 !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);

  let selectedEl = null;
  let textDebounce = null;

  // 2. Locate editable block info
  function getBlock(el) {
    if (!el || el === document.body || el === document.documentElement) return null;
    const blockEl = el.closest('.hd-builder-editable-block, [data-block-id], [data-block-type], header, footer, section, [id]');
    if (!blockEl) return null;

    let blockId = blockEl.getAttribute('data-block-id') || blockEl.id;
    let blockType = blockEl.getAttribute('data-block-type');

    if (!blockId) {
      const tag = blockEl.tagName.toLowerCase();
      if (tag === 'header' || blockEl.classList.contains('site-header')) {
        blockId = 'header';
        blockType = 'header';
      } else if (tag === 'footer' || blockEl.classList.contains('footer-section-fullwidth')) {
        blockId = 'footer';
        blockType = 'footer';
      } else {
        blockId = blockEl.id || `block-${tag}`;
        blockType = tag;
      }
    }

    if (!blockType) {
      blockType = blockId.replace(/^block-/, '').split('-')[0] || 'block';
    }

    // Normalize IDs to match page-data.json
    if (blockId === 'home') { blockId = 'block-hero'; blockType = 'hero'; }
    else if (blockId === 'promo-video') { blockId = 'block-video'; blockType = 'video'; }
    else if (blockId === 'about') { blockId = 'block-about'; blockType = 'about'; }
    else if (blockId === 'works') { blockId = 'block-works'; blockType = 'works'; }
    else if (blockId === 'playground') { blockId = 'block-playground'; blockType = 'playground'; }
    else if (blockId === 'icons') { blockId = 'block-icons'; blockType = 'icons'; }
    else if (blockId === 'glyphs') { blockId = 'block-glyphs'; blockType = 'glyphs'; }
    else if (blockId === 'branding') { blockId = 'block-branding'; blockType = 'branding'; }

    return { blockEl, blockId, blockType };
  }

  // 3. Highlight and badge selected block
  function highlightBlock(el, blockId, blockType) {
    document.querySelectorAll('.is-selected').forEach(node => {
      node.classList.remove('is-selected');
      const tag = node.querySelector(':scope > .hd-builder-block-tag');
      if (tag) tag.remove();
    });

    if (!el) {
      selectedEl = null;
      return;
    }

    selectedEl = el;
    el.classList.add('is-selected');

    const badge = document.createElement('div');
    badge.className = 'hd-builder-block-tag';
    badge.innerHTML = `<span>✏️</span><span>${(blockType || blockId || 'BLOCK').toUpperCase()}</span>`;
    el.appendChild(badge);
  }

  // 4. Attach contenteditable to text elements without altering layouts
  function initEditableText() {
    const selector = 'h1, h2, h3, h4, h5, h6, p, blockquote, [data-editable-text]';
    document.querySelectorAll(selector).forEach(node => {
      if (node.closest('a') || node.closest('button')) return;
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');

      node.addEventListener('input', function() {
        if (textDebounce) clearTimeout(textDebounce);
        textDebounce = setTimeout(() => {
          const info = getBlock(node);
          if (info && window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'INLINE_TEXT_UPDATED',
              blockId: info.blockId,
              blockType: info.blockType,
              tagName: node.tagName.toLowerCase(),
              textContent: node.innerText
            }, '*');
          }
        }, 150);
      });
    });
  }

  // 5. Global Click Handler: Block Selection + Live Natural Navigation
  document.addEventListener('click', function(e) {
    const target = e.target;

    // Check for links (Live Navigation)
    const anchor = target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'NAVIGATE_PAGE',
            url: href
          }, '*');
        }
        // Allow native link navigation inside iframe
        return;
      }
    }

    // Block selection
    const info = getBlock(target);
    if (info) {
      highlightBlock(info.blockEl, info.blockId, info.blockType);

      const rect = info.blockEl.getBoundingClientRect();
      const bounds = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      };

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'BLOCK_CLICKED',
          blockId: info.blockId,
          blockType: info.blockType,
          domId: info.blockEl.id || '',
          tagName: target.tagName.toLowerCase(),
          textContent: target.innerText ? target.innerText.substring(0, 100) : '',
          bounds: bounds
        }, '*');
      }
    }
  }, true);

  // Sync bounds on scroll or window resize
  function syncActiveBounds() {
    if (!selectedEl || !window.parent || window.parent === window) return;
    const rect = selectedEl.getBoundingClientRect();
    const info = getBlock(selectedEl);
    if (info) {
      window.parent.postMessage({
        type: 'BLOCK_BOUNDS_CHANGED',
        blockId: info.blockId,
        bounds: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        }
      }, '*');
    }
  }

  window.addEventListener('scroll', syncActiveBounds, { passive: true });
  window.addEventListener('resize', syncActiveBounds, { passive: true });

  // 6. Listen for Messages from Parent Builder
  window.addEventListener('message', function(e) {
    if (!e.data || typeof e.data !== 'object') return;
    const msg = e.data;

    // Select block
    if (msg.type === 'SELECT_BLOCK') {
      if (!msg.blockId) {
        highlightBlock(null);
        return;
      }
      let el = document.querySelector(`[data-block-id="${msg.blockId}"]`);
      if (!el && msg.blockId === 'header') el = document.querySelector('header, .site-header');
      if (!el && msg.blockId === 'footer') el = document.querySelector('footer, #contact');
      if (!el) el = document.getElementById(msg.blockId);

      if (el) {
        highlightBlock(el, msg.blockId, msg.blockType);
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // Direct in-place DOM mutation without reload
    if (msg.type === 'UPDATE_BLOCK_FIELD') {
      const { blockId, key, value } = msg;
      if (!blockId || !key) return;

      let el = document.querySelector(`[data-block-id="${blockId}"]`);
      if (!el && blockId === 'block-hero') el = document.querySelector('#home, .theme-hero-section, [data-block-id="block-hero"]');
      if (!el && blockId === 'block-video') el = document.querySelector('#promo-video, [data-block-id="block-video"]');
      if (!el && blockId === 'block-about') el = document.querySelector('#about, [data-block-id="block-about"]');
      if (!el && blockId === 'block-works') el = document.querySelector('#works, [data-block-id="block-works"]');
      if (!el && blockId === 'block-playground') el = document.querySelector('#playground, [data-block-id="block-playground"]');
      if (!el && blockId === 'block-icons') el = document.querySelector('#icons, [data-block-id="block-icons"]');
      if (!el && blockId === 'block-glyphs') el = document.querySelector('#glyphs, [data-block-id="block-glyphs"]');
      if (!el && blockId === 'header') el = document.querySelector('header, .site-header');
      if (!el && blockId === 'footer') el = document.querySelector('footer, #contact');
      if (!el) el = document.getElementById(blockId);

      if (el) {
        const specificEl = el.querySelector(`[data-editable-key="${key}"]`);
        if (specificEl) {
          specificEl.innerText = value;
        }

        if (key === 'bg_color' || key === 'background') {
          el.style.backgroundColor = value;
        } else if (key === 'title' || key === 'line1') {
          const t = el.querySelector('[data-editable-key="title"], h1, h2, .section-title, .wave-title');
          if (t) t.innerText = value;
        } else if (key === 'subtitle' || key === 'line2') {
          const s = el.querySelector('[data-editable-key="subtitle"], h3, .section-subtitle, p');
          if (s) s.innerText = value;
        } else if (key === 'quote') {
          const q = el.querySelector('blockquote, .theme-hero-quote');
          if (q) q.innerText = value;
        } else if (key === 'content' || key === 'bio') {
          const c = el.querySelector('[data-editable-key="content"], [data-editable-key="bio"], p, .text-content');
          if (c) c.innerText = value;
        } else if (key === 'author_name') {
          const a = el.querySelector('.theme-about-name, h2');
          if (a) a.innerText = value;
        } else if (key === 'btn_text') {
          const b = el.querySelector('a, button, hd-button');
          if (b) b.innerText = value;
        } else if (key === 'image_url' || key === 'signature_url' || key === 'logo_url') {
          const img = el.querySelector('img');
          if (img) img.src = value;
        }
      }
    }

    // 0ms Real-time Layout & Spacing Style Injection
    if (msg.type === 'UPDATE_BLOCK_STYLES') {
      const { blockId, styles } = msg;
      if (!blockId || !styles) return;

      let el = document.querySelector(`[data-block-id="${blockId}"]`);
      if (!el && blockId === 'header') el = document.querySelector('header, .site-header');
      if (!el && blockId === 'footer') el = document.querySelector('footer, #contact');
      if (!el) el = document.getElementById(blockId);

      if (el) {
        // Spacing: Padding
        if (styles.padding) {
          const u = styles.padding.unit || 'px';
          if (styles.padding.top !== undefined) el.style.paddingTop = `${styles.padding.top}${u}`;
          if (styles.padding.right !== undefined) el.style.paddingRight = `${styles.padding.right}${u}`;
          if (styles.padding.bottom !== undefined) el.style.paddingBottom = `${styles.padding.bottom}${u}`;
          if (styles.padding.left !== undefined) el.style.paddingLeft = `${styles.padding.left}${u}`;
          el.style.setProperty('--block-pt', `${styles.padding.top}${u}`);
          el.style.setProperty('--block-pr', `${styles.padding.right}${u}`);
          el.style.setProperty('--block-pb', `${styles.padding.bottom}${u}`);
          el.style.setProperty('--block-pl', `${styles.padding.left}${u}`);
        }

        // Spacing: Margin
        if (styles.margin) {
          const u = styles.margin.unit || 'px';
          if (styles.margin.top !== undefined) el.style.marginTop = styles.margin.top === 'auto' ? 'auto' : `${styles.margin.top}${u}`;
          if (styles.margin.right !== undefined) el.style.marginRight = styles.margin.right === 'auto' ? 'auto' : `${styles.margin.right}${u}`;
          if (styles.margin.bottom !== undefined) el.style.marginBottom = styles.margin.bottom === 'auto' ? 'auto' : `${styles.margin.bottom}${u}`;
          if (styles.margin.left !== undefined) el.style.marginLeft = styles.margin.left === 'auto' ? 'auto' : `${styles.margin.left}${u}`;
        }

        // Gap
        if (styles.gap !== undefined) {
          const gVal = typeof styles.gap === 'object' ? styles.gap.value : styles.gap;
          const gUnit = (typeof styles.gap === 'object' && styles.gap.unit) || 'px';
          el.style.gap = `${gVal}${gUnit}`;
          el.style.setProperty('--block-gap', `${gVal}${gUnit}`);
        }

        // Dimensions
        if (styles.width) {
          if (styles.width.type === 'auto') {
            el.style.width = 'auto';
          } else if (styles.width.type === 'full') {
            el.style.width = '100%';
          } else if (styles.width.type === 'custom') {
            el.style.width = `${styles.width.value}${styles.width.unit || 'px'}`;
          }
        }
        if (styles.maxWidth !== undefined) el.style.maxWidth = styles.maxWidth;
        if (styles.minWidth !== undefined) el.style.minWidth = styles.minWidth;

        // Layout / Flexbox & Grid
        if (styles.display) el.style.display = styles.display;
        if (styles.flexDirection) el.style.flexDirection = styles.flexDirection;
        if (styles.justifyContent) el.style.justifyContent = styles.justifyContent;
        if (styles.alignItems) el.style.alignItems = styles.alignItems;
        if (styles.flexWrap) el.style.flexWrap = styles.flexWrap;
        if (styles.gridTemplateColumns) el.style.gridTemplateColumns = styles.gridTemplateColumns;

        // Visuals
        if (styles.backgroundColor) el.style.backgroundColor = styles.backgroundColor;
        if (styles.borderRadius !== undefined) el.style.borderRadius = `${styles.borderRadius}px`;

        // Report updated bounds immediately to parent for visual selection box sync
        const rect = el.getBoundingClientRect();
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'BLOCK_BOUNDS_CHANGED',
            blockId,
            bounds: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              bottom: rect.bottom,
              right: rect.right
            }
          }, '*');
        }

        // Preserve and refresh GSAP ScrollTrigger & animations
        if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
          window.ScrollTrigger.refresh();
        }
      }
    }

    // Animations reinit
    if (msg.type === 'REINIT_ANIMATIONS') {
      if (typeof window.initSiteAnimations === 'function') {
        window.initSiteAnimations();
      }
      if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
        window.ScrollTrigger.refresh();
      }
    }

    // Page reload
    if (msg.type === 'RELOAD_PAGE') {
      window.location.reload();
    }
  });

  // Detect route and master template mapping
  function detectMasterTemplate() {
    const path = window.location.pathname;
    let masterTemplate = null;
    let instanceId = null;

    if (path.startsWith('/works/') && path !== '/works') {
      masterTemplate = 'templates/work';
      instanceId = path.replace(/^\/works\//, '');
    } else if (path.startsWith('/blog/') && path !== '/blog') {
      masterTemplate = 'templates/blog';
      instanceId = path.replace(/^\/blog\//, '');
    } else if (path.startsWith('/products/') && path !== '/products') {
      masterTemplate = 'templates/product';
      instanceId = path.replace(/^\/products\//, '');
    }

    if (masterTemplate && window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'DYNAMIC_ROUTE_DETECTED',
        masterTemplate,
        instanceId,
        url: path
      }, '*');
    }
  }

  // 7. Initialize
  function ready() {
    initEditableText();
    detectMasterTemplate();
    if (typeof window.initSiteAnimations === 'function') {
      window.initSiteAnimations();
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'EDITOR_BRIDGE_READY',
        pathname: window.location.pathname,
        title: document.title
      }, '*');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

})();
