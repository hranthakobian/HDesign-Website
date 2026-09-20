"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MediaFolder, MediaFile, MediaFileType } from '@/lib/mediaTypes';
import { 
  getCachedMedia, 
  subscribeToMediaCache, 
  fetchMediaLibraryCached, 
  updateMediaCacheOptimistic 
} from '@/lib/mediaCache';

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: string | string[]) => void;
  multiple?: boolean;
  allowedTypes?: MediaFileType[];
  title?: string;
  token: string | null;
  currentValue?: string | string[];
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  allowedTypes,
  title = 'Ընտրել Մեդիա Նիշք',
  token,
  currentValue
}: MediaPickerModalProps) {
  const [files, setFiles] = useState<MediaFile[]>(() => getCachedMedia()?.files || []);
  const [folders, setFolders] = useState<MediaFolder[]>(() => getCachedMedia()?.folders || []);
  const [loading, setLoading] = useState(() => !getCachedMedia());
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  // Folder navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | MediaFileType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selection
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [lastSelectedUrl, setLastSelectedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadText, setUploadText] = useState('');

  // External URL tab state
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library');
  const [customUrlInput, setCustomUrlInput] = useState('');

  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsClosing(false);
        setShouldRender(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, isClosing]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 240);
  }, [isClosing, onClose]);

  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shouldRender, handleClose]);

  // Subscribe to media cache updates
  useEffect(() => {
    const unsubscribe = subscribeToMediaCache((cached) => {
      setFiles(cached.files);
      setFolders(cached.folders);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load initial values
  useEffect(() => {
    if (isOpen) {
      if (currentValue) {
        if (Array.isArray(currentValue)) {
          setSelectedUrls(currentValue);
        } else if (typeof currentValue === 'string' && currentValue.trim()) {
          setSelectedUrls([currentValue.trim()]);
          setCustomUrlInput(currentValue.trim());
        }
      } else {
        setSelectedUrls([]);
      }
    }
  }, [isOpen, currentValue]);

  // Fetch media library
  const loadMedia = useCallback(async (force = false) => {
    const cached = getCachedMedia();
    if (!cached) {
      setLoading(true);
    } else {
      setFiles(cached.files);
      setFolders(cached.folders);
      setLoading(false);
    }
    setError(null);
    try {
      const data = await fetchMediaLibraryCached(token, force);
      setFiles(data.files || []);
      setFolders(data.folders || []);
    } catch (err: any) {
      if (!getCachedMedia()) {
        setError(err.message || 'Սխալ մեդիան բեռնելիս');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      loadMedia(false);
    }
  }, [isOpen, loadMedia]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // Allowed types filter (e.g. only images or only fonts if specified)
      if (allowedTypes && allowedTypes.length > 0) {
        if (!allowedTypes.includes(file.type)) return false;
      }

      // Specific tab filter
      if (activeTypeTab !== 'all' && file.type !== activeTypeTab) return false;

      // Search or Folder
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = file.name.toLowerCase().includes(q);
        const matchExt = file.extension.toLowerCase().includes(q);
        if (!matchName && !matchExt) return false;
      } else {
        if (file.folderId !== currentFolderId) return false;
      }

      return true;
    });
  }, [files, currentFolderId, searchQuery, activeTypeTab, allowedTypes]);

  // Current Subfolders
  const currentSubfolders = useMemo(() => {
    if (searchQuery.trim()) return [];
    return folders.filter(f => f.parentId === currentFolderId);
  }, [folders, currentFolderId, searchQuery]);

  // Breadcrumbs
  const folderMap = useMemo(() => {
    const map = new Map<string, MediaFolder>();
    folders.forEach(f => map.set(f.id, f));
    return map;
  }, [folders]);

  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ id: string | null; name: string; color?: string }> = [
      { id: null, name: 'Գլխավոր (Root)' }
    ];
    if (!currentFolderId) return crumbs;

    const trail: Array<{ id: string; name: string; color: string }> = [];
    let curr: MediaFolder | undefined = folderMap.get(currentFolderId);
    while (curr) {
      trail.unshift({ id: curr.id, name: curr.name, color: curr.color });
      curr = curr.parentId ? folderMap.get(curr.parentId) : undefined;
    }
    return [...crumbs, ...trail];
  }, [currentFolderId, folderMap]);

  // Handle file click selection with Shift and Ctrl support
  const handleToggleSelect = (url: string, e?: React.MouseEvent) => {
    if (multiple) {
      if (e?.shiftKey && lastSelectedUrl) {
        e.preventDefault();
        const currentIdx = filteredFiles.findIndex(f => f.url === url);
        const lastIdx = filteredFiles.findIndex(f => f.url === lastSelectedUrl);
        if (currentIdx !== -1 && lastIdx !== -1) {
          const minIdx = Math.min(lastIdx, currentIdx);
          const maxIdx = Math.max(lastIdx, currentIdx);
          const rangeUrls = filteredFiles.slice(minIdx, maxIdx + 1).map(f => f.url);
          setSelectedUrls(prev => {
            if (e.ctrlKey || e.metaKey) {
              const set = new Set([...prev, ...rangeUrls]);
              return Array.from(set);
            }
            return rangeUrls;
          });
          return;
        }
      }

      setSelectedUrls(prev => {
        if (prev.includes(url)) {
          return prev.filter(u => u !== url);
        } else {
          return [...prev, url];
        }
      });
      setLastSelectedUrl(url);
    } else {
      setSelectedUrls([url]);
      setLastSelectedUrl(url);
    }
  };

  const handleConfirmSelect = () => {
    if (activeTab === 'url') {
      if (!customUrlInput.trim()) return;
      onSelect(multiple ? [customUrlInput.trim()] : customUrlInput.trim());
      handleClose();
      return;
    }

    if (selectedUrls.length === 0) return;
    if (multiple) {
      onSelect(selectedUrls);
    } else {
      onSelect(selectedUrls[0]);
    }
    handleClose();
  };

  // Upload new file directly inside picker modal
  const handleUploadNewFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesToUpload = e.target.files;
    if (!filesToUpload || filesToUpload.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadText(`Վերբեռնվում է (${i + 1}/${filesToUpload.length}): ${file.name}`);

      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      try {
        const res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: { Authorization: token || '' },
          body: formData
        });
        const data = await res.json();
        if (data.success && data.file) {
          setFiles(prev => [data.file, ...prev]);
          updateMediaCacheOptimistic(prev => ({
            ...prev,
            files: [data.file, ...(prev?.files || [])],
            timestamp: Date.now()
          }));
          newUrls.push(data.file.url);
        }
      } catch (err) {
        console.error('Upload error in picker:', err);
      }
    }

    setIsUploading(false);
    setUploadText('');

    if (newUrls.length > 0) {
      if (multiple) {
        setSelectedUrls(prev => [...prev, ...newUrls]);
      } else {
        setSelectedUrls([newUrls[0]]);
      }
      setActiveTab('library');
    }
  };

  // Render thumbnail
  const renderThumbnail = (file: MediaFile) => {
    if (file.type === 'image' || file.type === 'vector') {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090a0f', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.url} alt={file.name} loading="lazy" decoding="async" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      );
    }
    if (file.type === 'video') {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e1b4b', color: '#818cf8' }}>
          <span style={{ fontSize: '1.4rem' }}>🎬</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>VIDEO</span>
        </div>
      );
    }
    if (file.type === 'font') {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#064e3b', color: '#34d399' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'serif' }}>Aa</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{file.extension.toUpperCase()}</span>
        </div>
      );
    }
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--panel)', color: 'var(--muted)' }}>
        <span style={{ fontSize: '1.4rem' }}>📄</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{file.extension.toUpperCase()}</span>
      </div>
    );
  };

  if (!shouldRender) return null;

  const modalContent = (
    <div
      className={`hd-modal-backdrop ${isClosing ? "closing" : ""}`}
      data-modal-backdrop="true"
      data-closing={isClosing ? "true" : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000005,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '20px',
        boxSizing: 'border-box'
      }}
      onClick={handleClose}
    >
      <div
        className={`hd-modal-container ${isClosing ? "closing" : ""}`}
        data-modal-container="true"
        data-closing={isClosing ? "true" : undefined}
        style={{
          background: 'var(--panel)',
          border: isFullscreen ? 'none' : '1px solid var(--panel-border)',
          borderRadius: isFullscreen ? '0' : '20px',
          width: isFullscreen ? '100vw' : 'min(1150px, 96vw)',
          height: isFullscreen ? '100vh' : 'min(840px, 90vh)',
          maxWidth: isFullscreen ? '100vw' : '1200px',
          maxHeight: isFullscreen ? '100vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isFullscreen ? 'none' : '0 24px 70px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          willChange: 'transform, opacity'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Invisible file input */}
        <input
          type="file"
          ref={uploadInputRef}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleUploadNewFile}
        />

        {/* MODAL HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--panel-border)',
            background: 'var(--bg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>🖼️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--fg)' }}>
                {title}
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                {multiple ? 'Կարող եք ընտրել մի քանի նիշք' : 'Ընտրեք նիշք գրադարանից կամ վերբեռնեք նորը'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Main Tab Switcher */}
            <div
              style={{
                display: 'flex',
                background: 'var(--panel)',
                border: '1px solid var(--panel-border)',
                borderRadius: '10px',
                padding: '2px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                style={{
                  background: activeTab === 'library' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'library' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Գրադարան
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                style={{
                  background: 'transparent',
                  color: 'var(--fg)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>↑</span>
                <span>Վերբեռնել</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                style={{
                  background: activeTab === 'url' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'url' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Հղում (URL)
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(p => !p)}
              title={isFullscreen ? "Կրճատել չափսը" : "Ամբողջ էկրանով"}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--fg)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="hd-icon icon-Expand" style={{ fontSize: '13px' }} />
              <span>{isFullscreen ? "Պատուհան" : "Ամբողջ էկրան"}</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        {activeTab === 'url' ? (
          <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>
              Մուտքագրեք մեդիայի արտաքին հղումը (URL)
            </label>
            <input
              type="text"
              autoFocus
              value={customUrlInput}
              onChange={e => setCustomUrlInput(e.target.value)}
              placeholder="https://example.com/image.png կամ /branding/eleven.png"
              style={{
                width: '100%',
                height: '44px',
                background: 'var(--bg)',
                border: '1px solid var(--panel-border)',
                borderRadius: '10px',
                padding: '0 12px',
                color: 'var(--fg)',
                fontSize: '0.9rem',
                fontFamily: 'monospace'
              }}
            />
            {customUrlInput.trim() && (
              <div style={{ marginTop: '10px', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '16px', textAlign: 'center', maxHeight: '200px', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px' }}>Նախադիտում</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={customUrlInput} alt="Preview" style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain' }} onError={(e: any) => { e.target.style.display = 'none'; }} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Left Folder Tree in Modal */}
            <div
              style={{
                background: 'var(--bg)',
                borderRight: '1px solid var(--panel-border)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                overflowY: 'auto'
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px', paddingLeft: '6px' }}>
                Պանակներ
              </div>

              {/* Root item */}
              <div
                onClick={() => setCurrentFolderId(null)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: currentFolderId === null ? 700 : 500,
                  background: currentFolderId === null ? 'var(--accent)' : 'transparent',
                  color: currentFolderId === null ? '#ffffff' : 'var(--fg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🖥️</span>
                <span>Գլխավոր (Root)</span>
              </div>

              {folders.map(f => {
                const isSelected = currentFolderId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setCurrentFolderId(f.id)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected ? 'var(--accent)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--fg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.color || '#3B82F6' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right Main Grid in Modal */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              {/* Toolbar in Modal */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--panel-border)',
                  background: 'var(--panel)',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.id || 'root'}>
                      {idx > 0 && <span style={{ color: 'var(--muted)' }}>›</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentFolderId(crumb.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: idx === breadcrumbs.length - 1 ? '#3B82F6' : 'var(--muted)',
                          fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500,
                          cursor: 'pointer',
                          padding: '2px 4px',
                          fontSize: '0.8rem'
                        }}
                      >
                        {crumb.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                {/* Type Filter Tabs */}
                {(!allowedTypes || allowedTypes.length > 1) && (
                  <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', maxWidth: '100%' }}>
                    {[
                      { id: 'all' as const, label: 'Բոլորը' },
                      { id: 'image' as const, label: 'Նկարներ' },
                      { id: 'vector' as const, label: 'Վեկտորներ' },
                      { id: 'video' as const, label: 'Վիդեոներ' },
                      { id: 'font' as const, label: 'Տառատեսակներ' },
                      { id: 'document' as const, label: 'Փաստաթղթեր' },
                    ].filter(tab => tab.id === 'all' || !allowedTypes || allowedTypes.includes(tab.id as MediaFileType)).map(tab => {
                      const isActive = activeTypeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTypeTab(tab.id)}
                          style={{
                            background: isActive ? 'var(--accent)' : 'transparent',
                            color: isActive ? '#ffffff' : 'var(--muted)',
                            border: `1px solid ${isActive ? 'transparent' : 'var(--panel-border)'}`,
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: isActive ? 700 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Search & View Mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="🔍 Որոնել..."
                    style={{
                      height: '32px',
                      background: 'var(--bg)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: 'var(--fg)',
                      fontSize: '0.8rem',
                      width: '160px'
                    }}
                  />

                  <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--panel-border)', borderRadius: '6px', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      style={{
                        background: viewMode === 'grid' ? 'var(--accent)' : 'transparent',
                        color: viewMode === 'grid' ? '#ffffff' : 'var(--muted)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      ⊞
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      style={{
                        background: viewMode === 'list' ? 'var(--accent)' : 'transparent',
                        color: viewMode === 'list' ? '#ffffff' : 'var(--muted)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      ☰
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Progress banner if uploading */}
              {isUploading && (
                <div style={{ background: '#3B82F6', color: '#ffffff', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  <span>{uploadText}</span>
                </div>
              )}

              {/* Files Area in Modal */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    Բեռնվում են նիշքերը...
                  </div>
                ) : filteredFiles.length === 0 && currentSubfolders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
                    <div>Նիշքեր չեն գտնվել</div>
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      style={{
                        marginTop: '12px',
                        background: 'var(--accent)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ↑ Վերբեռնել նոր նիշք
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Subfolders if any */}
                    {currentSubfolders.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                        {currentSubfolders.map(subf => (
                          <div
                            key={subf.id}
                            onClick={() => setCurrentFolderId(subf.id)}
                            style={{
                              background: 'var(--bg)',
                              border: '1px solid var(--panel-border)',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}
                          >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: subf.color || '#3B82F6' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {subf.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Files Grid Mode */}
                    {viewMode === 'grid' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                        {filteredFiles.map(file => {
                          const isSelected = selectedUrls.includes(file.url);
                          return (
                            <div
                              key={file.id}
                              onClick={e => handleToggleSelect(file.url, e)}
                              onDoubleClick={() => {
                                if (!multiple) {
                                  onSelect(file.url);
                                  onClose();
                                }
                              }}
                              style={{
                                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg)',
                                border: `2px solid ${isSelected ? '#3B82F6' : 'var(--panel-border)'}`,
                                borderRadius: '10px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {/* Selection Badge */}
                              {isSelected && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '6px',
                                    left: '6px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#3B82F6',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    zIndex: 2
                                  }}
                                >
                                  ✓
                                </div>
                              )}

                              <div style={{ height: '90px', width: '100%' }}>
                                {renderThumbnail(file)}
                              </div>

                              <div style={{ padding: '6px 8px' }}>
                                <div style={{ fontSize: '0.74rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
                                  {file.name}
                                </div>
                                <div style={{ fontSize: '0.66rem', color: 'var(--muted)', marginTop: '2px' }}>
                                  {file.sizeFormatted}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Files List Mode */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {filteredFiles.map(file => {
                          const isSelected = selectedUrls.includes(file.url);
                          return (
                            <div
                              key={file.id}
                              onClick={e => handleToggleSelect(file.url, e)}
                              onDoubleClick={() => {
                                if (!multiple) {
                                  onSelect(file.url);
                                  onClose();
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 10px',
                                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg)',
                                border: `1px solid ${isSelected ? '#3B82F6' : 'var(--panel-border)'}`,
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                  {renderThumbnail(file)}
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.name}
                                </div>
                              </div>

                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0 }}>
                                {file.sizeFormatted}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid var(--panel-border)',
            background: 'var(--bg)'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {selectedUrls.length > 0 ? (
              <span>Ընտրված է՝ <strong>{selectedUrls.length}</strong> նիշք</span>
            ) : (
              <span>Նիշք ընտրված չէ</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'var(--panel)',
                color: 'var(--fg)',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Չեղարկել
            </button>

            <button
              type="button"
              disabled={activeTab === 'url' ? !customUrlInput.trim() : selectedUrls.length === 0}
              onClick={handleConfirmSelect}
              style={{
                background: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 22px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: (activeTab === 'url' ? !customUrlInput.trim() : selectedUrls.length === 0) ? 'default' : 'pointer',
                opacity: (activeTab === 'url' ? !customUrlInput.trim() : selectedUrls.length === 0) ? 0.4 : 1,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              Ընտրել Նիշքը
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
