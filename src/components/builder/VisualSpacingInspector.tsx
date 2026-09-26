"use client";

import React, { useState } from 'react';
import { BlockStyles, BoxSpacing, DimensionValue, SpacingUnit } from '@/types/builder';

interface VisualSpacingInspectorProps {
  styles: BlockStyles;
  onChange: (updatedStyles: BlockStyles) => void;
  blockTitle?: string;
  blockType?: string;
}

export default function VisualSpacingInspector({
  styles,
  onChange,
  blockTitle,
  blockType
}: VisualSpacingInspectorProps) {
  const [activeTab, setActiveTab] = useState<'spacing' | 'dimensions' | 'layout'>('spacing');

  // Helper to safely clone and emit style updates
  const updateStyle = <K extends keyof BlockStyles>(key: K, value: BlockStyles[K]) => {
    const updated = {
      ...styles,
      [key]: value
    };
    onChange(updated);
  };

  // -------------------------------------------------------------
  // 1. Spacing Update Helpers (Padding, Margin, Gap)
  // -------------------------------------------------------------
  const handlePaddingChange = (side: keyof BoxSpacing, val: number | string | boolean) => {
    const isLinked = styles.padding.isLinked;
    const newPadding: BoxSpacing = { ...styles.padding };

    if (side === 'isLinked') {
      newPadding.isLinked = Boolean(val);
    } else if (isLinked && (side === 'top' || side === 'right' || side === 'bottom' || side === 'left')) {
      newPadding.top = val as number | string;
      newPadding.right = val as number | string;
      newPadding.bottom = val as number | string;
      newPadding.left = val as number | string;
    } else {
      (newPadding as any)[side] = val;
    }

    updateStyle('padding', newPadding);
  };

  const handleMarginChange = (side: keyof BoxSpacing, val: number | string | boolean) => {
    const isLinked = styles.margin.isLinked;
    const newMargin: BoxSpacing = { ...styles.margin };

    if (side === 'isLinked') {
      newMargin.isLinked = Boolean(val);
    } else if (isLinked && (side === 'top' || side === 'right' || side === 'bottom' || side === 'left')) {
      newMargin.top = val as number | string;
      newMargin.right = val as number | string;
      newMargin.bottom = val as number | string;
      newMargin.left = val as number | string;
    } else {
      (newMargin as any)[side] = val;
    }

    updateStyle('margin', newMargin);
  };

  const handleGapChange = (value: number) => {
    updateStyle('gap', {
      value,
      unit: styles.gap?.unit || 'px'
    });
  };

  // -------------------------------------------------------------
  // 2. Dimensions Update Helpers
  // -------------------------------------------------------------
  const handleWidthTypeChange = (type: 'auto' | 'full' | 'custom') => {
    const currentVal = styles.width?.value || 100;
    const currentUnit = type === 'full' ? '%' : styles.width?.unit || 'px';

    updateStyle('width', {
      type,
      value: type === 'full' ? 100 : currentVal,
      unit: currentUnit
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: '#e2e8f0',
        fontFamily: 'inherit',
        fontSize: '13px'
      }}
    >
      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#14b8a6' }}>
            {blockTitle || 'Ընտրված Բլոկ'}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Տեսակը: {blockType || 'Section'}
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Spacing / Dimensions / Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          padding: '3px',
          borderRadius: '8px'
        }}
      >
        {[
          { id: 'spacing', label: 'Բացատներ (Spacing)' },
          { id: 'dimensions', label: 'Չափսեր (Size)' },
          { id: 'layout', label: 'Դասավորություն' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 4px',
              fontSize: '11px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              backgroundColor: activeTab === tab.id ? '#083f39' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
              border: activeTab === tab.id ? '1px solid #14b8a6' : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: VISUAL SPACING (BOX MODEL + GAP) */}
      {activeTab === 'spacing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Visual CSS Box Model Diagram */}
          <div
            style={{
              position: 'relative',
              backgroundColor: 'rgba(234, 88, 12, 0.08)',
              border: '1px dashed rgba(234, 88, 12, 0.4)',
              borderRadius: '10px',
              padding: '24px 20px',
              textAlign: 'center'
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '4px',
                left: '8px',
                fontSize: '9px',
                fontWeight: 700,
                color: '#fb923c',
                textTransform: 'uppercase'
              }}
            >
              MARGIN
            </span>

            {/* Margin Inputs */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <input
                type="number"
                value={Number(styles.margin?.top) || 0}
                onChange={(e) => handleMarginChange('top', Number(e.target.value))}
                style={miniInputStyle}
                title="Margin Top"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input
                type="number"
                value={Number(styles.margin?.left) || 0}
                onChange={(e) => handleMarginChange('left', Number(e.target.value))}
                style={miniInputStyle}
                title="Margin Left"
              />

              {/* Inner Padding Box */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  margin: '0 8px',
                  backgroundColor: 'rgba(20, 184, 166, 0.1)',
                  border: '1px solid rgba(20, 184, 166, 0.4)',
                  borderRadius: '6px',
                  padding: '20px 14px'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '6px',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#2dd4bf',
                    textTransform: 'uppercase'
                  }}
                >
                  PADDING
                </span>

                {/* Padding Top */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                  <input
                    type="number"
                    value={Number(styles.padding?.top) || 0}
                    onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                    style={miniInputStyle}
                    title="Padding Top"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={Number(styles.padding?.left) || 0}
                    onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
                    style={miniInputStyle}
                    title="Padding Left"
                  />

                  {/* Content Box (Center) */}
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: '#94a3b8'
                    }}
                  >
                    Content
                  </div>

                  <input
                    type="number"
                    value={Number(styles.padding?.right) || 0}
                    onChange={(e) => handlePaddingChange('right', Number(e.target.value))}
                    style={miniInputStyle}
                    title="Padding Right"
                  />
                </div>

                {/* Padding Bottom */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                  <input
                    type="number"
                    value={Number(styles.padding?.bottom) || 0}
                    onChange={(e) => handlePaddingChange('bottom', Number(e.target.value))}
                    style={miniInputStyle}
                    title="Padding Bottom"
                  />
                </div>
              </div>

              <input
                type="number"
                value={Number(styles.margin?.right) || 0}
                onChange={(e) => handleMarginChange('right', Number(e.target.value))}
                style={miniInputStyle}
                title="Margin Right"
              />
            </div>

            {/* Margin Bottom */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
              <input
                type="number"
                value={Number(styles.margin?.bottom) || 0}
                onChange={(e) => handleMarginChange('bottom', Number(e.target.value))}
                style={miniInputStyle}
                title="Margin Bottom"
              />
            </div>
          </div>

          {/* Linking toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={styles.padding?.isLinked ?? false}
                onChange={(e) => handlePaddingChange('isLinked', e.target.checked)}
              />
              Կապել Padding կողմերը (Link)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={styles.margin?.isLinked ?? false}
                onChange={(e) => handleMarginChange('isLinked', e.target.checked)}
              />
              Կապել Margin կողմերը
            </label>
          </div>

          {/* GAP Control (Slider + Numeric Input) */}
          <div style={controlGroupStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 600 }}>Տարրերի Միջակայք (Gap)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={Number(styles.gap?.value) || 0}
                  onChange={(e) => handleGapChange(Number(e.target.value))}
                  style={numericInputStyle}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>px</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="2"
              value={Number(styles.gap?.value) || 0}
              onChange={(e) => handleGapChange(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#14b8a6', cursor: 'pointer' }}
            />
          </div>

          {/* Padding Top/Bottom Quick Slider */}
          <div style={controlGroupStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 600 }}>Ուղղահայաց Padding (Y-axis)</label>
              <span style={{ fontSize: '12px', color: '#14b8a6' }}>{styles.padding?.top || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="4"
              value={Number(styles.padding?.top) || 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                const newPadding = { ...styles.padding, top: val, bottom: val };
                updateStyle('padding', newPadding);
              }}
              style={{ width: '100%', accentColor: '#14b8a6', cursor: 'pointer' }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: DIMENSIONS & SIZING */}
      {activeTab === 'dimensions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Width Type Selector (Auto / Full / Custom) */}
          <div style={controlGroupStyle}>
            <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Լայնություն (Width)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[
                { type: 'auto', label: 'Auto' },
                { type: 'full', label: '100% Full' },
                { type: 'custom', label: 'Custom' }
              ].map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => handleWidthTypeChange(btn.type as any)}
                  style={{
                    padding: '7px 4px',
                    fontSize: '12px',
                    fontWeight: styles.width?.type === btn.type ? 700 : 500,
                    backgroundColor: styles.width?.type === btn.type ? '#14b8a6' : 'rgba(255,255,255,0.05)',
                    color: styles.width?.type === btn.type ? '#051311' : '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Custom Width Value & Unit */}
            {styles.width?.type === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input
                  type="number"
                  value={Number(styles.width.value) || 0}
                  onChange={(e) =>
                    updateStyle('width', {
                      ...styles.width,
                      value: Number(e.target.value)
                    })
                  }
                  style={{ ...numericInputStyle, flex: 1 }}
                />
                <select
                  value={styles.width.unit}
                  onChange={(e) =>
                    updateStyle('width', {
                      ...styles.width,
                      unit: e.target.value as any
                    })
                  }
                  style={selectInputStyle}
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="vw">vw</option>
                  <option value="rem">rem</option>
                </select>
              </div>
            )}
          </div>

          {/* Max Width */}
          <div style={controlGroupStyle}>
            <label style={{ fontWeight: 600, marginBottom: '4px', display: 'block' }}>Առավելագույն Լայնություն (Max Width)</label>
            <input
              type="text"
              placeholder="օրինակ՝ 1440px կամ 100%"
              value={styles.maxWidth || ''}
              onChange={(e) => updateStyle('maxWidth', e.target.value)}
              style={textInputStyle}
            />
          </div>

          {/* Background Color & Border Radius */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                Ֆոնի Գույն (BG)
              </label>
              <input
                type="color"
                value={styles.backgroundColor && styles.backgroundColor !== 'transparent' ? styles.backgroundColor : '#083f39'}
                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                style={{ width: '100%', height: '34px', borderRadius: '6px', cursor: 'pointer', border: 'none', background: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                Կլորացում (Radius)
              </label>
              <input
                type="number"
                min="0"
                max="64"
                value={Number(styles.borderRadius) || 0}
                onChange={(e) => updateStyle('borderRadius', Number(e.target.value))}
                style={textInputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LAYOUT & FLEXBOX / GRID ALIGNMENT */}
      {activeTab === 'layout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Display Mode */}
          <div style={controlGroupStyle}>
            <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Layout Տեսակ (Display)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {(['flex', 'grid', 'block'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateStyle('display', mode)}
                  style={{
                    padding: '6px',
                    fontSize: '12px',
                    fontWeight: styles.display === mode ? 700 : 500,
                    backgroundColor: styles.display === mode ? '#14b8a6' : 'rgba(255,255,255,0.05)',
                    color: styles.display === mode ? '#051311' : '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {styles.display === 'flex' && (
            <>
              {/* Flex Direction */}
              <div style={controlGroupStyle}>
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Ուղղություն (Direction)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { val: 'row', label: 'Հորիզոնական (Row ➔)' },
                    { val: 'column', label: 'Ուղղահայաց (Column ⬇)' }
                  ].map((d) => (
                    <button
                      key={d.val}
                      onClick={() => updateStyle('flexDirection', d.val as any)}
                      style={{
                        padding: '6px',
                        fontSize: '11px',
                        fontWeight: styles.flexDirection === d.val ? 700 : 500,
                        backgroundColor: styles.flexDirection === d.val ? '#083f39' : 'rgba(255,255,255,0.05)',
                        border: styles.flexDirection === d.val ? '1px solid #14b8a6' : '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Justify Content */}
              <div style={controlGroupStyle}>
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Հավասարեցում (Justify Content)</label>
                <select
                  value={styles.justifyContent || 'flex-start'}
                  onChange={(e) => updateStyle('justifyContent', e.target.value as any)}
                  style={selectInputStyle}
                >
                  <option value="flex-start">Սկիզբ (Start)</option>
                  <option value="center">Կենտրոն (Center)</option>
                  <option value="flex-end">Վերջ (End)</option>
                  <option value="space-between">Եզրերով (Space Between)</option>
                  <option value="space-around">Հավասար (Space Around)</option>
                  <option value="space-evenly">Համաչափ (Space Evenly)</option>
                </select>
              </div>

              {/* Align Items */}
              <div style={controlGroupStyle}>
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Ուղղահայաց Կենտրոնացում (Align Items)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {[
                    { val: 'flex-start', label: 'Top' },
                    { val: 'center', label: 'Center' },
                    { val: 'flex-end', label: 'Bottom' },
                    { val: 'stretch', label: 'Stretch' }
                  ].map((a) => (
                    <button
                      key={a.val}
                      onClick={() => updateStyle('alignItems', a.val as any)}
                      style={{
                        padding: '6px 2px',
                        fontSize: '11px',
                        fontWeight: styles.alignItems === a.val ? 700 : 500,
                        backgroundColor: styles.alignItems === a.val ? '#14b8a6' : 'rgba(255,255,255,0.05)',
                        color: styles.alignItems === a.val ? '#051311' : '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {styles.display === 'grid' && (
            <div style={controlGroupStyle}>
              <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Grid Columns Template</label>
              <input
                type="text"
                placeholder="օրինակ՝ repeat(3, 1fr) կամ 1fr 2fr"
                value={styles.gridTemplateColumns || 'repeat(2, 1fr)'}
                onChange={(e) => updateStyle('gridTemplateColumns', e.target.value)}
                style={textInputStyle}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// Scoped Styles for Inspector UI Controls
// -----------------------------------------------------------------
const controlGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.06)'
};

const miniInputStyle: React.CSSProperties = {
  width: '42px',
  height: '24px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '11px',
  textAlign: 'center',
  outline: 'none'
};

const numericInputStyle: React.CSSProperties = {
  width: '64px',
  height: '30px',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '12px',
  textAlign: 'center',
  padding: '0 6px',
  outline: 'none'
};

const textInputStyle: React.CSSProperties = {
  width: '100%',
  height: '34px',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '12px',
  padding: '0 10px',
  boxSizing: 'border-box',
  outline: 'none'
};

const selectInputStyle: React.CSSProperties = {
  height: '32px',
  backgroundColor: '#0a1d1a',
  border: '1px solid rgba(20, 184, 166, 0.3)',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '12px',
  padding: '0 8px',
  outline: 'none',
  cursor: 'pointer'
};
