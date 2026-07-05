/**
 * Helper to convert a Hex color string to HSL values
 * @param {string} hex 
 */
function hexToHsl(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Helper to get a high contrast text color (either white or a dark color)
 * based on the lightness of the background color.
 * @param {string} colorStr 
 */
function getContrastColor(colorStr) {
  if (!colorStr) return '#ffffff';
  colorStr = colorStr.trim().toLowerCase();
  
  let r = 0, g = 0, b = 0, hasRgb = false;
  
  if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
      hasRgb = true;
    }
  } else if (colorStr.startsWith('#')) {
    let hex = colorStr.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      hasRgb = true;
    }
  } else if (colorStr.startsWith('hsl')) {
    const match = colorStr.match(/hsla?\(\s*(\d+)(?:deg)?\s*,\s*(\d+)%\s*,\s*(\d+)%/);
    if (match) {
      const l = parseInt(match[3]);
      return l > 60 ? 'var(--text-color, #254d4e)' : '#ffffff';
    }
  }
  
  if (hasRgb) {
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2 * 100;
    return l > 60 ? 'var(--text-color, #254d4e)' : '#ffffff';
  }
  
  const lightColors = ['white', 'yellow', 'lightgray', 'lightblue', 'cyan', 'lime', '#fff', '#ffff00', '#00ffff', '#d3d3d3'];
  if (lightColors.includes(colorStr)) {
    return 'var(--text-color, #254d4e)';
  }
  
  return '#ffffff';
}

/**
 * Extracts the hue and applies monochromatic theme colors to the wrapper
 * @param {HTMLElement} wrapper 
 * @param {string} colorStr 
 */
function applyColorToWrapper(wrapper, colorStr) {
  if (!colorStr) return;
  const setVar = (name, val) => wrapper.style.setProperty(name, val);

  // Pure hue number check
  if (!isNaN(colorStr)) {
    setVar('--hue', colorStr);
    setVar('--primary-color', `hsl(${colorStr}, var(--primary-sat, 36%), var(--primary-lit, 23%))`);
    setVar('--text-color', `hsl(${colorStr}, var(--text-sat, 11%), var(--text-lit, 44%))`);
    setVar('--inactive-color', `hsl(${colorStr}, var(--inactive-sat, 9%), var(--inactive-lit, 53%))`);
    setVar('--check-color', `hsl(${colorStr}, var(--text-sat, 11%), var(--text-lit, 44%))`);
    return;
  }

  // Hex format check
  if (colorStr.startsWith('#') || /^[0-9a-fA-F]{3,6}$/.test(colorStr)) {
    try {
      const hsl = hexToHsl(colorStr);
      setVar('--hue', hsl.h);
      setVar('--primary-color', colorStr);
      setVar('--text-color', `hsl(${hsl.h}, var(--text-sat, 11%), var(--text-lit, 44%))`);
      setVar('--inactive-color', `hsl(${hsl.h}, var(--inactive-sat, 9%), var(--inactive-lit, 53%))`);
      setVar('--check-color', `hsl(${hsl.h}, var(--text-sat, 11%), var(--text-lit, 44%))`);
    } catch (e) {
      console.error("Hex parsing error", e);
    }
  } else if (colorStr.startsWith('hsl')) {
    // Extract hue from hsl(H, S%, L%) or hsla
    const match = colorStr.match(/hsla?\(\s*(\d+)/);
    if (match) {
      const h = match[1];
      setVar('--hue', h);
      setVar('--primary-color', colorStr);
      setVar('--text-color', `hsl(${h}, var(--text-sat, 11%), var(--text-lit, 44%))`);
      setVar('--inactive-color', `hsl(${h}, var(--inactive-sat, 9%), var(--inactive-lit, 53%))`);
      setVar('--check-color', `hsl(${h}, var(--text-sat, 11%), var(--text-lit, 44%))`);
    }
  } else {
    // Named color or raw CSS fallback
    setVar('--primary-color', colorStr);
  }
}

/**
 * Helper to parse HTML data attributes and map them to CSS Custom Variables
 * @param {HTMLElement} wrapper 
 */
function applyAttributes(wrapper) {
  const style = wrapper.style;
  const setVar = (name, val) => {
    if (val) style.setProperty(name, val);
  };

  // Կարդում ենք HTML ատրիբուտները և փոխանցում CSS փոփոխականներին
  const color = wrapper.getAttribute('data-color') || wrapper.getAttribute('data-primary-color');
  applyColorToWrapper(wrapper, color);

  const textColor = wrapper.getAttribute('data-text-color');
  setVar('--text-color', textColor);

  // Compute dynamic contrast color for primary color background
  let primaryColor = getComputedStyle(wrapper).getPropertyValue('--primary-color') || wrapper.style.getPropertyValue('--primary-color');
  const contrast = getContrastColor(primaryColor);
  setVar('--primary-contrast-color', textColor || contrast);

  const fontSize = wrapper.getAttribute('data-font-size');
  setVar('--font-size', fontSize);
  setVar('--font-size-cursor', fontSize);

  const fontWeight = wrapper.getAttribute('data-font-weight');
  setVar('--font-weight', fontWeight);

  const letterSpacing = wrapper.getAttribute('data-letter-spacing');
  setVar('--letter-spacing', letterSpacing);

  const lineHeight = wrapper.getAttribute('data-line-height');
  setVar('--line-height', lineHeight);

  const radius = wrapper.getAttribute('data-radius') || wrapper.getAttribute('data-border-radius');
  setVar('--border-radius', radius);

  const thickness = wrapper.getAttribute('data-thickness') || wrapper.getAttribute('data-line-thickness');
  if (thickness) {
    setVar('--line-thickness', thickness);
  }

  const padding = wrapper.getAttribute('data-padding') || wrapper.getAttribute('data-wrapper-padding');
  setVar('--wrapper-padding', padding);

  const width = wrapper.getAttribute('data-width') || wrapper.getAttribute('data-wrapper-width');
  setVar('--wrapper-width', width);

  const height = wrapper.getAttribute('data-height') || wrapper.getAttribute('data-wrapper-height');
  setVar('--wrapper-height', height);

  const topGap = wrapper.getAttribute('data-top-gap') || wrapper.getAttribute('data-border-top-right-gap');
  setVar('--border-top-right-gap', topGap);

  const bottomGap = wrapper.getAttribute('data-bottom-gap') || wrapper.getAttribute('data-border-left-bottom-gap');
  setVar('--border-left-bottom-gap', bottomGap);

  const leftCursor = wrapper.getAttribute('data-left-cursor') || wrapper.getAttribute('data-left-cursor-left');
  setVar('--left-cursor-left', leftCursor);

  const rightCursor = wrapper.getAttribute('data-right-cursor') || wrapper.getAttribute('data-right-cursor-right');
  setVar('--right-cursor-right', rightCursor);

  const leftHeight = wrapper.getAttribute('data-left-height') || wrapper.getAttribute('data-left-cursor-height-unfocused');
  setVar('--left-cursor-height-unfocused', leftHeight);

  const rightHeight = wrapper.getAttribute('data-right-height') || wrapper.getAttribute('data-right-cursor-height-unfocused');
  setVar('--right-cursor-height-unfocused', rightHeight);
}

/**
 * Dynamic Attribute Observer to prevent React from overwriting custom variables set on wrapper.style
 */
function initAttributeObserver(element, applyFn) {
  if (typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver((mutations) => {
    observer.disconnect();
    applyFn(element);
    observer.observe(element, { attributes: true, attributeFilter: ['style', 'data-width', 'data-height', 'data-color', 'data-thickness', 'data-radius', 'data-padding', 'data-font-size', 'data-font-weight', 'data-letter-spacing', 'data-line-height'] });
  });
  observer.observe(element, { attributes: true, attributeFilter: ['style', 'data-width', 'data-height', 'data-color', 'data-thickness', 'data-radius', 'data-padding', 'data-font-size', 'data-font-weight', 'data-letter-spacing', 'data-line-height'] });
}

/**
 * Initializes custom style caret tracking for standard inputs.
 * @param {HTMLElement} wrapper 
 */
function initCustomInput(wrapper) {
  const input = wrapper.querySelector('input');
  const measurer = wrapper.querySelector('.text-measurer');
  const cursor = wrapper.querySelector('.fake-cursor');
  let isPointerDown = false;

  function update() {
    const isFocused = (document.activeElement === input) && document.hasFocus();

    if (!isFocused) {
      cursor.style.left = '';
      cursor.style.visibility = '';
      return;
    }

    const isRange = input.selectionStart !== input.selectionEnd;
    if (isRange) {
      cursor.style.visibility = 'hidden';
      return;
    } else {
      cursor.style.visibility = '';
    }

    if (isPointerDown) {
      return;
    }

    const style = getComputedStyle(wrapper);
    const wrapperPadding = parseFloat(style.getPropertyValue('--wrapper-padding')) || 30;

    const caretPos = (input.selectionDirection === 'backward') ? input.selectionStart : input.selectionEnd;
    let textBeforeCaret = input.value.substring(0, caretPos);
    
    // If it's a password input, measure mask characters (bullets) instead of actual characters
    // since the input masks them, and they have different widths.
    if (input.type === 'password') {
      textBeforeCaret = '•'.repeat(textBeforeCaret.length);
    }
    
    measurer.textContent = textBeforeCaret;
    
    const maxAllowedWidth = wrapper.clientWidth - (wrapperPadding * 2);
    let totalTextWidth = measurer.offsetWidth;
    
    if (totalTextWidth > maxAllowedWidth) {
      totalTextWidth = maxAllowedWidth;
    }

    cursor.style.left = `${wrapperPadding + totalTextWidth}px`;
  }

  let typingTimeout;
  const handleTyping = () => {
    wrapper.classList.add('is-typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      wrapper.classList.remove('is-typing');
    }, 150);
  };

  input.addEventListener('input', () => {
    handleTyping();
    update();
  });
  input.addEventListener('keydown', handleTyping);
  input.addEventListener('focus', update);
  input.addEventListener('blur', update);
  input.addEventListener('keyup', update);
  input.addEventListener('click', update);
  input.addEventListener('select', update);

  input.addEventListener('pointerdown', () => {
    isPointerDown = true;
  });

  window.addEventListener('pointerup', () => {
    if (isPointerDown) {
      isPointerDown = false;
      update();
    }
  });

  window.addEventListener('pointercancel', () => {
    if (isPointerDown) {
      isPointerDown = false;
      update();
    }
  });

  wrapper.addEventListener('click', (e) => {
    if (e.target !== input && document.activeElement !== input) {
      input.focus();
    }
  });

  document.addEventListener('selectionchange', () => {
    if (document.activeElement === input) {
      update();
    }
  });

  window.addEventListener('focus', update);
  window.addEventListener('blur', update);
  window.addEventListener('load', update);
  update();
}

/**
 * Initializes custom style caret tracking and resize functionality for textareas.
 * @param {HTMLElement} wrapper 
 */
function initCustomTextarea(wrapper) {
  const textarea = wrapper.querySelector('textarea');
  const mirror = wrapper.querySelector('.textarea-mirror');
  const cursor = wrapper.querySelector('.fake-cursor');
  const resizeHandle = wrapper.querySelector('.fake-vertical-cur');
  let isPointerDown = false;

  // Toggle horizontal resizing inside textarea
  const toggleResize = wrapper.querySelector('.textarea-toggle');
  if (toggleResize) {
    const updateResizeState = () => {
      const isChecked = ('checked' in toggleResize) ? toggleResize.checked : (toggleResize.querySelector('input') ? toggleResize.querySelector('input').checked : false);
      if (isChecked) {
        wrapper.setAttribute('data-disable-horizontal-resize', 'true');
      } else {
        wrapper.removeAttribute('data-disable-horizontal-resize');
      }
    };
    updateResizeState();
    toggleResize.addEventListener('change', updateResizeState);
  }

  function update() {
    const isFocused = (document.activeElement === textarea) && document.hasFocus();

    if (!isFocused) {
      cursor.style.left = '';
      cursor.style.top = '';
      cursor.style.visibility = '';
      return;
    }

    const isRange = textarea.selectionStart !== textarea.selectionEnd;
    if (isRange) {
      cursor.style.visibility = 'hidden';
      return;
    } else {
      cursor.style.visibility = '';
    }

    if (isPointerDown) {
      return;
    }

    const text = textarea.value;
    const style = getComputedStyle(wrapper);
    const wrapperPadding = parseFloat(style.getPropertyValue('--wrapper-padding')) || 12;

    const caretPos = (textarea.selectionDirection === 'backward') ? textarea.selectionStart : textarea.selectionEnd;

    mirror.style.width = (wrapper.clientWidth - (wrapperPadding * 2)) + 'px';
    mirror.textContent = text.substring(0, caretPos);

    const marker = document.createElement('span');
    marker.textContent = '\u200B';
    mirror.appendChild(marker);

    // Հաշվի ենք առնում տեքստի սքրոլը (scrollTop/scrollLeft)
    const leftPos = wrapperPadding + marker.offsetLeft - textarea.scrollLeft;
    const topPos = wrapperPadding + marker.offsetTop - textarea.scrollTop;

    // Ստուգում ենք՝ արդյո՞ք կուրսորը գտնվում է տեքստային դաշտի տեսանելի տիրույթում
    const textareaHeight = textarea.clientHeight;
    const cursorHeight = parseFloat(getComputedStyle(cursor).height) || 24;

    const isOutOfViewport = 
      marker.offsetTop < textarea.scrollTop || 
      marker.offsetTop + cursorHeight > textarea.scrollTop + textareaHeight;

    if (isOutOfViewport) {
      cursor.style.visibility = 'hidden';
    } else {
      cursor.style.visibility = '';
      cursor.style.left = leftPos + 'px';
      cursor.style.top = topPos + 'px';
    }
  }

  if (resizeHandle) {
    resizeHandle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      
      function onPointerMove(e) {
        const style = getComputedStyle(wrapper);
        const minW = parseFloat(style.getPropertyValue('--resize-min-width')) || 300;
        const maxW = parseFloat(style.getPropertyValue('--resize-max-width')) || 1200;
        const minH = parseFloat(style.getPropertyValue('--resize-min-height')) || 150;
        const maxH = parseFloat(style.getPropertyValue('--resize-max-height')) || 800;

        const rect = wrapper.getBoundingClientRect();
        let newWidth = e.clientX - rect.left;
        let newHeight = e.clientY - rect.top;

        if (newWidth < minW) newWidth = minW;
        if (newWidth > maxW) newWidth = maxW;
        if (newHeight < minH) newHeight = minH;
        if (newHeight > maxH) newHeight = maxH;

        if (wrapper.getAttribute('data-disable-horizontal-resize') !== 'true') {
          wrapper.style.width = newWidth + 'px';
          wrapper.style.setProperty('--wrapper-width', newWidth + 'px');
        }
        wrapper.style.height = newHeight + 'px';
        wrapper.style.setProperty('--wrapper-height', newHeight + 'px');
        update();
      }

      function onPointerUp() {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      }

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  let typingTimeout;
  const handleTyping = () => {
    wrapper.classList.add('is-typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      wrapper.classList.remove('is-typing');
    }, 150);
  };

  textarea.addEventListener('input', () => {
    handleTyping();
    update();
  });
  textarea.addEventListener('keydown', handleTyping);
  textarea.addEventListener('focus', update);
  textarea.addEventListener('blur', update);
  textarea.addEventListener('keyup', update);
  textarea.addEventListener('click', update);
  textarea.addEventListener('scroll', update); // Լսում ենք սքրոլի իրադարձությունը

  textarea.addEventListener('pointerdown', () => {
    isPointerDown = true;
  });

  window.addEventListener('pointerup', () => {
    if (isPointerDown) {
      isPointerDown = false;
      update();
    }
  });

  window.addEventListener('pointercancel', () => {
    if (isPointerDown) {
      isPointerDown = false;
      update();
    }
  });

  wrapper.addEventListener('click', (e) => {
    if (e.target !== textarea && e.target !== resizeHandle && document.activeElement !== textarea) {
      textarea.focus();
    }
  });

  document.addEventListener('selectionchange', () => {
    if (document.activeElement === textarea) {
      update();
    }
  });

  window.addEventListener('focus', update);
  window.addEventListener('blur', update);
  window.addEventListener('load', update);
  update();
}

/**
 * Helper to parse HTML data attributes for sliders
 * @param {HTMLElement} wrapper 
 */
function applySliderAttributes(wrapper) {
  const style = wrapper.style;
  const setVar = (name, val) => {
    if (val) style.setProperty(name, val);
  };

  const color = wrapper.getAttribute('data-color') || wrapper.getAttribute('data-primary-color');
  applyColorToWrapper(wrapper, color);

  const inactiveColor = wrapper.getAttribute('data-inactive-color');
  setVar('--inactive-color', inactiveColor);

  const thickness = wrapper.getAttribute('data-thickness') || wrapper.getAttribute('data-line-thickness');
  setVar('--line-thickness', thickness);

  const thicknessInactive = wrapper.getAttribute('data-thickness-inactive');
  setVar('--line-thickness-inactive', thicknessInactive);

  const width = wrapper.getAttribute('data-width') || wrapper.getAttribute('data-wrapper-width');
  setVar('--wrapper-width', width);

  const height = wrapper.getAttribute('data-height') || wrapper.getAttribute('data-wrapper-height');
  setVar('--wrapper-height', height);

  const handleWidth = wrapper.getAttribute('data-handle-width');
  setVar('--handle-width', handleWidth);

  const handleHeight = wrapper.getAttribute('data-handle-height');
  setVar('--handle-height', handleHeight);

  const handleGap = wrapper.getAttribute('data-handle-gap');
  setVar('--handle-gap', handleGap);

  const handleOffset = wrapper.getAttribute('data-handle-offset');
  setVar('--handle-offset', handleOffset);
}

/**
 * Initializes visual tracking for sliders.
 * @param {HTMLElement} wrapper 
 */
function initCustomSlider(wrapper) {
  const input = wrapper.querySelector('.real-slider');
  let isDragging = false;
  let transitionTimeout = null;

  function update() {
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const val = parseFloat(input.value) || 0;
    
    const percentage = ((val - min) / (max - min)) * 100;
    wrapper.style.setProperty('--slider-percentage', percentage + '%');
  }

  input.addEventListener('input', update);
  input.addEventListener('change', update);

  input.addEventListener('pointerdown', () => {
    clearTimeout(transitionTimeout);
    wrapper.classList.add('smooth-transition');
    isDragging = false;
  });

  input.addEventListener('pointermove', (e) => {
    // If mouse/touch is down and moving, disable transition so it tracks instantly
    if (e.buttons > 0) {
      isDragging = true;
      wrapper.classList.remove('smooth-transition');
    }
  });

  input.addEventListener('pointerup', () => {
    if (!isDragging) {
      // If it's a simple click, allow the 0.4s bouncy transition to complete
      transitionTimeout = setTimeout(() => {
        wrapper.classList.remove('smooth-transition');
      }, 400);
    } else {
      wrapper.classList.remove('smooth-transition');
    }
    isDragging = false;
  });

  input.addEventListener('pointercancel', () => {
    wrapper.classList.remove('smooth-transition');
    isDragging = false;
  });
  
  update();
}

/**
 * Global Automatic Initialization for all Custom Components on page load
 */
function initAllCustomComponents() {
  // 0. Parse HTML tag color attribute
  const htmlColor = document.documentElement.getAttribute('data-color') || document.documentElement.getAttribute('data-primary-color');
  if (htmlColor) {
    applyColorToWrapper(document.documentElement, htmlColor);
  }

  // 1. Inputs & Textareas
  document.querySelectorAll('.custom-input-wrapper').forEach(wrapper => {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = 'true';

    applyAttributes(wrapper);

    if (wrapper.querySelector('textarea')) {
      initCustomTextarea(wrapper);
    } else if (wrapper.querySelector('input')) {
      initCustomInput(wrapper);
    }
  });

  // 2. Sliders
  document.querySelectorAll('.custom-slider-wrapper').forEach(wrapper => {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = 'true';

    applySliderAttributes(wrapper);
    initCustomSlider(wrapper);
  });

  // 3. Buttons (կոճակներ)
  document.querySelectorAll('.custom-button-wrapper').forEach(wrapper => {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = 'true';

    applyAttributes(wrapper);
  });

  // 4. Checkboxes & Radios
  document.querySelectorAll('.custom-checkbox-wrapper, .custom-radio-wrapper').forEach(wrapper => {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = 'true';

    applyCheckboxRadioAttributes(wrapper);
  });

  // 5. Scrollbars
  document.querySelectorAll('.custom-scrollbar-wrapper').forEach(wrapper => {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = 'true';

    applyScrollbarAttributes(wrapper);
  });

  // 6. Switches (թոգգլներ)
  document.querySelectorAll('.custom-switch-wrapper').forEach(wrapper => {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = 'true';

    applySwitchAttributes(wrapper);
  });

  // 6.5. Segments (սեգմենտներ)
  document.querySelectorAll('.custom-segment-wrapper').forEach(wrapper => {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = 'true';

    applySegmentAttributes(wrapper);
  });

  // 7. Global MutationObserver to detect theme changes on html or body
  if (typeof MutationObserver !== 'undefined' && !window._globalThemeObserverInitialized) {
    window._globalThemeObserverInitialized = true;
    const globalObserver = new MutationObserver(() => {
      // Recalculate attributes for all custom elements when global theme changes
      const elements = document.querySelectorAll(
        'hd-input, hd-textarea, hd-button, hd-slider, hd-checkbox, hd-radio, hd-switch, hd-segment, hd-scrollbar, hd-select, hd-color-panel, hd-color-picker, ' +
        '.custom-input-wrapper, .custom-slider-wrapper, .custom-button-wrapper, .custom-checkbox-wrapper, .custom-radio-wrapper, .custom-switch-wrapper, .custom-segment-wrapper, .custom-scrollbar-wrapper, .custom-select-wrapper, .custom-color-panel-wrapper, .custom-color-picker-wrapper'
      );
      elements.forEach(el => {
        if (el.dataset.initialized === 'true') {
          // If the element has a specific applyAttributes, call it
          if (el.tagName.toLowerCase() === 'hd-segment' || el.classList.contains('custom-segment-wrapper')) {
            applySegmentAttributes(el);
          } else if (el.tagName.toLowerCase() === 'hd-switch' || el.classList.contains('custom-switch-wrapper')) {
            applySwitchAttributes(el);
          } else if (el.tagName.toLowerCase() === 'hd-button' || el.classList.contains('custom-button-wrapper') ||
              el.tagName.toLowerCase() === 'hd-input' || el.classList.contains('custom-input-wrapper') ||
              el.tagName.toLowerCase() === 'hd-textarea' || el.classList.contains('custom-input-wrapper') ||
              el.tagName.toLowerCase() === 'hd-select' || el.classList.contains('custom-select-wrapper') ||
              el.tagName.toLowerCase() === 'hd-color-picker' || el.classList.contains('custom-color-picker-wrapper')) {
            applyAttributes(el);
          }
        }
      });
    });
    
    if (document.documentElement) {
      globalObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-color'] });
    }
    if (document.body) {
      globalObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    }
  }
}

/**
 * Helper to parse HTML data attributes for Checkboxes and Radios
 * @param {HTMLElement} wrapper 
 */
function applyCheckboxRadioAttributes(wrapper) {
  const style = wrapper.style;
  const setVar = (name, val) => {
    if (val) style.setProperty(name, val);
  };

  const color = wrapper.getAttribute('data-color') || wrapper.getAttribute('data-primary-color');
  applyColorToWrapper(wrapper, color);

  const checkColor = wrapper.getAttribute('data-check-color');
  setVar('--check-color', checkColor);

  const fontSize = wrapper.getAttribute('data-font-size');
  setVar('--font-size', fontSize);
  setVar('--font-size-cursor', fontSize);

  const size = wrapper.getAttribute('data-size');
  if (size) {
    if (wrapper.classList.contains('custom-checkbox-wrapper')) {
      setVar('--checkbox-size', size);
    } else {
      setVar('--radio-size', size);
    }
  }

  const thickness = wrapper.getAttribute('data-thickness') || wrapper.getAttribute('data-line-thickness');
  setVar('--line-thickness', thickness);
}

/**
 * Helper to parse HTML data attributes for Scrollbars
 * @param {HTMLElement} wrapper 
 */
function applyScrollbarAttributes(wrapper) {
  const style = wrapper.style;
  const setVar = (name, val) => {
    if (val) style.setProperty(name, val);
  };

  const color = wrapper.getAttribute('data-color') || wrapper.getAttribute('data-primary-color');
  applyColorToWrapper(wrapper, color);

  const inactiveColor = wrapper.getAttribute('data-inactive-color');
  setVar('--inactive-color', inactiveColor);

  const thickness = wrapper.getAttribute('data-thickness') || wrapper.getAttribute('data-line-thickness');
  setVar('--line-thickness', thickness);

  const size = wrapper.getAttribute('data-size') || wrapper.getAttribute('data-scrollbar-size');
  setVar('--scrollbar-size', size);

  const radius = wrapper.getAttribute('data-radius') || wrapper.getAttribute('data-border-radius');
  setVar('--border-radius', radius);

  const width = wrapper.getAttribute('data-width') || wrapper.getAttribute('data-wrapper-width');
  setVar('--wrapper-width', width);

  const height = wrapper.getAttribute('data-height') || wrapper.getAttribute('data-wrapper-height');
  setVar('--wrapper-height', height);
}

/**
 * Helper to parse HTML data attributes for Switches/Toggles
 * @param {HTMLElement} wrapper 
 */
function applySwitchAttributes(wrapper) {
  const style = wrapper.style;
  const setVar = (name, val) => {
    if (val) style.setProperty(name, val);
  };

  const color = wrapper.getAttribute('data-color') || wrapper.getAttribute('data-primary-color');
  applyColorToWrapper(wrapper, color);

  const inactiveColor = wrapper.getAttribute('data-inactive-color');
  setVar('--inactive-color', inactiveColor);

  const thickness = wrapper.getAttribute('data-thickness') || wrapper.getAttribute('data-line-thickness');
  setVar('--line-thickness', thickness);

  const width = wrapper.getAttribute('data-width') || wrapper.getAttribute('data-switch-width');
  setVar('--switch-width', width);

  const height = wrapper.getAttribute('data-height') || wrapper.getAttribute('data-switch-height');
  setVar('--switch-height', height);

  const radius = wrapper.getAttribute('data-radius') || wrapper.getAttribute('data-border-radius');
  setVar('--border-radius', radius);

  const topGap = wrapper.getAttribute('data-top-gap') || wrapper.getAttribute('data-border-top-right-gap');
  setVar('--border-top-right-gap', topGap);

  const bottomGap = wrapper.getAttribute('data-bottom-gap') || wrapper.getAttribute('data-border-left-bottom-gap');
  setVar('--border-left-bottom-gap', bottomGap);
}

/**
 * Helper to parse HTML data attributes for Segment Controls
 * @param {HTMLElement} wrapper 
 */
function applySegmentAttributes(wrapper) {
  const style = wrapper.style;
  const setVar = (name, val) => {
    if (val) style.setProperty(name, val);
  };

  const color = wrapper.getAttribute('data-color') || wrapper.getAttribute('data-primary-color');
  applyColorToWrapper(wrapper, color);

  const inactiveColor = wrapper.getAttribute('data-inactive-color');
  setVar('--inactive-color', inactiveColor);

  const thickness = wrapper.getAttribute('data-thickness') || wrapper.getAttribute('data-line-thickness');
  setVar('--line-thickness', thickness);

  const width = wrapper.getAttribute('data-width') || wrapper.getAttribute('data-segment-width');
  setVar('--segment-width', width);

  const height = wrapper.getAttribute('data-height') || wrapper.getAttribute('data-segment-height');
  setVar('--segment-height', height);

  const radius = wrapper.getAttribute('data-radius') || wrapper.getAttribute('data-border-radius');
  setVar('--border-radius', radius);

  const topGap = wrapper.getAttribute('data-top-gap') || wrapper.getAttribute('data-border-top-right-gap');
  setVar('--border-top-right-gap', topGap);

  const bottomGap = wrapper.getAttribute('data-bottom-gap') || wrapper.getAttribute('data-border-left-bottom-gap');
  setVar('--border-left-bottom-gap', bottomGap);
}

// Custom Web Components
class HdInput extends HTMLElement {
  static get observedAttributes() {
    return ['data-width','data-wrapper-width','data-height','data-wrapper-height',
            'data-color','data-primary-color','data-text-color','data-thickness',
            'data-line-thickness','data-radius','data-border-radius','data-padding',
            'data-wrapper-padding','data-font-size','data-font-weight',
            'data-letter-spacing','data-line-height','data-top-gap',
            'data-border-top-right-gap','data-bottom-gap','data-border-left-bottom-gap',
            'data-left-cursor','data-left-cursor-left','data-right-cursor',
            'data-right-cursor-right','data-left-height','data-left-cursor-height-unfocused',
            'data-right-height','data-right-cursor-height-unfocused'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) applyAttributes(this);
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const placeholder = this.getAttribute('placeholder') || '';
    const value = this.getAttribute('value') || '';
    const id = this.getAttribute('id') || '';
    const name = this.getAttribute('name') || '';
    const autocomplete = this.getAttribute('autocomplete') || 'off';
    const type = this.getAttribute('type') || 'text';
    
    this.classList.add('custom-input-wrapper');
    
    this.innerHTML = `
      <div class="border-segment border-left-bottom"></div>
      <div class="border-segment border-top-right"></div>
      <input class="input-style-base">
      <span class="text-measurer input-style-base"></span>
      <span class="fake-cursor"></span>
      <span class="fake-vertical-cur"></span>
    `;
    
    const input = this.querySelector('input');
    if (id) input.id = id;
    if (name) input.name = name;
    input.type = type;
    input.placeholder = placeholder;
    input.value = value;
    input.autocomplete = autocomplete;
    
    applyAttributes(this);
    initCustomInput(this);
    initAttributeObserver(this, applyAttributes);

    Object.defineProperty(this, 'value', {
      get() { return input.value; },
      set(val) {
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      },
      configurable: true
    });
  }
}

class HdTextarea extends HTMLElement {
  static get observedAttributes() {
    return ['data-width','data-wrapper-width','data-height','data-wrapper-height',
            'data-color','data-primary-color','data-text-color','data-thickness',
            'data-line-thickness','data-radius','data-border-radius','data-padding',
            'data-wrapper-padding','data-font-size','data-font-weight',
            'data-letter-spacing','data-line-height','data-top-gap',
            'data-border-top-right-gap','data-bottom-gap','data-border-left-bottom-gap'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) applyAttributes(this);
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const placeholder = this.getAttribute('placeholder') || '';
    const value = this.textContent || this.getAttribute('value') || '';
    const id = this.getAttribute('id') || '';
    const name = this.getAttribute('name') || '';
    const autocomplete = this.getAttribute('autocomplete') || 'off';
    
    this.classList.add('custom-input-wrapper', 'resizable-wrapper');
    
    this.innerHTML = `
      <div class="border-segment border-left-bottom"></div>
      <div class="border-segment border-top-right"></div>
      <textarea class="input-style-base"></textarea>
      <div class="textarea-mirror input-style-base"></div>
      <span class="fake-cursor"></span>
      <span class="fake-vertical-cur"></span>
    `;
    
    const textarea = this.querySelector('textarea');
    if (id) textarea.id = id;
    if (name) textarea.name = name;
    textarea.placeholder = placeholder;
    textarea.value = value;
    textarea.autocomplete = autocomplete;
    
    applyAttributes(this);
    initCustomTextarea(this);
    initAttributeObserver(this, applyAttributes);

    Object.defineProperty(this, 'value', {
      get() { return textarea.value; },
      set(val) {
        textarea.value = val;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      },
      configurable: true
    });
  }
}

class HdButton extends HTMLElement {
  static get observedAttributes() {
    return ['data-width','data-wrapper-width','data-height','data-wrapper-height',
            'data-color','data-primary-color','data-text-color','data-thickness',
            'data-line-thickness','data-radius','data-border-radius','data-padding',
            'data-wrapper-padding','data-font-size','data-font-weight',
            'data-letter-spacing','data-line-height','data-top-gap',
            'data-border-top-right-gap','data-bottom-gap','data-border-left-bottom-gap'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) applyAttributes(this);
  }
  constructor() {
    super();
    this._internals = this.attachInternals ? this.attachInternals() : null;
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const innerContent = this.innerHTML;
    this.classList.add('custom-button-wrapper');
    
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'button');
    }

    this.innerHTML = `
      <div class="border-segment border-left-bottom"></div>
      <div class="border-segment border-top-right"></div>
      ${innerContent}
      <span class="fake-cursor"></span>
      <span class="fake-vertical-cur"></span>
    `;

    applyAttributes(this);
    initAttributeObserver(this, applyAttributes);

    this.addEventListener('click', (e) => {
      if (this._internals && this._internals.form) {
        const type = this.getAttribute('type') || 'submit';
        if (type === 'submit') {
          const form = this._internals.form;
          if (form) {
            const submitBtn = document.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.style.display = 'none';
            form.appendChild(submitBtn);
            submitBtn.click();
            submitBtn.remove();
          }
        } else if (type === 'reset') {
          this._internals.form.reset();
        }
      }
    });

    this.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.click();
      }
    });
  }
}
HdButton.formAssociated = true;

class HdSlider extends HTMLElement {
  static get observedAttributes() {
    return ['data-width','data-height','data-color','data-primary-color',
            'data-thickness','data-line-thickness','data-handle-width',
            'data-handle-height','data-handle-gap','data-handle-offset'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) applySliderAttributes(this);
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const min = this.getAttribute('min') || '0';
    const max = this.getAttribute('max') || '100';
    const step = this.getAttribute('step') || '1';
    const name = this.getAttribute('name') || '';
    const id = this.getAttribute('id') || '';
    const disabled = this.hasAttribute('disabled') ? 'disabled' : '';

    const initialVal = this.hasOwnProperty('value') ? this.value : (this.getAttribute('value') || '50');
    if (this.hasOwnProperty('value')) {
      delete this.value;
    }

    this.classList.add('custom-slider-wrapper');

    this.innerHTML = `
      <input type="range" min="${min}" max="${max}" value="${initialVal}" step="${step}" ${name ? `name="${name}"` : ''} ${id ? `id="${id}"` : ''} ${disabled} class="real-slider">
      <div class="slider-track">
        <div class="track-active"></div>
        <div class="track-inactive"></div>
      </div>
      <div class="slider-handle">
        <span class="handle-line handle-left"></span>
        <span class="handle-line handle-right"></span>
      </div>
    `;

    applySliderAttributes(this);
    initCustomSlider(this);
    initAttributeObserver(this, applySliderAttributes);

    const input = this.querySelector('.real-slider');
    Object.defineProperty(this, 'value', {
      get() { return input.value; },
      set(val) {
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      },
      configurable: true
    });

    this.value = initialVal;
  }
}

class HdCheckbox extends HTMLElement {
  static get observedAttributes() {
    return ['data-color','data-primary-color','data-thickness','data-line-thickness',
            'data-size','data-check-color','data-font-size'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) applyCheckboxRadioAttributes(this);
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const checked = this.hasAttribute('checked') ? 'checked' : '';
    const disabled = this.hasAttribute('disabled') ? 'disabled' : '';
    const name = this.getAttribute('name') || '';
    const id = this.getAttribute('id') || '';
    const labelText = this.innerHTML;

    this.classList.add('custom-checkbox-wrapper');

    this.innerHTML = `
      <input type="checkbox" ${id ? `id="${id}"` : ''} ${name ? `name="${name}"` : ''} ${checked} ${disabled} class="real-checkbox">
      <span class="checkbox-box">
        <span class="checkmark-line check-left"></span>
        <span class="checkmark-line check-right"></span>
      </span>
      ${labelText ? `<span class="checkbox-label">${labelText}</span>` : ''}
    `;

    applyCheckboxRadioAttributes(this);
    initAttributeObserver(this, applyCheckboxRadioAttributes);

    const input = this.querySelector('.real-checkbox');

    this.addEventListener('click', (e) => {
      if (e.target !== input) {
        e.preventDefault();
        if (!input.disabled) {
          input.checked = !input.checked;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    Object.defineProperty(this, 'checked', {
      get() { return input.checked; },
      set(val) {
        input.checked = val;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      },
      configurable: true
    });
  }
}

class HdRadio extends HTMLElement {
  static get observedAttributes() {
    return ['data-color','data-primary-color','data-thickness','data-line-thickness',
            'data-size','data-check-color','data-font-size'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) applyCheckboxRadioAttributes(this);
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const checked = this.hasAttribute('checked') ? 'checked' : '';
    const disabled = this.hasAttribute('disabled') ? 'disabled' : '';
    const name = this.getAttribute('name') || '';
    const id = this.getAttribute('id') || '';
    const labelText = this.innerHTML;

    this.classList.add('custom-radio-wrapper');

    this.innerHTML = `
      <input type="radio" ${id ? `id="${id}"` : ''} ${name ? `name="${name}"` : ''} ${checked} ${disabled} class="real-radio">
      <span class="radio-circle">
        <span class="radio-inner-dot"></span>
      </span>
      ${labelText ? `<span class="radio-label">${labelText}</span>` : ''}
    `;

    applyCheckboxRadioAttributes(this);
    initAttributeObserver(this, applyCheckboxRadioAttributes);

    const input = this.querySelector('.real-radio');

    this.addEventListener('click', (e) => {
      if (e.target !== input) {
        e.preventDefault();
        if (!input.disabled && !input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    Object.defineProperty(this, 'checked', {
      get() { return input.checked; },
      set(val) {
        input.checked = val;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      },
      configurable: true
    });
  }
}

class HdSwitch extends HTMLElement {
  static get observedAttributes() {
    return ['data-width','data-switch-width','data-height','data-switch-height',
            'data-color','data-primary-color','data-thickness','data-line-thickness',
            'data-radius','data-border-radius','data-top-gap',
            'data-border-top-right-gap','data-bottom-gap','data-border-left-bottom-gap',
            'data-text-on', 'data-text-off', 'data-text-mode'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) {
      applySwitchAttributes(this);
      if (name === 'data-text-on' || name === 'data-text-off' || name === 'data-text-mode') {
        const textOn = this.getAttribute('data-text-on') || '';
        const textOff = this.getAttribute('data-text-off') || '';
        const textMode = this.getAttribute('data-text-mode') || '';

        const switchBox = this.querySelector('.switch-box');
        if (switchBox) {
          let txtOnEl = switchBox.querySelector('.switch-text-on');
          let txtOffEl = switchBox.querySelector('.switch-text-off');
          let handleEl = switchBox.querySelector('.switch-handle');
          
          if (textOn && !txtOnEl) {
            txtOnEl = document.createElement('span');
            txtOnEl.className = 'switch-text-on';
            switchBox.insertBefore(txtOnEl, handleEl);
          }
          if (textOff && !txtOffEl) {
            txtOffEl = document.createElement('span');
            txtOffEl.className = 'switch-text-off';
            switchBox.insertBefore(txtOffEl, handleEl);
          }
          if (txtOnEl) txtOnEl.textContent = textOn;
          if (txtOffEl) txtOffEl.textContent = textOff;

          if (handleEl) {
            let handleTxtOn = handleEl.querySelector('.switch-handle-text-on');
            let handleTxtOff = handleEl.querySelector('.switch-handle-text-off');
            
            if (textMode === 'handle') {
              if (textOn && !handleTxtOn) {
                handleTxtOn = document.createElement('span');
                handleTxtOn.className = 'switch-handle-text-on';
                handleEl.appendChild(handleTxtOn);
              }
              if (textOff && !handleTxtOff) {
                handleTxtOff = document.createElement('span');
                handleTxtOff.className = 'switch-handle-text-off';
                handleEl.appendChild(handleTxtOff);
              }
              if (handleTxtOn) handleTxtOn.textContent = textOn;
              if (handleTxtOff) handleTxtOff.textContent = textOff;
            } else {
              if (handleTxtOn) handleTxtOn.remove();
              if (handleTxtOff) handleTxtOff.remove();
            }
          }
        }
      }
    }
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const checked = this.hasAttribute('checked') ? 'checked' : '';
    const disabled = this.hasAttribute('disabled') ? 'disabled' : '';
    const name = this.getAttribute('name') || '';
    const id = this.getAttribute('id') || '';
    const labelText = this.innerHTML;

    this.classList.add('custom-switch-wrapper');

    const textOn = this.getAttribute('data-text-on') || '';
    const textOff = this.getAttribute('data-text-off') || '';
    const textMode = this.getAttribute('data-text-mode') || '';

    if (textMode) {
      this.setAttribute('data-text-mode', textMode);
    }

    let handleHtml = `<span class="switch-handle"></span>`;
    if (textMode === 'handle') {
      handleHtml = `
        <span class="switch-handle">
          ${textOn ? `<span class="switch-handle-text-on">${textOn}</span>` : ''}
          ${textOff ? `<span class="switch-handle-text-off">${textOff}</span>` : ''}
        </span>
      `;
    }

    this.innerHTML = `
      <input type="checkbox" ${id ? `id="${id}"` : ''} ${name ? `name="${name}"` : ''} ${checked} ${disabled} class="real-switch">
      <span class="switch-box">
        <span class="border-segment border-left-bottom"></span>
        <span class="border-segment border-top-right"></span>
        ${textOn ? `<span class="switch-text-on">${textOn}</span>` : ''}
        ${textOff ? `<span class="switch-text-off">${textOff}</span>` : ''}
        ${handleHtml}
      </span>
      ${labelText ? `<span class="switch-label">${labelText}</span>` : ''}
    `;

    applySwitchAttributes(this);
    initAttributeObserver(this, applySwitchAttributes);

    const input = this.querySelector('.real-switch');

    this.addEventListener('click', (e) => {
      if (e.target !== input) {
        e.preventDefault();
        if (!input.disabled) {
          input.checked = !input.checked;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    Object.defineProperty(this, 'checked', {
      get() { return input.checked; },
      set(val) {
        input.checked = val;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      },
      configurable: true
    });
  }
}

class HdSegment extends HTMLElement {
  static get observedAttributes() {
    return ['data-width','data-segment-width','data-height','data-segment-height',
            'data-color','data-primary-color','data-thickness','data-line-thickness',
            'data-radius','data-border-radius','data-top-gap',
            'data-border-top-right-gap','data-bottom-gap','data-border-left-bottom-gap',
            'value'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) {
      if (name === 'value') {
        this.value = newValue;
      } else {
        applySegmentAttributes(this);
      }
    }
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    // Parse options from child <span> elements
    const optionElements = Array.from(this.querySelectorAll('span'));
    const options = optionElements.map(span => ({
      value: span.getAttribute('value') || span.textContent.trim(),
      text: span.textContent.trim(),
      selected: span.hasAttribute('selected')
    }));

    // Find default value
    let selectedIndex = options.findIndex(o => o.selected);
    if (selectedIndex === -1) selectedIndex = 0;
    const initialValue = options[selectedIndex] ? options[selectedIndex].value : '';

    this.classList.add('custom-segment-wrapper');
    this.style.setProperty('--options-count', options.length);
    this.style.setProperty('--selected-index', selectedIndex);

    // Build inner HTML
    const optionsHtml = options.map((opt, i) => `
      <span class="segment-option ${i === selectedIndex ? 'active' : ''}" data-index="${i}" data-value="${opt.value}">
        ${opt.text}
      </span>
    `).join('');

    this.innerHTML = `
      <span class="segment-box">
        <span class="border-segment border-left-bottom"></span>
        <span class="border-segment border-top-right"></span>
        <span class="segment-handle"></span>
        <div class="segment-options">
          ${optionsHtml}
        </div>
      </span>
    `;

    applySegmentAttributes(this);
    initAttributeObserver(this, applySegmentAttributes);

    // Event listeners
    const optionSpans = this.querySelectorAll('.segment-option');
    this.addEventListener('click', (e) => {
      const option = e.target.closest('.segment-option');
      if (option) {
        const index = parseInt(option.getAttribute('data-index'), 10);
        this.value = option.getAttribute('data-value');
        this.dispatchEvent(new Event('change', { bubbles: true }));
        this.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Define value property
    let currentValue = initialValue;
    Object.defineProperty(this, 'value', {
      get() { return currentValue; },
      set(val) {
        const foundIndex = options.findIndex(o => o.value === val);
        if (foundIndex !== -1) {
          currentValue = val;
          this.style.setProperty('--selected-index', foundIndex);
          optionSpans.forEach((span, idx) => {
            if (idx === foundIndex) {
              span.classList.add('active');
            } else {
              span.classList.remove('active');
            }
          });
        }
      },
      configurable: true
    });
  }
}

class HdScrollbar extends HTMLElement {
  static get observedAttributes() {
    return ['data-color','data-primary-color','data-thickness','data-line-thickness',
            'data-size','data-scrollbar-size','data-width','data-height','data-radius',
            'data-border-radius'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) applyScrollbarAttributes(this);
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    this.classList.add('custom-scrollbar-wrapper');
    applyScrollbarAttributes(this);
    initAttributeObserver(this, applyScrollbarAttributes);
  }
}

/**
 * Helper to convert HSL to HEX color string
 * @param {number} h Hue (0-360)
 * @param {number} s Saturation (0-100)
 * @param {number} l Lightness (0-100)
 */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h <= 360) {
    r = c; g = 0; b = x;
  }
  
  let r_hex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  let g_hex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  let b_hex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
  
  return `#${r_hex}${g_hex}${b_hex}`;
}

class HdSelect extends HTMLElement {
  static get observedAttributes() {
    return ['data-width','data-wrapper-width','data-height','data-wrapper-height',
            'data-color','data-primary-color','data-text-color','data-thickness',
            'data-line-thickness','data-radius','data-border-radius','data-padding',
            'data-wrapper-padding','data-font-size','data-font-weight',
            'data-letter-spacing','data-line-height','data-top-gap',
            'data-border-top-right-gap','data-bottom-gap','data-border-left-bottom-gap'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) applyAttributes(this);
  }
  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const placeholder = this.getAttribute('placeholder') || 'Ընտրեք...';
    const name = this.getAttribute('name') || '';
    const id = this.getAttribute('id') || '';
    
    // Extract child options (spans) before altering innerHTML
    const options = Array.from(this.querySelectorAll('span'));
    const optionsData = options.map(opt => ({
      value: opt.getAttribute('value') || opt.textContent.trim(),
      label: opt.textContent.trim(),
      selected: opt.hasAttribute('selected')
    }));

    this.classList.add('custom-select-wrapper');

    // Find initially selected option
    const initialSelected = optionsData.find(o => o.selected) || null;
    const triggerLabel = initialSelected ? initialSelected.label : placeholder;

    this.innerHTML = `
      <div class="border-segment border-left-bottom"></div>
      <div class="border-segment border-top-right"></div>
      <span class="select-trigger input-style-base">${triggerLabel}</span>
      <span class="fake-vertical-cur select-arrow"></span>
      <select ${id ? `id="${id}"` : ''} ${name ? `name="${name}"` : ''} style="display:none;">
        <option value="" ${!initialSelected ? 'selected' : ''} disabled>${placeholder}</option>
        ${optionsData.map(o => `<option value="${o.value}" ${o.selected ? 'selected' : ''}>${o.label}</option>`).join('')}
      </select>
      <div class="select-options-panel custom-scrollbar-wrapper">
        ${optionsData.map(o => `<div class="select-option ${o.selected ? 'selected' : ''}" data-value="${o.value}">${o.label}</div>`).join('')}
      </div>
    `;

    applyAttributes(this);
    initAttributeObserver(this, applyAttributes);

    const trigger = this.querySelector('.select-trigger');
    const select = this.querySelector('select');
    const optionsPanel = this.querySelector('.select-options-panel');
    const optionElements = this.querySelectorAll('.select-option');

    // Toggle options panel & Option selection
    this.addEventListener('click', (e) => {
      const optionEl = e.target.closest('.select-option');
      if (optionEl) {
        const value = optionEl.getAttribute('data-value');
        const label = optionEl.textContent;

        optionElements.forEach(el => el.classList.remove('selected'));
        optionEl.classList.add('selected');

        trigger.textContent = label;
        select.value = value;
        
        select.dispatchEvent(new Event('change', { bubbles: true }));
        this.dispatchEvent(new Event('change', { bubbles: true }));

        this.classList.remove('open');
      } else {
        const isOpen = this.classList.contains('open');
        document.querySelectorAll('.custom-select-wrapper.open').forEach(el => {
          if (el !== this) el.classList.remove('open');
        });
        if (isOpen) {
          this.classList.remove('open');
        } else {
          this.classList.add('open');
        }
      }

      // Prevent double-activation when nested inside a <label>
      if (e.target !== select) {
        e.preventDefault();
      }
    });

    // Close on pointerdown outside
    document.addEventListener('pointerdown', (e) => {
      if (!this.contains(e.target)) {
        this.classList.remove('open');
      }
    });


    // Define value property
    Object.defineProperty(this, 'value', {
      get() { return select.value; },
      set(val) {
        select.value = val;
        const matchingOpt = optionsData.find(o => o.value === val);
        if (matchingOpt) {
          trigger.textContent = matchingOpt.label;
          optionElements.forEach(el => {
            if (el.getAttribute('data-value') === val) {
              el.classList.add('selected');
            } else {
              el.classList.remove('selected');
            }
          });
        } else {
          trigger.textContent = placeholder;
          optionElements.forEach(el => el.classList.remove('selected'));
        }
        select.dispatchEvent(new Event('change', { bubbles: true }));
      },
      configurable: true
    });
  }
}

class HdColorPanel extends HTMLElement {
  static get observedAttributes() {
    return ['value','data-width','data-wrapper-width','data-height','data-wrapper-height',
            'data-color','data-primary-color','data-thickness','data-line-thickness',
            'data-radius','data-border-radius','data-padding','data-wrapper-padding',
            'data-top-gap','data-border-top-right-gap','data-bottom-gap',
            'data-border-left-bottom-gap'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value' && this.dataset.initialized) {
      this._updateSlidersFromValue(newVal);
    } else if (name !== 'value' && this.dataset.initialized) {
      applyAttributes(this);
    }
  }

  get value() {
    return this._currentValue || this.getAttribute('value') || '#254d4e';
  }

  set value(val) {
    this._currentValue = val;
    if (this.getAttribute('value') !== val) {
      this.setAttribute('value', val);
    }
    this._updateSlidersFromValue(val);
  }

  _updateSlidersFromValue(hex) {
    this._currentValue = hex;
    const hueSlider = this.querySelector('.hue-slider-element');
    const satSlider = this.querySelector('.sat-slider-element');
    const litSlider = this.querySelector('.lit-slider-element');
    const hexInput = this.querySelector('.hex-input-element');
    const swatch = this.querySelector('.color-preview-swatch-panel');
    const hueValText = this.querySelector('.hue-val-text');
    const satValText = this.querySelector('.sat-val-text');
    const litValText = this.querySelector('.lit-val-text');

    if (hueSlider && satSlider && litSlider && hexInput) {
      try {
        const hsl = hexToHsl(hex);
        hueSlider.value = hsl.h;
        satSlider.value = hsl.s;
        litSlider.value = hsl.l;
        hexInput.value = hex;

        if (swatch) swatch.style.backgroundColor = hex;
        if (hueValText) hueValText.textContent = `${hsl.h}°`;
        if (satValText) satValText.textContent = `${hsl.s}%`;
        if (litValText) litValText.textContent = `${hsl.l}%`;

        const satTrack = satSlider.querySelector('.slider-track');
        if (satTrack) {
          satTrack.style.background = `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`;
        }
        const litTrack = litSlider.querySelector('.slider-track');
        if (litTrack) {
          litTrack.style.background = `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`;
        }

        satSlider.style.setProperty('--primary-color', hex);
        litSlider.style.setProperty('--primary-color', hex);
        
        this._currentHsl = hsl;
      } catch (e) {
        console.error("Error setting value on color panel:", e);
      }
    }
  }

  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const initialVal = this.hasOwnProperty('value') ? this.value : this.value;
    if (this.hasOwnProperty('value')) {
      delete this.value;
    }

    this.classList.add('custom-color-panel-wrapper');

    this.innerHTML = `
      <div class="border-segment border-left-bottom"></div>
      <div class="border-segment border-top-right"></div>
      
      <!-- Compact main row -->
      <div class="compact-header-row" style="display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box;">
        <div class="color-preview-swatch-panel" style="width: 32px; height: 32px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.15); cursor: pointer; flex-shrink: 0; box-shadow: inset 0 0 4px rgba(0,0,0,0.1); background-color: ${initialVal};"></div>
        <hd-input class="hex-input-element" data-height="36px" data-thickness="2px" placeholder="#000000" style="flex: 1; min-width: 0;"></hd-input>
        
        <button class="advanced-toggle-btn" style="flex-shrink: 0;">
          <span>Sliders</span>
          <svg class="chevron-icon" width="10" height="6" viewBox="0 0 10 6" fill="none" style="transition: transform 0.4s cubic-bezier(0.99, -0.67, 0.04, 1.67), opacity 0.4s cubic-bezier(0.99, -0.67, 0.04, 1.67); transform: rotate(0deg);">
            <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <hd-button class="apply-button-element" data-height="36px" data-thickness="2px" data-width="70px" data-letter-spacing="0.5px" style="font-size: 11px; flex-shrink: 0;">Կիրառել</hd-button>
      </div>

      <!-- Advanced settings collapsible container -->
      <div class="advanced-options-section" style="display: none; flex-direction: column; gap: 8px; width: 100%; margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 8px; box-sizing: border-box;">
        <div style="display: flex; align-items: center; justify-content: space-between; box-sizing: border-box;">
          <span class="input-style-base" style="font-size: 10px; color: var(--text-color); font-weight: 600; white-space: nowrap;">Երանգ (Hue)</span>
          <span class="hue-val-text" style="font-size: 10px; font-family: monospace; color: var(--text-color);">0°</span>
        </div>
        <hd-slider min="0" max="360" class="hue-slider-element" data-slider-type="hue" data-height="24px" data-thickness="6px" data-handle-height="16px"></hd-slider>
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; box-sizing: border-box;">
          <span class="input-style-base" style="font-size: 10px; color: var(--text-color); font-weight: 600; white-space: nowrap;">Հագեցվածություն (Saturation)</span>
          <span class="sat-val-text" style="font-size: 10px; font-family: monospace; color: var(--text-color);">0%</span>
        </div>
        <hd-slider min="0" max="100" class="sat-slider-element" data-slider-type="sat" data-height="24px" data-thickness="6px" data-handle-height="16px"></hd-slider>
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; box-sizing: border-box;">
          <span class="input-style-base" style="font-size: 10px; color: var(--text-color); font-weight: 600; white-space: nowrap;">Պայծառություն (Lightness)</span>
          <span class="lit-val-text" style="font-size: 10px; font-family: monospace; color: var(--text-color);">0%</span>
        </div>
        <hd-slider min="0" max="100" class="lit-slider-element" data-slider-type="lit" data-height="24px" data-thickness="6px" data-handle-height="16px"></hd-slider>
      </div>
    `;

    applyAttributes(this);
    initAttributeObserver(this, applyAttributes);

    const hueSlider = this.querySelector('.hue-slider-element');
    const satSlider = this.querySelector('.sat-slider-element');
    const litSlider = this.querySelector('.lit-slider-element');
    const hexInput = this.querySelector('.hex-input-element');
    const applyBtn = this.querySelector('.apply-button-element');
    const toggleBtn = this.querySelector('.advanced-toggle-btn');
    const advancedSection = this.querySelector('.advanced-options-section');
    const chevronIcon = this.querySelector('.chevron-icon');
    const swatchPanel = this.querySelector('.color-preview-swatch-panel');

    this._currentHsl = hexToHsl(initialVal);
    
    const updateFromSliders = () => {
      const h = parseInt(hueSlider.value) || 0;
      const s = parseInt(satSlider.value) || 0;
      const l = parseInt(litSlider.value) || 0;
      
      const hex = hslToHex(h, s, l);
      this._currentValue = hex;
      hexInput.value = hex;

      const swatch = this.querySelector('.color-preview-swatch-panel');
      const hueValText = this.querySelector('.hue-val-text');
      const satValText = this.querySelector('.sat-val-text');
      const litValText = this.querySelector('.lit-val-text');

      if (swatch) swatch.style.backgroundColor = hex;
      if (hueValText) hueValText.textContent = `${h}°`;
      if (satValText) satValText.textContent = `${s}%`;
      if (litValText) litValText.textContent = `${l}%`;

      const satTrack = satSlider.querySelector('.slider-track');
      if (satTrack) {
        satTrack.style.background = `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`;
      }
      const litTrack = litSlider.querySelector('.slider-track');
      if (litTrack) {
        litTrack.style.background = `linear-gradient(to right, hsl(${h}, ${s}%, 0%), hsl(${h}, ${s}%, 50%), hsl(${h}, ${s}%, 100%))`;
      }
      
      satSlider.style.setProperty('--primary-color', hex);
      litSlider.style.setProperty('--primary-color', hex);

      this._currentHsl = { h, s, l };

      this.dispatchEvent(new CustomEvent('color-change', {
        bubbles: true,
        detail: { hex, h, s, l }
      }));
    };

    const updateFromHex = () => {
      const hex = hexInput.value;
      if (/^#[0-9a-fA-F]{3,6}$/.test(hex)) {
        try {
          const hsl = hexToHsl(hex);
          this._currentValue = hex;
          hueSlider.value = hsl.h;
          satSlider.value = hsl.s;
          litSlider.value = hsl.l;
          this._currentHsl = hsl;
          
          const swatch = this.querySelector('.color-preview-swatch-panel');
          const hueValText = this.querySelector('.hue-val-text');
          const satValText = this.querySelector('.sat-val-text');
          const litValText = this.querySelector('.lit-val-text');

          if (swatch) swatch.style.backgroundColor = hex;
          if (hueValText) hueValText.textContent = `${hsl.h}°`;
          if (satValText) satValText.textContent = `${hsl.s}%`;
          if (litValText) litValText.textContent = `${hsl.l}%`;

          const satTrack = satSlider.querySelector('.slider-track');
          if (satTrack) {
            satTrack.style.background = `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`;
          }
          const litTrack = litSlider.querySelector('.slider-track');
          if (litTrack) {
            litTrack.style.background = `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`;
          }

          satSlider.style.setProperty('--primary-color', hex);
          litSlider.style.setProperty('--primary-color', hex);

          this.dispatchEvent(new CustomEvent('color-change', {
            bubbles: true,
            detail: { hex, h: hsl.h, s: hsl.s, l: hsl.l }
          }));
        } catch (e) {
          console.error(e);
        }
      }
    };

    if (toggleBtn && advancedSection) {
      toggleBtn.addEventListener('click', () => {
        const isClosed = advancedSection.style.display === 'none';
        if (isClosed) {
          advancedSection.style.display = 'flex';
          toggleBtn.classList.add('active');
          if (chevronIcon) chevronIcon.style.transform = 'rotate(180deg)';
        } else {
          advancedSection.style.display = 'none';
          toggleBtn.classList.remove('active');
          if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
        }
        this.dispatchEvent(new CustomEvent('panel-resize', { bubbles: true }));
      });
    }

    if (swatchPanel && toggleBtn) {
      swatchPanel.addEventListener('click', () => {
        toggleBtn.click();
      });
    }

    Promise.all([
      customElements.whenDefined('hd-slider'),
      customElements.whenDefined('hd-input'),
      customElements.whenDefined('hd-button')
    ]).then(() => {
      const currentVal = this.hasOwnProperty('value') ? this.value : this.value;
      if (this.hasOwnProperty('value')) {
        delete this.value;
      }
      this.value = currentVal;

      if (hueSlider) hueSlider.addEventListener('input', updateFromSliders);
      if (satSlider) satSlider.addEventListener('input', updateFromSliders);
      if (litSlider) litSlider.addEventListener('input', updateFromSliders);
      
      if (applyBtn) {
        applyBtn.addEventListener('click', () => {
          updateFromHex();
          this.dispatchEvent(new CustomEvent('color-apply', {
            bubbles: true,
            detail: { hex: hexInput.value }
          }));
        });
      }
      
      if (hexInput) hexInput.addEventListener('change', updateFromHex);
    });
  }
}

class HdColorPicker extends HTMLElement {
  static get observedAttributes() {
    return ['data-width','data-wrapper-width','data-height','data-wrapper-height',
            'data-color','data-primary-color','data-thickness','data-line-thickness',
            'data-radius','data-border-radius','data-padding','data-wrapper-padding',
            'data-top-gap','data-border-top-right-gap','data-bottom-gap',
            'data-border-left-bottom-gap'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.dataset.initialized && oldValue !== newValue) applyAttributes(this);
  }

  _positionPanel() {
    const panel = this.querySelector('.color-picker-panel');
    if (!panel) return;

    // Reset inline positioning to obtain standard measurements
    panel.style.top = '';
    panel.style.bottom = '';
    panel.style.left = '';
    panel.style.right = '';

    const rect = this.getBoundingClientRect();
    const panelWidth = 320; 
    const panelHeight = panel.offsetHeight || 220;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = viewportWidth - rect.left;
    const spaceLeft = rect.right;

    const thickness = parseInt(getComputedStyle(this).getPropertyValue('--line-thickness')) || 4;
    
    // Vertical positioning (flip up if not enough space below)
    if (spaceBelow < panelHeight && spaceAbove > spaceBelow) {
      panel.style.top = 'auto';
      panel.style.bottom = `calc(100% + ${thickness}px)`;
    } else {
      panel.style.top = `calc(100% + ${thickness}px)`;
      panel.style.bottom = 'auto';
    }

    // Horizontal positioning (flip left if not enough space on the right)
    if (spaceRight < panelWidth && spaceLeft > spaceRight) {
      panel.style.left = 'auto';
      panel.style.right = `-${thickness}px`;
    } else {
      panel.style.left = `-${thickness}px`;
      panel.style.right = 'auto';
    }
  }

  connectedCallback() {
    if (this.dataset.initialized) return;
    this.dataset.initialized = 'true';

    const initialVal = this.hasOwnProperty('value') ? this.value : (this.getAttribute('value') || '#254d4e');
    if (this.hasOwnProperty('value')) {
      delete this.value;
    }

    const name = this.getAttribute('name') || '';
    const id = this.getAttribute('id') || '';

    this.classList.add('custom-color-picker-wrapper');

    this.innerHTML = `
      <div class="border-segment border-left-bottom"></div>
      <div class="border-segment border-top-right"></div>
      <div class="color-preview-swatch" style="background-color: ${initialVal};"></div>
      <span class="color-value-text input-style-base">${initialVal}</span>
      <span class="fake-vertical-cur picker-arrow"></span>
      <input type="hidden" ${id ? `id="${id}"` : ''} ${name ? `name="${name}"` : ''} class="real-color-input" value="${initialVal}">
      
      <div class="color-picker-panel">
        <hd-color-panel value="${initialVal}"></hd-color-panel>
      </div>
    `;

    applyAttributes(this);
    initAttributeObserver(this, applyAttributes);

    const swatch = this.querySelector('.color-preview-swatch');
    const textVal = this.querySelector('.color-value-text');
    const hiddenInput = this.querySelector('.real-color-input');
    const panelWrapper = this.querySelector('.color-picker-panel');
    const colorPanel = this.querySelector('hd-color-panel');

    // Toggle dropdown panel
    this.addEventListener('click', (e) => {
      if (panelWrapper.contains(e.target)) {
        return;
      }
      
      const isOpen = this.classList.contains('open');
      document.querySelectorAll('.custom-color-picker-wrapper.open').forEach(el => {
        if (el !== this) {
          el.classList.remove('open');
        }
      });
      
      if (isOpen) {
        this.classList.remove('open');
      } else {
        this.classList.add('open');
        this._positionPanel();
      }
    });

    // Close on pointerdown outside
    document.addEventListener('pointerdown', (e) => {
      if (!this.contains(e.target)) {
        this.classList.remove('open');
      }
    });

    // Listen to color change events from the panel
    colorPanel.addEventListener('color-change', (e) => {
      const hex = e.detail.hex;
      swatch.style.backgroundColor = hex;
      textVal.textContent = hex;
      hiddenInput.value = hex;
      
      this.dispatchEvent(new Event('input', { bubbles: true }));
    });

    colorPanel.addEventListener('color-apply', (e) => {
      const hex = e.detail.hex;
      swatch.style.backgroundColor = hex;
      textVal.textContent = hex;
      hiddenInput.value = hex;
      
      this.classList.remove('open');
      
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Listen to panel-resize events to recalculate position
    this.addEventListener('panel-resize', () => {
      if (this.classList.contains('open')) {
        this._positionPanel();
      }
    });

    // Define value property
    Object.defineProperty(this, 'value', {
      get() { return hiddenInput.value; },
      set(val) {
        hiddenInput.value = val;
        swatch.style.backgroundColor = val;
        textVal.textContent = val;
        const panel = this.querySelector('hd-color-panel');
        if (panel) {
          panel.value = val;
        }
      },
      configurable: true
    });

    this.value = initialVal;
  }
}

if (!customElements.get('hd-input')) {
  customElements.define('hd-input', HdInput);
}
if (!customElements.get('hd-textarea')) {
  customElements.define('hd-textarea', HdTextarea);
}
if (!customElements.get('hd-button')) {
  customElements.define('hd-button', HdButton);
}
if (!customElements.get('hd-slider')) {
  customElements.define('hd-slider', HdSlider);
}
if (!customElements.get('hd-checkbox')) {
  customElements.define('hd-checkbox', HdCheckbox);
}
if (!customElements.get('hd-radio')) {
  customElements.define('hd-radio', HdRadio);
}
if (!customElements.get('hd-switch')) {
  customElements.define('hd-switch', HdSwitch);
}
if (!customElements.get('hd-segment')) {
  customElements.define('hd-segment', HdSegment);
}
if (!customElements.get('hd-scrollbar')) {
  customElements.define('hd-scrollbar', HdScrollbar);
}
if (!customElements.get('hd-select')) {
  customElements.define('hd-select', HdSelect);
}
if (!customElements.get('hd-color-panel')) {
  customElements.define('hd-color-panel', HdColorPanel);
}
if (!customElements.get('hd-color-picker')) {
  customElements.define('hd-color-picker', HdColorPicker);
}

// Ավտոմատ գործարկում
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllCustomComponents);
} else {
  initAllCustomComponents();
}
