"use client";

import React, { useState, useRef, useEffect } from 'react';
import PatternRenderer from './PatternRenderer';
import { Layer, LineOverride, RandomizerConstraints } from '@/lib/patternTypes';
import { defaultPresets, generateHarmonicRandom, Preset } from '@/lib/patternPresets';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';

export default function PatternGenerator() {
  const { t } = useI18n();
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(800);
  
  const [layers, setLayers] = useState<Layer[]>(defaultPresets[0].layers);
  const [selectedLayerId, setSelectedLayerId] = useState<string>(layers[0]?.id || '');
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [expandedLayerIds, setExpandedLayerIds] = useState<Record<string, boolean>>({
    [layers[0]?.id || '']: true // expand the first layer by default
  });

  // Randomizer constraints state
  const [randConstraints, setRandConstraints] = useState<RandomizerConstraints>({
    allowDashed: true,
    allowRounded: true,
    allowSolid: true,
    minLayers: 1,
    maxLayers: 3,
    minThickness: 2,
    maxThickness: 12,
    minGap: 15,
    maxGap: 80,
    angleMode: 'discrete',
    selectedAngles: [0, 90, 45, -45],
    minAngle: -90,
    maxAngle: 90,
    palette: 'all'
  });
  const [showRandomizerConfig, setShowRandomizerConfig] = useState(false);

  // Custom Presets state
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [renamingPresetId, setRenamingPresetId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');

  // Layer renaming & context menu states
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [renamingLayerName, setRenamingLayerName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, layerId: string, layerName: string } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Close context menu on click anywhere
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  // Load custom presets from Supabase (fallback to localStorage)
  const fetchSupabasePresets = async () => {
    if (!supabase) {
      loadLocalPresets();
      return;
    }
    try {
      const { data, error } = await supabase
        .from('pattern_presets')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Supabase error loading presets:', error.message);
        loadLocalPresets();
      } else if (data) {
        setCustomPresets(data);
      }
    } catch (e) {
      console.error('Connection error loading presets:', e);
      loadLocalPresets();
    }
  };

  const loadLocalPresets = () => {
    const saved = localStorage.getItem('hdesign_custom_presets');
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    fetchSupabasePresets();
  }, []);

  const toggleLayerExpand = (id: string) => {
    setExpandedLayerIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const loadPreset = (presetLayers: Layer[]) => {
    // Generate new IDs so multiple loads don't conflict
    const newLayers = presetLayers.map(l => ({
      ...l,
      dashLength2: l.dashLength2 ?? 0,
      dashGap2: l.dashGap2 ?? 0,
      dashOffset: l.dashOffset ?? 0,
      id: `layer-${Date.now()}-${Math.random()}`
    }));
    setLayers(newLayers);
    setSelectedLayerId(newLayers[0]?.id || '');
    setSelectedLineIndex(null);
    setExpandedLayerIds({
      [newLayers[0]?.id || '']: true
    });
  };

  const addLayer = () => {
    const newId = `layer-${Date.now()}`;
    setLayers([...layers, {
      id: newId,
      name: `Layer ${layers.length + 1}`,
      lineCount: 11,
      gap: 40,
      thickness: 4,
      angle: 90, // Horizontal
      isDashed: false,
      dashLength: 20,
      dashGap: 10,
      dashLength2: 0,
      dashGap2: 0,
      dashOffset: 0,
      color: '#FFBB28',
      isRounded: false,
      overrides: {}
    }]);
    setSelectedLayerId(newId);
    setSelectedLineIndex(null);
    setExpandedLayerIds(prev => ({
      ...prev,
      [newId]: true
    }));
  };

  const deleteLayer = (id: string) => {
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    if (selectedLayerId === id) {
      setSelectedLayerId(newLayers[0]?.id || '');
      setSelectedLineIndex(null);
    }
  };

  const duplicateLayer = (id: string) => {
    const target = layers.find(l => l.id === id);
    if (!target) return;
    const newId = `layer-${Date.now()}-${Math.random()}`;
    const copy = JSON.parse(JSON.stringify(target));
    copy.id = newId;
    copy.name = `${target.name} (Կրկնօրինակ)`;
    
    const targetIndex = layers.findIndex(l => l.id === id);
    const updated = [...layers];
    updated.splice(targetIndex + 1, 0, copy);
    setLayers(updated);
    setSelectedLayerId(newId);
    setSelectedLineIndex(null);
  };

  const bringToFront = (id: string) => {
    const target = layers.find(l => l.id === id);
    if (!target) return;
    const filtered = layers.filter(l => l.id !== id);
    setLayers([...filtered, target]);
  };

  const sendToBack = (id: string) => {
    const target = layers.find(l => l.id === id);
    if (!target) return;
    const filtered = layers.filter(l => l.id !== id);
    setLayers([target, ...filtered]);
  };

  const startRenameLayer = (id: string, name: string) => {
    setRenamingLayerId(id);
    setRenamingLayerName(name);
  };

  const finishRenameLayer = (id: string) => {
    const name = renamingLayerName.trim();
    if (name) {
      setLayers(layers.map(l => l.id === id ? { ...l, name } : l));
    }
    setRenamingLayerId(null);
  };

  const handleLayerContextMenu = (e: React.MouseEvent, layerId: string, name: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      layerId,
      layerName: name
    });
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const updateLine = (layerId: string, index: number, updates: Partial<LineOverride>) => {
    setLayers(layers.map(l => {
      if (l.id !== layerId) return l;
      const existing = l.overrides[index] || {
        isLinked: true,
        thickness: l.thickness,
        isDashed: l.isDashed,
        dashLength: l.dashLength,
        dashGap: l.dashGap,
        dashLength2: l.dashLength2 ?? 0,
        dashGap2: l.dashGap2 ?? 0,
        dashOffset: l.dashOffset ?? 0,
        color: l.color,
        isRounded: l.isRounded
      };
      return {
        ...l,
        overrides: {
          ...l.overrides,
          [index]: { ...existing, ...updates }
        }
      };
    }));
  };

  const handleLineClick = (layerId: string, lineIndex: number) => {
    setSelectedLayerId(layerId);
    setSelectedLineIndex(lineIndex);
    // ensure layer is expanded so the user sees which line is selected in the sidebar
    setExpandedLayerIds(prev => ({
      ...prev,
      [layerId]: true
    }));
  };

  const downloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pattern.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadRaster = (type: 'image/png' | 'image/jpeg') => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (type === 'image/jpeg') {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL(type);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `pattern.${type === 'image/png' ? 'png' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  };

  // Custom presets operations
  const saveCustomPreset = async () => {
    const name = newPresetName.trim() || `Custom Preset ${customPresets.length + 1}`;
    const layersCopy = JSON.parse(JSON.stringify(layers));

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('pattern_presets')
          .insert([{ name, layers: layersCopy }])
          .select();
        
        if (error) {
          console.error('Supabase save error:', error.message);
          alert('Could not save to Supabase: ' + error.message + '. Saving locally instead.');
          saveLocalPreset(name, layersCopy);
        } else if (data && data[0]) {
          setCustomPresets([...customPresets, data[0]]);
          setNewPresetName('');
        }
      } catch (e) {
        console.error('Connection save error:', e);
        saveLocalPreset(name, layersCopy);
      }
    } else {
      saveLocalPreset(name, layersCopy);
    }
  };

  const saveLocalPreset = (name: string, layersCopy: any) => {
    const newPreset: Preset = {
      id: `custom-local-${Date.now()}`,
      name,
      layers: layersCopy
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    setNewPresetName('');
    localStorage.setItem('hdesign_custom_presets', JSON.stringify(updated));
  };

  const deleteCustomPreset = async (id: string) => {
    if (supabase && !id.toString().startsWith('custom-local-')) {
      try {
        const { error } = await supabase
          .from('pattern_presets')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Supabase delete error:', error.message);
          alert('Failed to delete preset from Supabase: ' + error.message);
        } else {
          setCustomPresets(customPresets.filter(p => p.id !== id));
        }
      } catch (e) {
        console.error('Connection delete error:', e);
      }
    } else {
      // Local delete
      const updated = customPresets.filter(p => p.id !== id);
      setCustomPresets(updated);
      localStorage.setItem('hdesign_custom_presets', JSON.stringify(updated));
    }
  };

  const startRename = (id: string, name: string) => {
    setRenamingPresetId(id);
    setRenamingName(name);
  };

  const finishRename = async (id: string) => {
    const name = renamingName.trim();
    if (!name) return;

    if (supabase && !id.toString().startsWith('custom-local-')) {
      try {
        const { error } = await supabase
          .from('pattern_presets')
          .update({ name })
          .eq('id', id);
        
        if (error) {
          console.error('Supabase rename error:', error.message);
          alert('Failed to rename preset on Supabase: ' + error.message);
        } else {
          setCustomPresets(customPresets.map(p => p.id === id ? { ...p, name } : p));
          setRenamingPresetId(null);
        }
      } catch (e) {
        console.error('Connection rename error:', e);
      }
    } else {
      // Local rename
      const updated = customPresets.map(p => p.id === id ? { ...p, name } : p);
      setCustomPresets(updated);
      setRenamingPresetId(null);
      localStorage.setItem('hdesign_custom_presets', JSON.stringify(updated));
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const selectedLineProps = selectedLayer && selectedLineIndex !== null 
    ? (selectedLayer.overrides[selectedLineIndex] || {
        isLinked: true,
        thickness: selectedLayer.thickness,
        isDashed: selectedLayer.isDashed,
        dashLength: selectedLayer.dashLength,
        dashGap: selectedLayer.dashGap,
        dashLength2: selectedLayer.dashLength2 ?? 0,
        dashGap2: selectedLayer.dashGap2 ?? 0,
        dashOffset: selectedLayer.dashOffset ?? 0,
        color: selectedLayer.color,
        isRounded: selectedLayer.isRounded
      })
    : null;

  return (
    <div style={{ color: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>

      {/* ── 4-COLUMN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(300px, 560px) 280px 280px', gap: 14, alignItems: 'start' }}>

        {/* ══ LEFT: PRESETS ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 100 }}>
          <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--panel-border)', padding: 16, minHeight: 'fit-content', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Պրեսեթներ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {defaultPresets.map(preset => (
                <hd-button key={preset.id} onClick={() => loadPreset(preset.layers)} data-width="100%" data-height="34px" data-font-size="0.8rem">
                  {preset.name}
                </hd-button>
              ))}
            </div>

            <div style={{ margin: '12px 0', height: 1, background: 'var(--panel-border)' }} />

            <hd-button onClick={() => {
              const randomPreset = generateHarmonicRandom(showRandomizerConfig ? randConstraints : null);
              loadPreset(randomPreset.layers);
            }} data-width="100%" data-height="34px" data-font-size="0.8rem" style={{ marginBottom: 6 }}>
              <span className="icon-Pattern" style={{ marginRight: 6 }} />Պատահական
            </hd-button>
          </div>

          {/* Custom presets */}
          <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--panel-border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 'fit-content' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t('qr_creator', 'bg_custom_group', 'Սեփական նախշեր')}
            </h3>
            <hd-input
              placeholder={t('randomizer', 'preset_name_placeholder', 'Պրեսեթի անուն')}
              value={newPresetName}
              onInput={(e: any) => setNewPresetName(e.target.value)}
              data-width="100%"
              data-height="36px"
              data-font-size="0.8rem"
            />
            <hd-button onClick={saveCustomPreset} data-width="100%" data-height="34px" data-font-size="0.8rem">
              {t('randomizer', 'save_preset_btn', 'Պահպանել')}
            </hd-button>
            {customPresets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {customPresets.map(preset => (
                  <div key={preset.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--btn-bg)', padding: '5px 8px', borderRadius: 8, border: '1px solid var(--panel-border)' }}>
                    {renamingPresetId === preset.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                        <hd-input value={renamingName} onInput={(e: any) => setRenamingName(e.target.value)} data-height="28px" data-font-size="0.78rem" style={{ flex: 1 }} autoFocus />
                        <button onClick={() => finishRename(preset.id)} style={{ background: 'none', border: 'none', color: '#00C49F', cursor: 'pointer', padding: 0 }}><span className="icon-Check" /></button>
                        <button onClick={() => setRenamingPresetId(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}><span className="icon-Close" /></button>
                      </div>
                    ) : (
                      <>
                        <span onClick={() => loadPreset(preset.layers)} style={{ flex: 1, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={preset.name}>{preset.name}</span>
                        <button onClick={() => startRename(preset.id, preset.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '0.75rem' }}><span className="icon-Pencil" /></button>
                        <button onClick={() => deleteCustomPreset(preset.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0 2px', fontSize: '0.75rem' }}><span className="icon-Trash" /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', fontSize: '0.78rem', margin: '4px 0' }}>{t('pattern_generator', 'no_presets_msg', 'Պրեսեթներ չկան')}</p>
            )}
          </div>
        </div>

        {/* ══ CENTER: CANVAS ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Canvas size inputs */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem', color: 'var(--muted)' }}>
              {t('pattern_generator', 'canvas_width_label', 'Լայնություն')}
              <hd-input value={canvasWidth} onInput={(e: any) => setCanvasWidth(Number(e.target.value))} data-width="90px" data-height="34px" data-font-size="0.85rem" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem', color: 'var(--muted)' }}>
              {t('pattern_generator', 'canvas_height_label', 'Բարձրություն')}
              <hd-input value={canvasHeight} onInput={(e: any) => setCanvasHeight(Number(e.target.value))} data-width="90px" data-height="34px" data-font-size="0.85rem" />
            </label>
          </div>

          {/* Canvas area */}
          <div style={{
            width: '100%',
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            maxHeight: 500,
            background: 'var(--panel)',
            borderRadius: 16,
            border: '1px solid var(--panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: 10
          }}>
            <PatternRenderer
              ref={svgRef}
              layers={layers}
              width={canvasWidth}
              height={canvasHeight}
              selectedLayerId={selectedLayerId}
              selectedLineIndex={selectedLineIndex}
              onLineClick={handleLineClick}
              style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <hd-button onClick={downloadSVG} data-height="38px" data-font-size="0.82rem" style={{ flex: 1 }}>{t('pattern_generator', 'export_svg_btn', 'SVG')}</hd-button>
            <hd-button onClick={() => downloadRaster('image/png')} data-height="38px" data-font-size="0.82rem" style={{ flex: 1 }}>{t('pattern_generator', 'export_png_btn', 'PNG')}</hd-button>
            <hd-button onClick={() => downloadRaster('image/jpeg')} data-height="38px" data-font-size="0.82rem" style={{ flex: 1 }}>{t('pattern_generator', 'export_jpg_btn', 'JPG')}</hd-button>
          </div>
        </div>

        {/* ══ COLUMN 3: PROPERTIES & RANDOMIZER ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 100 }}>
          
          {/* RANDOMIZER */}
          <div style={{ background: 'var(--panel)', padding: 16, borderRadius: 16, border: '1px solid var(--panel-border)', minHeight: 'fit-content', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('pattern_generator', 'randomizer_title', 'Ռանդոմայզեր')}
              </h3>
              <button
                onClick={() => setShowRandomizerConfig(!showRandomizerConfig)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                {showRandomizerConfig ? '▲ Թաքցնել' : '▼ Ֆիլտրեր'}
              </button>
            </div>

            <div className={`smooth-expand ${showRandomizerConfig ? 'expanded' : ''}`} style={{ marginBottom: showRandomizerConfig ? '12px' : '0', transition: 'margin 0.35s' }}>
              <div className="smooth-expand-content" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: '4px' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <hd-checkbox data-size="15px" checked={randConstraints.allowSolid} onChange={(e: any) => setRandConstraints({...randConstraints, allowSolid: e.target.checked})} data-font-size="0.78rem">{t('randomizer', 'solid_lines_checkbox', 'Հոծ')}</hd-checkbox>
                  <hd-checkbox data-size="15px" checked={randConstraints.allowDashed} onChange={(e: any) => setRandConstraints({...randConstraints, allowDashed: e.target.checked})} data-font-size="0.78rem">{t('randomizer', 'dashed_lines_checkbox', 'Գծիկ')}</hd-checkbox>
                  <hd-checkbox data-size="15px" checked={randConstraints.allowRounded} onChange={(e: any) => setRandConstraints({...randConstraints, allowRounded: e.target.checked})} data-font-size="0.78rem">{t('randomizer', 'rounded_ends_checkbox', 'Կլոր')}</hd-checkbox>
                </div>

                <label style={{ ...labelStyle, fontSize: '0.78rem' }}>
                  {t('randomizer', 'layers_count', 'Շերտ')} ({randConstraints.minLayers}–{randConstraints.maxLayers})
                  <div style={{ display: 'flex', gap: 6, height: '24px' }}>
                    <hd-slider min="1" max="5" value={randConstraints.minLayers} onInput={(e: any) => setRandConstraints({...randConstraints, minLayers: Math.min(Number(e.target.value), randConstraints.maxLayers)})} style={{ flex: 1 }} />
                    <hd-slider min="1" max="5" value={randConstraints.maxLayers} onInput={(e: any) => setRandConstraints({...randConstraints, maxLayers: Math.max(Number(e.target.value), randConstraints.minLayers)})} style={{ flex: 1 }} />
                  </div>
                </label>
                <label style={{ ...labelStyle, fontSize: '0.78rem' }}>
                  {t('randomizer', 'thickness_range', 'Հաստ.')} ({randConstraints.minThickness}–{randConstraints.maxThickness}px)
                  <div style={{ display: 'flex', gap: 6, height: '24px' }}>
                    <hd-slider min="1" max="30" value={randConstraints.minThickness} onInput={(e: any) => setRandConstraints({...randConstraints, minThickness: Math.min(Number(e.target.value), randConstraints.maxThickness)})} style={{ flex: 1 }} />
                    <hd-slider min="1" max="30" value={randConstraints.maxThickness} onInput={(e: any) => setRandConstraints({...randConstraints, maxThickness: Math.max(Number(e.target.value), randConstraints.minThickness)})} style={{ flex: 1 }} />
                  </div>
                </label>
                <label style={{ ...labelStyle, fontSize: '0.78rem' }}>
                  {t('randomizer', 'gap_range', 'Gap')} ({randConstraints.minGap}–{randConstraints.maxGap}px)
                  <div style={{ display: 'flex', gap: 6, height: '24px' }}>
                    <hd-slider min="5" max="150" value={randConstraints.minGap} onInput={(e: any) => setRandConstraints({...randConstraints, minGap: Math.min(Number(e.target.value), randConstraints.maxGap)})} style={{ flex: 1 }} />
                    <hd-slider min="5" max="150" value={randConstraints.maxGap} onInput={(e: any) => setRandConstraints({...randConstraints, maxGap: Math.max(Number(e.target.value), randConstraints.minGap)})} style={{ flex: 1 }} />
                  </div>
                </label>

                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <hd-button onClick={() => setRandConstraints({...randConstraints, angleMode: 'discrete'})} data-height="28px" data-font-size="0.72rem" style={{ flex: 1 }}>{randConstraints.angleMode === 'discrete' && <span className="icon-Check" style={{ marginRight: 4 }} />}{t('randomizer', 'angle_mode_discrete', 'Ընտրովի')}</hd-button>
                  <hd-button onClick={() => setRandConstraints({...randConstraints, angleMode: 'range'})} data-height="28px" data-font-size="0.72rem" style={{ flex: 1 }}>{randConstraints.angleMode === 'range' && <span className="icon-Check" style={{ marginRight: 4 }} />}{t('randomizer', 'angle_mode_range', 'Միջ.')}</hd-button>
                </div>

                {randConstraints.angleMode === 'discrete' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {[0, 90, 45, -45, 30, 60, -30, -60].map(angle => {
                      const isChecked = randConstraints.selectedAngles.includes(angle);
                      return (
                        <hd-checkbox key={angle} data-size="15px" checked={isChecked} onChange={(e: any) => {
                          const updated = e.target.checked
                            ? [...randConstraints.selectedAngles, angle]
                            : randConstraints.selectedAngles.filter(a => a !== angle);
                          setRandConstraints({...randConstraints, selectedAngles: updated});
                        }} data-font-size="0.75rem">
                          {angle === 0 ? '0° Ուղ.' : angle === 90 ? '90° Հոր.' : `${angle}°`}
                        </hd-checkbox>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ ...labelStyle, fontSize: '0.78rem' }}>{t('randomizer', 'min_angle_label', 'Min')}: {randConstraints.minAngle}°<hd-slider min="-180" max="180" step="5" value={randConstraints.minAngle} onInput={(e: any) => setRandConstraints({...randConstraints, minAngle: Math.min(Number(e.target.value), randConstraints.maxAngle)})} data-height="16px" /></label>
                    <label style={{ ...labelStyle, fontSize: '0.78rem' }}>{t('randomizer', 'max_angle_label', 'Max')}: {randConstraints.maxAngle}°<hd-slider min="-180" max="-180" step="5" value={randConstraints.maxAngle} onInput={(e: any) => setRandConstraints({...randConstraints, maxAngle: Math.max(Number(e.target.value), randConstraints.minAngle)})} data-height="16px" /></label>
                  </div>
                )}

                <hd-select value={randConstraints.palette} onChange={(e: any) => setRandConstraints({...randConstraints, palette: e.target.value as any})} data-width="100%" data-height="36px">
                  <span value="all" {...(randConstraints.palette === 'all' ? {selected: true} : {})}>{t('randomizer', 'palette_all', 'Բոլ.')}</span>
                  <span value="brand" {...(randConstraints.palette === 'brand' ? {selected: true} : {})}>{t('randomizer', 'palette_brand', 'Բրենդ')}</span>
                  <span value="colorful" {...(randConstraints.palette === 'colorful' ? {selected: true} : {})}>{t('randomizer', 'palette_colorful', 'Գունավոր')}</span>
                  <span value="monochrome" {...(randConstraints.palette === 'monochrome' ? {selected: true} : {})}>{t('randomizer', 'palette_monochrome', 'Մոնո')}</span>
                  <span value="warm" {...(randConstraints.palette === 'warm' ? {selected: true} : {})}>{t('randomizer', 'palette_warm', 'Տաք')}</span>
                  <span value="cool" {...(randConstraints.palette === 'cool' ? {selected: true} : {})}>{t('randomizer', 'palette_cool', 'Սառ')}</span>
                </hd-select>
              </div>
            </div>

            <hd-button onClick={() => {
              const randomPreset = generateHarmonicRandom(showRandomizerConfig ? randConstraints : null);
              loadPreset(randomPreset.layers);
            }} data-width="100%" data-height="38px" data-font-size="0.85rem" style={{ marginTop: 'auto' }}>
              <span className="icon-Settings" style={{ marginRight: 6 }} />{t('randomizer', 'generate_random_btn', 'Ստեղծել պատահական')}
            </hd-button>
          </div>

          {/* LAYER / LINE PROPERTIES */}
          <div className={`smooth-expand ${selectedLayer ? 'expanded' : ''}`} style={{ transition: 'grid-template-rows 0.35s ease-out, opacity 0.3s ease-out' }}>
            <div className="smooth-expand-content">
              {selectedLayer && (
                <div
                  style={{
                    background: 'var(--panel)',
                    padding: 16,
                    borderRadius: 16,
                    border: selectedLineIndex === null ? `1px solid ${selectedLayer.color}44` : '1px solid #00C49F',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    minHeight: '300px',
                    transition: 'border 0.35s ease, background 0.35s ease'
                  }}
                >
                  {/* LAYER PROPERTIES WRAPPER */}
                  <div className={`smooth-expand ${selectedLineIndex === null ? 'expanded' : ''}`} style={{ transition: 'grid-template-rows 0.35s ease-out, opacity 0.3s ease-out' }}>
                    <div className="smooth-expand-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <h3 style={{ margin: 0, color: selectedLayer.color, fontSize: '0.88rem' }}>{t('pattern_generator', 'edit_layer_title', 'Խմբ. շերտ:')} {selectedLayer.name}</h3>

                      <label style={labelStyle}>
                        {t('pattern_generator', 'lines_count_label', 'Գծեր')}: {selectedLayer.lineCount}
                        <hd-slider min="1" max="100" value={selectedLayer.lineCount} onInput={(e: any) => updateLayer(selectedLayer.id, { lineCount: Number(e.target.value) })} data-height="16px" />
                      </label>
                      <label style={labelStyle}>
                        {t('pattern_generator', 'angle_label', 'Անկ.')}: {selectedLayer.angle}°
                        <hd-slider min="-180" max="180" value={selectedLayer.angle} onInput={(e: any) => updateLayer(selectedLayer.id, { angle: Number(e.target.value) })} data-height="16px" />
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <label style={labelStyle}>
                          {t('pattern_generator', 'gap_label', 'Gap')}: {selectedLayer.gap}px
                          <hd-slider min="5" max="200" value={selectedLayer.gap} onInput={(e: any) => updateLayer(selectedLayer.id, { gap: Number(e.target.value) })} data-height="16px" />
                        </label>
                        <label style={labelStyle}>
                          {t('pattern_generator', 'thickness_label', 'Հաստ.')}: {selectedLayer.thickness}px
                          <hd-slider min="1" max="50" value={selectedLayer.thickness} onInput={(e: any) => updateLayer(selectedLayer.id, { thickness: Number(e.target.value) })} data-height="16px" />
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: 12 }}>
                        <hd-checkbox data-size="15px" checked={selectedLayer.isRounded} onChange={(e: any) => updateLayer(selectedLayer.id, { isRounded: e.target.checked })} data-font-size="0.8rem">
                          {t('randomizer', 'rounded_ends_checkbox', 'Կլոր')}
                        </hd-checkbox>
                        <hd-checkbox data-size="15px" checked={selectedLayer.isDashed} onChange={(e: any) => updateLayer(selectedLayer.id, { isDashed: e.target.checked })} data-font-size="0.8rem">
                          {t('randomizer', 'dashed_lines_checkbox', 'Գծիկ')}
                        </hd-checkbox>
                      </div>

                      <div className={`smooth-expand ${selectedLayer.isDashed ? 'expanded' : ''}`}>
                        <div className="smooth-expand-content" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: '4px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <label style={labelStyle}>{t('pattern_generator', 'dash_length_1_label', 'Երկ. 1')}: {selectedLayer.dashLength}px<hd-slider min="1" max="200" value={selectedLayer.dashLength} onInput={(e: any) => updateLayer(selectedLayer.id, { dashLength: Number(e.target.value) })} data-height="16px" /></label>
                            <label style={labelStyle}>{t('pattern_generator', 'dash_gap_1_label', 'Բաց. 1')}: {selectedLayer.dashGap}px<hd-slider min="1" max="200" value={selectedLayer.dashGap} onInput={(e: any) => updateLayer(selectedLayer.id, { dashGap: Number(e.target.value) })} data-height="16px" /></label>
                            <label style={labelStyle}>{t('pattern_generator', 'dash_length_2_label', 'Երկ. 2')}: {selectedLayer.dashLength2 ?? 0}px<hd-slider min="0" max="200" value={selectedLayer.dashLength2 ?? 0} onInput={(e: any) => updateLayer(selectedLayer.id, { dashLength2: Number(e.target.value) })} data-height="16px" /></label>
                            <label style={labelStyle}>{t('pattern_generator', 'dash_gap_2_label', 'Բաց. 2')}: {selectedLayer.dashGap2 ?? 0}px<hd-slider min="0" max="200" value={selectedLayer.dashGap2 ?? 0} onInput={(e: any) => updateLayer(selectedLayer.id, { dashGap2: Number(e.target.value) })} data-height="16px" /></label>
                          </div>
                          <label style={labelStyle}>{t('pattern_generator', 'dash_offset_label', 'Offset')}: {selectedLayer.dashOffset ?? 0}px<hd-slider min="0" max="200" value={selectedLayer.dashOffset ?? 0} onInput={(e: any) => updateLayer(selectedLayer.id, { dashOffset: Number(e.target.value) })} data-height="16px" /></label>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <label style={labelStyle}>{t('pattern_generator', 'layer_x_offset_label', 'X')}: {selectedLayer.xOffset ?? 0}px<hd-slider min={-canvasWidth} max={canvasWidth} value={selectedLayer.xOffset ?? 0} onInput={(e: any) => updateLayer(selectedLayer.id, { xOffset: Number(e.target.value) })} data-height="16px" /></label>
                        <label style={labelStyle}>{t('pattern_generator', 'layer_y_offset_label', 'Y')}: {selectedLayer.yOffset ?? 0}px<hd-slider min={-canvasHeight} max={canvasHeight} value={selectedLayer.yOffset ?? 0} onInput={(e: any) => updateLayer(selectedLayer.id, { yOffset: Number(e.target.value) })} data-height="16px" /></label>
                      </div>

                      <label style={labelStyle}>
                        {t('pattern_generator', 'layer_color_label', 'Գույն')}
                        <hd-color-picker value={selectedLayer.color} onInput={(e: any) => updateLayer(selectedLayer.id, { color: e.target.value })} data-width="100%" data-height="38px" />
                      </label>
                    </div>
                  </div>

                  {/* INDIVIDUAL LINE PROPERTIES WRAPPER */}
                  <div className={`smooth-expand ${selectedLineIndex !== null ? 'expanded' : ''}`} style={{ transition: 'grid-template-rows 0.35s ease-out, opacity 0.3s ease-out' }}>
                    <div className="smooth-expand-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedLineProps && selectedLineIndex !== null && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: selectedLineProps.color, fontSize: '0.88rem' }}>
                              {t('pattern_generator', 'edit_line_title', 'Գիծ')}: {selectedLineIndex !== 0 ? `${selectedLineIndex > 0 ? '+' : ''}${selectedLineIndex}` : t('pattern_generator', 'center_line_label', 'Կենտ.')}
                            </h3>
                            <button onClick={() => setSelectedLineIndex(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.8rem' }}>{t('pattern_generator', 'close_btn', 'Փակել')}</button>
                          </div>
                          <hd-checkbox data-size="15px" checked={selectedLineProps.isLinked} onChange={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { isLinked: e.target.checked })} data-font-size="0.82rem" style={{ background: 'var(--btn-bg)', padding: '8px', borderRadius: '8px' }}>
                            <span style={{ color: selectedLineProps.isLinked ? '#00C49F' : '#888' }}>{t('pattern_generator', 'link_to_layer_label', 'Կապ շերտին')}</span>
                          </hd-checkbox>
                          <div className={`smooth-expand ${!selectedLineProps.isLinked ? 'expanded' : ''}`} style={{ marginTop: !selectedLineProps.isLinked ? '4px' : '0', transition: 'margin 0.35s' }}>
                            <div className="smooth-expand-content" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: '4px' }}>
                              <label style={labelStyle}>{t('pattern_generator', 'thickness_label', 'Հաստ.')}: {selectedLineProps.thickness}px<hd-slider min="1" max="50" value={selectedLineProps.thickness} onInput={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { thickness: Number(e.target.value) })} data-height="16px" /></label>
                              <div style={{ display: 'flex', gap: 12 }}>
                                <hd-checkbox data-size="15px" checked={selectedLineProps.isRounded} onChange={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { isRounded: e.target.checked })} data-font-size="0.8rem">{t('randomizer', 'rounded_ends_checkbox', 'Կլոր')}</hd-checkbox>
                                <hd-checkbox data-size="15px" checked={selectedLineProps.isDashed} onChange={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { isDashed: e.target.checked })} data-font-size="0.8rem">{t('randomizer', 'dashed_lines_checkbox', 'Գծիկ')}</hd-checkbox>
                              </div>
                              
                              <div className={`smooth-expand ${selectedLineProps.isDashed ? 'expanded' : ''}`} style={{ marginTop: selectedLineProps.isDashed ? '4px' : '0', transition: 'margin 0.35s' }}>
                                <div className="smooth-expand-content" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: '4px' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <label style={labelStyle}>{t('pattern_generator', 'dash_length_1_label', 'Երկ.1')}: {selectedLineProps.dashLength}px<hd-slider min="1" max="200" value={selectedLineProps.dashLength} onInput={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { dashLength: Number(e.target.value) })} data-height="16px" /></label>
                                    <label style={labelStyle}>{t('pattern_generator', 'dash_gap_1_label', 'Բաց.1')}: {selectedLineProps.dashGap}px<hd-slider min="1" max="200" value={selectedLineProps.dashGap} onInput={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { dashGap: Number(e.target.value) })} data-height="16px" /></label>
                                    <label style={labelStyle}>{t('pattern_generator', 'dash_length_2_label', 'Երկ.2')}: {selectedLineProps.dashLength2 ?? 0}px<hd-slider min="0" max="200" value={selectedLineProps.dashLength2 ?? 0} onInput={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { dashLength2: Number(e.target.value) })} data-height="16px" /></label>
                                    <label style={labelStyle}>{t('pattern_generator', 'dash_gap_2_label', 'Բաց.2')}: {selectedLineProps.dashGap2 ?? 0}px<hd-slider min="0" max="200" value={selectedLineProps.dashGap2 ?? 0} onInput={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { dashGap2: Number(e.target.value) })} data-height="16px" /></label>
                                  </div>
                                  <label style={labelStyle}>{t('pattern_generator', 'dash_offset_label', 'Offset')}: {selectedLineProps.dashOffset ?? 0}px<hd-slider min="0" max="200" value={selectedLineProps.dashOffset ?? 0} onInput={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { dashOffset: Number(e.target.value) })} data-height="16px" /></label>
                                </div>
                              </div>

                              <label style={labelStyle}>
                                {t('pattern_generator', 'layer_color_label', 'Գույն')}
                                <hd-color-picker value={selectedLineProps.color} onInput={(e: any) => updateLine(selectedLayer.id, selectedLineIndex, { color: e.target.value })} data-width="100%" data-height="38px" />
                              </label>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ══ COLUMN 4: LAYERS (VERY RIGHT) ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 100 }}>
          
          {/* LAYERS */}
          <div style={{ background: 'var(--panel)', padding: 16, borderRadius: 16, border: '1px solid var(--panel-border)', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('pattern_generator', 'layers_title', 'Շերտեր')}</h3>
              <hd-button onClick={addLayer} data-height="28px" data-font-size="0.75rem" data-padding="0 10px">
                <span className="icon-Plus" style={{ marginRight: 4 }} />{t('pattern_generator', 'add_layer_btn', 'Շերտ')}
              </hd-button>
            </div>
            <hd-scrollbar style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, maxHeight: 370, overflowY: 'auto' }}>
              {layers.map(layer => (
                <div
                  key={layer.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: selectedLayerId === layer.id ? 'var(--btn-hover-bg)' : 'transparent',
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: selectedLayerId === layer.id ? `1px solid ${layer.color}44` : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => { setSelectedLayerId(layer.id); setSelectedLineIndex(null); }}
                  onContextMenu={(e) => handleLayerContextMenu(e, layer.id, layer.name)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleLayerExpand(layer.id); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '1px 4px', fontSize: '0.7rem', flexShrink: 0 }}>
                        {expandedLayerIds[layer.id] ? (
                          <span className="icon-Chevrolt-Arrow-Right" style={{ display: 'inline-block', transform: 'rotate(90deg)', fontSize: '0.65rem' }} />
                        ) : (
                          <span className="icon-Chevrolt-Arrow-Right" style={{ display: 'inline-block', fontSize: '0.65rem' }} />
                        )}
                      </button>
                      {renamingLayerId === layer.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }} onClick={e => e.stopPropagation()}>
                          <hd-input value={renamingLayerName} onInput={(e: any) => setRenamingLayerName(e.target.value)} data-height="28px" data-font-size="0.78rem" style={{ flex: 1 }} autoFocus onKeyDown={(e: any) => { if (e.key === 'Enter') finishRenameLayer(layer.id); if (e.key === 'Escape') setRenamingLayerId(null); }} />
                          <button type="button" onClick={() => finishRenameLayer(layer.id)} style={{ background: 'none', border: 'none', color: '#00C49F', cursor: 'pointer', padding: '0 3px' }}><span className="icon-Check" /></button>
                          <button type="button" onClick={() => setRenamingLayerId(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0 3px' }}><span className="icon-Close" /></button>
                        </div>
                      ) : (
                        <span style={{ fontWeight: selectedLayerId === layer.id ? 'bold' : 'normal', color: selectedLayerId === layer.id ? layer.color : 'var(--muted)', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {layer.name} ({layer.lineCount})
                        </span>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', marginLeft: 4, flexShrink: 0, fontSize: '0.82rem' }}><span className="icon-Close" /></button>
                  </div>

                  <div className={`smooth-expand ${expandedLayerIds[layer.id] ? 'expanded' : ''}`} style={{ marginTop: expandedLayerIds[layer.id] ? '6px' : '0', transition: 'margin 0.35s' }}>
                    <div className="smooth-expand-content" onClick={(e: any) => e.stopPropagation()}>
                      <hd-scrollbar style={{ marginLeft: 14, display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 120, overflowY: 'auto', paddingLeft: 8, borderLeft: '1px solid #444' }}>
                        {Array.from({ length: layer.lineCount }, (_, idx) => {
                          const startIdx = -Math.floor((layer.lineCount - 1) / 2);
                          const lineIdx = startIdx + idx;
                          const override = layer.overrides[lineIdx];
                          const isLinked = override ? override.isLinked : true;
                          const isSelected = selectedLayerId === layer.id && selectedLineIndex === lineIdx;
                          return (
                            <div key={lineIdx} onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); setSelectedLineIndex(lineIdx); }} style={{ fontSize: '0.75rem', padding: '3px 6px', borderRadius: 4, background: isSelected ? 'rgba(0,196,159,0.2)' : 'transparent', color: isSelected ? '#00C49F' : (isLinked ? '#888' : '#FFBB28'), cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Գիծ {idx + 1}</span>
                              <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{isLinked ? <span className="icon-Attech" /> : <span className="icon-Pencil" />}</span>
                            </div>
                          );
                        })}
                      </hd-scrollbar>
                    </div>
                  </div>
                </div>
              ))}
            </hd-scrollbar>
          </div>
        </div>
      </div>

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: 'var(--panel)', border: '1px solid var(--panel-border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0', zIndex: 1000, minWidth: 150, fontSize: '0.85rem' }}
          onClick={e => e.stopPropagation()}
        >
          <div onClick={() => { startRenameLayer(contextMenu.layerId, contextMenu.layerName); setContextMenu(null); }} style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }} className="context-menu-item"><span className="icon-Pencil" style={{ display: 'inline-block' }} /> {t('context_menu', 'rename', 'Վերանվ.')}</div>
          <div onClick={() => { duplicateLayer(contextMenu.layerId); setContextMenu(null); }} style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }} className="context-menu-item"><span className="icon-Plus" style={{ display: 'inline-block' }} /> {t('context_menu', 'duplicate', 'Կրկնօրինակ')}</div>
          <div onClick={() => { bringToFront(contextMenu.layerId); setContextMenu(null); }} style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }} className="context-menu-item"><span className="icon-Arrow-Up" style={{ display: 'inline-block' }} /> {t('context_menu', 'bring_to_front', 'Front')}</div>
          <div onClick={() => { sendToBack(contextMenu.layerId); setContextMenu(null); }} style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }} className="context-menu-item"><span className="icon-Arrow-Up" style={{ display: 'inline-block', transform: 'rotate(180deg)' }} /> {t('context_menu', 'send_to_back', 'Back')}</div>
          <div onClick={() => { deleteLayer(contextMenu.layerId); setContextMenu(null); }} style={{ padding: '8px 12px', cursor: 'pointer', color: '#ff6b6b', borderTop: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '8px' }} className="context-menu-item"><span className="icon-Trash" style={{ display: 'inline-block' }} /> {t('context_menu', 'delete', 'Ջնջ.')}</div>
        </div>
      )}
    </div>
  );
}
const btnStyle = (bg: string) => ({
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  background: bg,
  color: bg === '#ffffff' ? '#000' : '#fff',
  cursor: 'pointer',
  fontWeight: 'bold',
  whiteSpace: 'nowrap' as const
});

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  fontSize: '0.8rem',
  color: '#ccc',
  margin: '4px 0',
};
