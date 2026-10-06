"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MediaFolder, MediaFile, MediaFileType } from '@/lib/mediaTypes';
import FolderIcon from '@/components/FolderIcon';
import { 
  getCachedMedia, 
  subscribeToMediaCache, 
  fetchMediaLibraryCached, 
  updateMediaCacheOptimistic,
  resolveAdminToken
} from '@/lib/mediaCache';
import { uploadFileWithProgress, UploadProgressState, formatBytes } from '@/lib/mediaUpload';
import UploadProgressOverlay from '@/components/UploadProgressOverlay';

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

// Horizontal marquee scrolling on hover for folder names (վազող տող)
const FolderMarqueeText: React.FC<{
  text: string;
  isSelected?: boolean;
  color?: string;
}> = ({ text, isSelected, color }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [overflowDistance, setOverflowDistance] = useState(0);

  const measure = useCallback(() => {
    if (containerRef.current && textRef.current) {
      const diff = textRef.current.scrollWidth - containerRef.current.clientWidth;
      setOverflowDistance(diff > 3 ? diff : 0);
    }
  }, []);

  const handleMouseEnter = () => {
    measure();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const active = isHovered && overflowDistance > 0;
  const duration = Math.max(3, (overflowDistance / 24) + 1.2);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="folder-name-marquee-container"
      style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: active ? 'clip' : 'ellipsis',
        flex: 1,
        minWidth: 0,
        position: 'relative'
      }}
      title={text}
    >
      <span
        ref={textRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          color: color || 'inherit',
          fontWeight: isSelected ? 600 : 400,
          willChange: overflowDistance > 0 ? 'transform' : 'auto',
          ...(active
            ? ({
                animation: `folderMarqueeScroll ${duration}s ease-in-out infinite alternate`,
                '--overflow-dist': `${overflowDistance + 6}px`
              } as React.CSSProperties)
            : {
                transform: 'translateX(0)',
                transition: 'transform 0.2s ease'
              })
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  allowedTypes,
  title = 'Ընտրել Նիշք Դարանից',
  token,
  currentValue
}: MediaPickerModalProps) {
  const [files, setFiles] = useState<MediaFile[]>(() => getCachedMedia()?.files || []);
  const [folders, setFolders] = useState<MediaFolder[]>(() => getCachedMedia()?.folders || []);
  const [loading, setLoading] = useState(() => !getCachedMedia());
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  // Folder navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderOpenMode, setFolderOpenMode] = useState<'double' | 'single'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hdesign_media_folder_open_mode');
        if (saved === 'single' || saved === 'double') return saved;
      } catch (e) {}
    }
    return 'double';
  });

  const toggleFolderOpenMode = () => {
    const next = folderOpenMode === 'double' ? 'single' : 'double';
    setFolderOpenMode(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hdesign_media_folder_open_mode', next);
      } catch (e) {}
    }
  };

  useEffect(() => {
    setSelectedFolderId(null);
  }, [currentFolderId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | MediaFileType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selection
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [lastSelectedUrl, setLastSelectedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);

  // Folder creation in modal
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Drag & drop over modal and folders
  const [isDraggingOverModal, setIsDraggingOverModal] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Folder tree expansion state (expanded folder IDs)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());

  // Tooltip state for folder hover count & size (with downward arrow)
  const [folderTooltip, setFolderTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // External URL tab state
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library');
  const [customUrlInput, setCustomUrlInput] = useState('');

  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  useEffect(() => {
    if (!isRendered || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && selectedFolderId) {
        setCurrentFolderId(selectedFolderId);
        setSelectedFolderId(null);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRendered, isClosing, onClose, selectedFolderId]);

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
        setError(err.message || 'Սխալ դարանը բեռնելիս');
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
      } else if (currentFolderId === 'gallery') {
        if (file.isTrashed) return false;
      } else {
        if (file.folderId !== currentFolderId) return false;
      }

      return true;
    });
  }, [files, currentFolderId, searchQuery, activeTypeTab, allowedTypes]);

  // Current Subfolders
  const currentSubfolders = useMemo(() => {
    if (searchQuery.trim() || currentFolderId === 'gallery') return [];
    return folders.filter(f => f.parentId === currentFolderId);
  }, [folders, currentFolderId, searchQuery]);

  // Breadcrumbs
  const folderMap = useMemo(() => {
    const map = new Map<string, MediaFolder>();
    folders.forEach(f => map.set(f.id, f));
    return map;
  }, [folders]);

  const breadcrumbs = useMemo(() => {
    if (currentFolderId === 'gallery') {
      return [
        { id: null, name: 'Գլխավոր (Root)' },
        { id: 'gallery', name: 'Պատկերասրահ (Gallery)', color: '#8B5CF6' }
      ];
    }
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

  interface FolderStats {
    count: number;
    size: number;
    sizeFormatted: string;
  }

  // Folder item count & total weight helper (including recursive subfolders)
  const folderStats = useMemo(() => {
    const statsMap = new Map<string, FolderStats>();

    // Map each folder to all its descendant folder IDs (including itself)
    const descendantsMap = new Map<string, Set<string>>();
    folders.forEach(f => {
      descendantsMap.set(f.id, new Set<string>([f.id]));
    });

    let changed = true;
    while (changed) {
      changed = false;
      for (const f of folders) {
        if (f.parentId && descendantsMap.has(f.parentId)) {
          const parentDesc = descendantsMap.get(f.parentId)!;
          const selfDesc = descendantsMap.get(f.id)!;
          for (const d of selfDesc) {
            if (!parentDesc.has(d)) {
              parentDesc.add(d);
              changed = true;
            }
          }
        }
      }
    }

    folders.forEach(f => {
      const descendants = descendantsMap.get(f.id) || new Set([f.id]);
      let count = 0;
      let size = 0;
      files.forEach(file => {
        if (!file.isTrashed && file.folderId && descendants.has(file.folderId)) {
          count++;
          size += (file.size || 0);
        }
      });
      statsMap.set(f.id, {
        count,
        size,
        sizeFormatted: formatBytes(size)
      });
    });

    return statsMap;
  }, [folders, files]);

  // Auto-expand tree folders when current folder changes
  useEffect(() => {
    if (currentFolderId && folderMap.has(currentFolderId)) {
      const toExpand = new Set<string>();
      let curr = folderMap.get(currentFolderId);
      while (curr?.parentId) {
        toExpand.add(curr.parentId);
        curr = folderMap.get(curr.parentId);
      }
      if (toExpand.size > 0) {
        setExpandedFolderIds(prev => {
          let changed = false;
          const next = new Set(prev);
          toExpand.forEach(id => {
            if (!next.has(id)) {
              next.add(id);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
    }
  }, [currentFolderId, folderMap]);

  const toggleTreeFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const showTooltipFor = (count: number, sizeFormatted: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFolderTooltip({
      text: `${count} նիշք • ${sizeFormatted}`,
      x: rect.left + rect.width / 2,
      y: rect.top - 6
    });
  };

  const hideTooltip = () => {
    setFolderTooltip(null);
  };

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
      onClose();
      return;
    }

    if (selectedUrls.length === 0) return;
    if (multiple) {
      onSelect(selectedUrls);
    } else {
      onSelect(selectedUrls[0]);
    }
    onClose();
  };

  // Create folder inside picker modal
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const authToken = resolveAdminToken(token);
      const res = await fetch('/api/admin/media/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: newFolderColor,
          parentId: currentFolderId === 'gallery' ? null : currentFolderId
        })
      });
      const data = await res.json();
      if (data.success && data.folder) {
        setFolders(prev => [...prev, data.folder]);
        updateMediaCacheOptimistic(prev => ({
          ...prev,
          folders: [...(prev?.folders || []), data.folder],
          timestamp: Date.now()
        }));
        setCurrentFolderId(data.folder.id);
        setIsNewFolderModalOpen(false);
        setNewFolderName('');
      } else {
        alert(data.error || 'Չհաջողվեց ստեղծել պանակը');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ պանակը ստեղծելիս');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Upload files with real-time percentage progress and animation
  const handleUploadFiles = async (filesToUpload: FileList | File[], targetFolderOverride?: string | null) => {
    const filesArray = Array.from(filesToUpload);
    if (filesArray.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];
    const authToken = resolveAdminToken(token);
    const targetFolder = targetFolderOverride !== undefined 
      ? targetFolderOverride 
      : (currentFolderId === 'gallery' ? null : currentFolderId);

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setUploadProgress({
          fileIndex: i,
          totalFiles: filesArray.length,
          fileName: file.name,
          fileSize: file.size,
          percent: 0,
          loadedBytes: 0,
          totalBytes: file.size
        });

        const res = await uploadFileWithProgress(
          file,
          targetFolder,
          authToken,
          (progress) => setUploadProgress(progress),
          i,
          filesArray.length
        );

        if (res.success && res.file) {
          const uploadedFile = res.file;
          setFiles(prev => [uploadedFile, ...prev]);
          updateMediaCacheOptimistic(prev => ({
            ...prev,
            files: [uploadedFile, ...(prev?.files || [])],
            timestamp: Date.now()
          }));
          newUrls.push(uploadedFile.url);
        } else {
          console.error('Upload failed for', file.name, res.error);
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }

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
          <span className="hd-icon icon-Play" style={{ fontSize: '1.4rem' }} />
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
        <span className="hd-icon icon-Info" style={{ fontSize: '1.4rem' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{file.extension.toUpperCase()}</span>
      </div>
    );
  };

  // Render hierarchical folder tree node recursively for sidebar
  const renderFolderTreeNode = (folder: MediaFolder, depth = 0) => {
    const subfolders = folders.filter(f => f.parentId === folder.id);
    const hasChildren = subfolders.length > 0;
    const isExpanded = expandedFolderIds.has(folder.id);
    const isSelected = currentFolderId === folder.id;
    const isDragTarget = dragOverFolderId === folder.id;
    const stat = folderStats.get(folder.id) || { count: 0, size: 0, sizeFormatted: '0 B' };

    return (
      <div key={folder.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          onClick={() => setCurrentFolderId(folder.id)}
          onMouseEnter={e => showTooltipFor(stat.count, stat.sizeFormatted, e)}
          onMouseLeave={hideTooltip}
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragEnter={e => {
            e.preventDefault();
            setDragOverFolderId(folder.id);
          }}
          onDragLeave={e => {
            e.preventDefault();
            if (dragOverFolderId === folder.id) setDragOverFolderId(null);
          }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverFolderId(null);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleUploadFiles(e.dataTransfer.files, folder.id);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '5px',
            padding: '5px 8px 5px 4px',
            borderRadius: '7px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: isSelected ? 600 : 400,
            background: isSelected
              ? 'var(--accent)'
              : isDragTarget
              ? 'rgba(59, 130, 246, 0.25)'
              : 'transparent',
            color: isSelected ? '#ffffff' : 'var(--fg)',
            border: isDragTarget ? '1px dashed #3B82F6' : '1px solid transparent',
            transition: 'background 0.15s ease, color 0.15s ease',
            userSelect: 'none',
            position: 'relative'
          }}
        >
          {/* Arrow toggle for subfolders */}
          {hasChildren ? (
            <span
              onClick={e => toggleTreeFolder(folder.id, e)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '14px',
                height: '14px',
                cursor: 'pointer',
                color: isSelected ? '#ffffff' : 'var(--muted)',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.15s ease',
                flexShrink: 0
              }}
              title={isExpanded ? 'Ծալել' : 'Բացել'}
            >
              <span className="hd-icon icon-Chevrolt-Arrow-Bottom" style={{ fontSize: '0.62rem' }} />
            </span>
          ) : (
            <span style={{ width: depth > 0 ? '2px' : '14px', display: 'inline-block', flexShrink: 0 }} />
          )}

          {/* Folder Icon tinted with custom color */}
          <FolderIcon
            size={16}
            color={isSelected ? '#ffffff' : folder.color || '#3B82F6'}
            style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
          />

          {/* Folder Name - Left Aligned, spacious with marquee on hover */}
          <FolderMarqueeText
            text={folder.name}
            isSelected={isSelected}
            color={isSelected ? '#ffffff' : undefined}
          />
        </div>

        {/* Recursive Subfolders with tree guide line */}
        {hasChildren && isExpanded && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              borderLeft: '1.5px solid var(--panel-border)',
              marginLeft: '30px',
              paddingLeft: '6px',
              marginTop: '1px'
            }}
          >
            {subfolders.map(sf => renderFolderTreeNode(sf, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isRendered) return null;

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
      onClick={onClose}
    >
      <style>{`
        @keyframes folderMarqueeScroll {
          0% { transform: translateX(0); }
          20% { transform: translateX(0); }
          80% { transform: translateX(calc(-1 * var(--overflow-dist, 0px))); }
          100% { transform: translateX(calc(-1 * var(--overflow-dist, 0px))); }
        }
        .media-picker-btn,
        .media-picker-confirm-btn,
        .hd-modal-container button.media-picker-confirm-btn,
        .hd-modal-container button.media-picker-btn,
        [data-modal-container] button.media-picker-confirm-btn,
        [data-modal-container] button.media-picker-btn,
        .hd-modal-container .media-picker-footer button,
        [data-modal-container] .media-picker-footer button {
          padding-left: 15px !important;
          padding-right: 15px !important;
        }
      `}</style>
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
          willChange: 'transform, opacity',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
        onDragOver={e => {
          e.preventDefault();
          setIsDraggingOverModal(true);
        }}
        onDragLeave={e => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDraggingOverModal(false);
        }}
        onDrop={e => {
          e.preventDefault();
          setIsDraggingOverModal(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files);
          }
        }}
      >
        {/* Drag & Drop Overlay */}
        {isDraggingOverModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 120,
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '3px dashed #3B82F6',
              borderRadius: isFullscreen ? '0' : '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              pointerEvents: 'none',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.25)',
                border: '2px solid #38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}
            >
              📥
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Գցեք նիշքերն այստեղ վերբեռնելու համար
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Կվերբեռնվեն՝ <strong style={{ color: '#38BDF8' }}>{currentFolderId && folderMap.get(currentFolderId) ? folderMap.get(currentFolderId)!.name : 'Գլխավոր (Root)'}</strong> պանակում
            </div>
          </div>
        )}

        {/* Invisible file input */}
        <input
          type="file"
          ref={uploadInputRef}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              handleUploadFiles(e.target.files);
            }
            e.target.value = '';
          }}
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
            <span className="hd-icon icon-Image" style={{ fontSize: '1.3rem' }} />
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
                className="media-picker-btn"
                onClick={() => setActiveTab('library')}
                style={{
                  background: activeTab === 'library' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'library' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 15px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Դարան
              </button>
              <button
                type="button"
                className="media-picker-btn"
                onClick={() => uploadInputRef.current?.click()}
                style={{
                  background: 'transparent',
                  color: 'var(--fg)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 15px',
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
                className="media-picker-btn"
                onClick={() => setActiveTab('url')}
                style={{
                  background: activeTab === 'url' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'url' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 15px',
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
              className="media-picker-btn"
              onClick={() => setIsFullscreen(p => !p)}
              title={isFullscreen ? "Կրճատել չափսը" : "Ամբողջ էկրանով"}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                padding: '6px 15px',
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
              onClick={onClose}
              title="Փակել (Esc)"
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
              Մուտքագրեք արտաքին հղումը (URL)
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
          <div style={{ display: 'grid', gridTemplateColumns: '265px 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Left Folder Tree in Modal */}
            <div
              onScroll={hideTooltip}
              onMouseLeave={hideTooltip}
              style={{
                background: 'var(--bg)',
                borderRight: '1px solid var(--panel-border)',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                overflowY: 'auto',
                minWidth: 0
              }}
            >
              {/* Root item */}
              <div
                onClick={() => setCurrentFolderId(null)}
                onMouseEnter={e => {
                  const rootFiles = files.filter(f => !f.isTrashed && f.folderId === null);
                  const rootSize = rootFiles.reduce((acc, f) => acc + (f.size || 0), 0);
                  showTooltipFor(rootFiles.length, formatBytes(rootSize), e);
                }}
                onMouseLeave={hideTooltip}
                onDragOver={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleUploadFiles(e.dataTransfer.files, null);
                  }
                }}
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
                  justifyContent: 'flex-start',
                  gap: '8px',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  userSelect: 'none'
                }}
              >
                <span className="hd-icon icon-Monitor" style={{ fontSize: '1rem', flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Գլխավոր (Root)
                </span>
              </div>

              {/* Gallery (Պատկերասրահ) Quick Link */}
              <div
                onClick={() => setCurrentFolderId('gallery')}
                onMouseEnter={e => {
                  const nonTrashed = files.filter(f => !f.isTrashed);
                  const totalSize = nonTrashed.reduce((acc, f) => acc + (f.size || 0), 0);
                  showTooltipFor(nonTrashed.length, formatBytes(totalSize), e);
                }}
                onMouseLeave={hideTooltip}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: currentFolderId === 'gallery' ? 700 : 500,
                  background: currentFolderId === 'gallery' ? 'var(--accent)' : 'transparent',
                  color: currentFolderId === 'gallery' ? '#ffffff' : 'var(--fg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '8px',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  userSelect: 'none'
                }}
              >
                <span className="hd-icon icon-Image" style={{ fontSize: '1rem', flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Պատկերասրահ (Gallery)
                </span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '4px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px', padding: '0 4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
                  Պանակներ
                </span>
                <button
                  type="button"
                  className="media-picker-btn"
                  onClick={() => setIsNewFolderModalOpen(true)}
                  title="Ստեղծել նոր պանակ"
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#3B82F6',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: '6px',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>＋</span>
                  <span>Նոր</span>
                </button>
              </div>

              {/* Recursive Root-level Folders Tree */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {folders.filter(f => f.parentId === null).map(rf => renderFolderTreeNode(rf, 0))}
              </div>

              {folders.length === 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
                  Պանակներ չկան
                </div>
              )}
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
                {/* Breadcrumbs & New Folder button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
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

                  <button
                    type="button"
                    className="media-picker-btn"
                    onClick={() => setIsNewFolderModalOpen(true)}
                    title="Ստեղծել նոր պանակ այստեղ"
                    style={{
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#3B82F6',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      padding: '4px 15px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                  >
                    <span>＋</span>
                    <span>Նոր պանակ</span>
                  </button>
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
                          className="media-picker-btn"
                          onClick={() => setActiveTypeTab(tab.id)}
                          style={{
                            background: isActive ? 'var(--accent)' : 'transparent',
                            color: isActive ? '#ffffff' : 'var(--muted)',
                            border: `1px solid ${isActive ? 'transparent' : 'var(--panel-border)'}`,
                            borderRadius: '6px',
                            padding: '4px 15px',
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
                  <div style={{ position: 'relative' }}>
                    <span className="hd-icon icon-Search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.85rem', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Որոնել..."
                      style={{
                        height: '32px',
                        background: 'var(--bg)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '8px',
                        padding: '0 10px 0 30px',
                        color: 'var(--fg)',
                        fontSize: '0.8rem',
                        width: '160px'
                      }}
                    />
                  </div>

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

                  {/* Folder Open Mode Toggle */}
                  <button
                    type="button"
                    className="media-picker-btn"
                    onClick={toggleFolderOpenMode}
                    title={folderOpenMode === 'double' ? 'Պանակներ՝ կրկնակի կտտոցով (Լռելյայն)։ Կտտացրեք՝ մեկ կտտոցի փոխելու համար' : 'Պանակներ՝ մեկ կտտոցով։ Կտտացրեք՝ կրկնակի կտտոցի փոխելու համար'}
                    style={{
                      background: 'var(--bg)',
                      color: 'var(--fg)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '6px',
                      padding: '4px 15px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span className="hd-icon icon-Settings" style={{ fontSize: '0.78rem' }} />
                    <span>{folderOpenMode === 'double' ? '2x կտտոց' : '1x կտտոց'}</span>
                  </button>
                </div>
              </div>

              {/* Files Area in Modal */}
              <div
                style={{ flex: 1, overflowY: 'auto', padding: '16px' }}
                onClick={() => setSelectedFolderId(null)}
              >
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    Բեռնվում են նիշքերը...
                  </div>
                ) : filteredFiles.length === 0 && currentSubfolders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>
                    <FolderIcon size={42} color="#3B82F6" style={{ marginBottom: '12px', opacity: 0.7 }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--fg)' }}>Այստեղ նիշքեր դեռ չկան</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '4px' }}>
                      Քաշեք և գցեք նիշքերն այստեղ կամ օգտագործեք կոճակները
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
                      <button
                        type="button"
                        className="media-picker-btn"
                        onClick={() => uploadInputRef.current?.click()}
                        style={{
                          background: 'var(--accent)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 15px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>↑</span>
                        <span>Վերբեռնել նիշք</span>
                      </button>
                      <button
                        type="button"
                        className="media-picker-btn"
                        onClick={() => setIsNewFolderModalOpen(true)}
                        style={{
                          background: 'var(--panel)',
                          color: 'var(--fg)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '8px',
                          padding: '8px 15px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>📁</span>
                        <span>Ստեղծել պանակ</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Subfolders if any */}
                    {currentSubfolders.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                        {currentSubfolders.map(subf => {
                          const isFolderSelected = selectedFolderId === subf.id;
                          return (
                            <div
                              key={subf.id}
                              onClick={e => {
                                e.stopPropagation();
                                if (folderOpenMode === 'single') {
                                  setCurrentFolderId(subf.id);
                                  setSelectedFolderId(null);
                                } else {
                                  setSelectedFolderId(subf.id);
                                }
                              }}
                              onDoubleClick={e => {
                                e.stopPropagation();
                                setCurrentFolderId(subf.id);
                                setSelectedFolderId(null);
                              }}
                              title={folderOpenMode === 'double' ? `${subf.name} (Կրկնակի կտտոց՝ բացելու համար)` : subf.name}
                              onDragOver={e => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onDrop={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                  handleUploadFiles(e.dataTransfer.files, subf.id);
                                }
                              }}
                              style={{
                                background: isFolderSelected ? 'rgba(59, 130, 246, 0.16)' : 'var(--bg)',
                                border: `1px solid ${isFolderSelected ? '#3B82F6' : 'var(--panel-border)'}`,
                                borderRadius: '8px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <FolderIcon size={18} color={subf.color || '#3B82F6'} style={{ flexShrink: 0 }} />
                              <FolderMarqueeText text={subf.name} isSelected={isFolderSelected} />
                            </div>
                          );
                        })}
                        <div
                          onClick={() => setIsNewFolderModalOpen(true)}
                          style={{
                            background: 'transparent',
                            border: '1px dashed var(--panel-border)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--muted)'
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>＋</span>
                          <span>Նոր պանակ</span>
                        </div>
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

          <div className="media-picker-footer" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="media-picker-btn"
              onClick={onClose}
              style={{
                background: 'var(--panel)',
                color: 'var(--fg)',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                padding: '8px 15px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Չեղարկել
            </button>

            <button
              type="button"
              className="media-picker-confirm-btn"
              disabled={activeTab === 'url' ? !customUrlInput.trim() : selectedUrls.length === 0}
              onClick={handleConfirmSelect}
              style={{
                background: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 15px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: (activeTab === 'url' ? !customUrlInput.trim() : selectedUrls.length === 0) ? 'default' : 'pointer',
                opacity: (activeTab === 'url' ? !customUrlInput.trim() : selectedUrls.length === 0) ? 0.4 : 1,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              Ընտրել
            </button>
          </div>
        </div>

        {/* Create Folder Modal */}
        {isNewFolderModalOpen && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 150,
              background: 'rgba(0, 0, 0, 0.72)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setIsNewFolderModalOpen(false)}
          >
            <div
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--panel-border)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderIcon size={22} color={newFolderColor} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--fg)' }}>
                    Ստեղծել նոր պանակ
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Գտնվելու վայրը՝ <strong style={{ color: 'var(--fg)' }}>{currentFolderId && folderMap.get(currentFolderId) ? folderMap.get(currentFolderId)!.name : 'Գլխավոր (Root)'}</strong>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  Պանակի անվանում
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Օրինակ՝ Լոգոներ, Պատկերներ..."
                  style={{
                    width: '100%',
                    height: '40px',
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    color: 'var(--fg)',
                    fontSize: '0.9rem'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateFolder();
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  Գույն
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFolderColor(color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: color,
                        border: newFolderColor === color ? '2.5px solid #ffffff' : 'none',
                        boxShadow: newFolderColor === color ? '0 0 8px ' + color : 'none',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="media-picker-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="media-picker-btn"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '8px 15px',
                    fontSize: '0.85rem',
                    color: 'var(--fg)',
                    cursor: 'pointer'
                  }}
                >
                  Չեղարկել
                </button>
                <button
                  type="button"
                  className="media-picker-btn"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 15px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: (!newFolderName.trim() || isCreatingFolder) ? 'not-allowed' : 'pointer',
                    opacity: (!newFolderName.trim() || isCreatingFolder) ? 0.6 : 1
                  }}
                >
                  {isCreatingFolder ? 'Ստեղծվում է...' : 'Ստեղծել'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress Overlay */}
        <UploadProgressOverlay isUploading={isUploading} progress={uploadProgress} mode="fixed" />

        {/* Floating Tooltip with downward arrow for size and count on hover */}
        {folderTooltip && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              left: `${folderTooltip.x}px`,
              top: `${folderTooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              zIndex: 999999,
              background: 'rgba(15, 23, 42, 0.96)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.45), 0 2px 5px rgba(0, 0, 0, 0.25)',
              borderRadius: '7px',
              padding: '4px 10px',
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.01em'
            }}
          >
            <span>{folderTooltip.text}</span>
            {/* Downward triangle arrow */}
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(15, 23, 42, 0.96)'
              }}
            />
          </div>,
          document.body
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
