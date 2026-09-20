"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import JSZip from 'jszip';
import { MediaFolder, MediaFile, ViewMode, SortField, SortOrder, SortCriterion, MediaFileType, StorageStats, TrashSettings, FolderStats, formatBytes } from '@/lib/mediaTypes';
import { getCachedMedia, notifyMediaCache, subscribeToMediaCache } from '@/lib/mediaCache';

const COLOR_PRESETS = [
  { name: 'Կապույտ (Windows Blue)', hex: '#3B82F6' },
  { name: 'Զմրուխտե Կանաչ (Emerald)', hex: '#10B981' },
  { name: 'Արքայական Մանուշակ (Purple)', hex: '#8B5CF6' },
  { name: 'Վարդագույն (Pink)', hex: '#EC4899' },
  { name: 'Ոսկեգույն (Amber)', hex: '#F59E0B' },
  { name: 'Նարնջագույն (Orange)', hex: '#F97316' },
  { name: 'Կարմիր (Ruby)', hex: '#EF4444' },
  { name: 'Ծովագույն (Cyan)', hex: '#06B6D4' },
  { name: 'Մոխրագույն (Slate)', hex: '#64748B' },
  { name: 'Մուգ Գրաֆիտ (Graphite)', hex: '#334155' }
];

interface AdminMediaManagerProps {
  token: string | null;
}

export default function AdminMediaManager({ token }: AdminMediaManagerProps) {
  // Client mount state for portals
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Data state with instant cache initialization
  const [files, setFiles] = useState<MediaFile[]>(() => getCachedMedia()?.files || []);
  const [folders, setFolders] = useState<MediaFolder[]>(() => getCachedMedia()?.folders || []);
  const [loading, setLoading] = useState(() => !getCachedMedia());
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(() => getCachedMedia()?.stats || null);

  // Subscribe to external cache updates
  useEffect(() => {
    const unsubscribe = subscribeToMediaCache((cached) => {
      setFiles(cached.files);
      setFolders(cached.folders);
      if (cached.stats) setStats(cached.stats);
    });
    return unsubscribe;
  }, []);

  // Trash state
  const [isTrashSettingsModalOpen, setIsTrashSettingsModalOpen] = useState(false);
  const [trashSettingsForm, setTrashSettingsForm] = useState<TrashSettings>({
    autoDeleteEnabled: true,
    retentionDays: 30
  });

  // Navigation & View state
  // currentFolderId: null means Root / All, 'trash' means Trash view, or string folder ID
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Persistent layout and view preferences (loaded from localStorage)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hdesign_media_view_mode') as ViewMode | null;
        if (saved && ['large-icons', 'medium-icons', 'list', 'details', 'tiles'].includes(saved)) {
          return saved;
        }
      } catch (e) {}
    }
    return 'large-icons';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaFileType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hdesign_media_type_filter') as any;
        if (saved) return saved;
      } catch (e) {}
    }
    return 'all';
  });

  // Multi-level sort criteria (e.g. Primary: Type ASC, Secondary: Size DESC)
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hdesign_media_sort_criteria');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
        // Fallback to legacy single sort preferences if present
        const savedField = localStorage.getItem('hdesign_media_sort_field') as SortField | null;
        const savedOrder = localStorage.getItem('hdesign_media_sort_order') as SortOrder | null;
        if (savedField && ['name', 'size', 'modifiedAt', 'type', 'folder'].includes(savedField)) {
          return [{ field: savedField, order: savedOrder === 'desc' ? 'desc' : 'asc' }];
        }
      } catch (e) {}
    }
    return [{ field: 'name', order: 'asc' }];
  });

  const sortField = sortCriteria[0]?.field || 'name';
  const sortOrder = sortCriteria[0]?.order || 'asc';

  // Pinned files to top (persistent across reloads and views)
  const [pinnedFileIds, setPinnedFileIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hdesign_media_pinned_ids');
        if (saved) return new Set(JSON.parse(saved));
      } catch (e) {}
    }
    return new Set();
  });

  // Usage filter ('all' | 'used' | 'unused')
  const [usageFilter, setUsageFilter] = useState<'all' | 'used' | 'unused'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hdesign_media_usage_filter');
        if (saved === 'used' || saved === 'unused' || saved === 'all') return saved;
      } catch (e) {}
    }
    return 'all';
  });

  // Skip trash confirmation preference (Delete without confirmation)
  const [skipTrashConfirm, setSkipTrashConfirm] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hdesign_media_skip_trash_confirm');
        if (saved !== null) return saved === 'true';
      } catch (e) {}
    }
    return false;
  });

  const toggleSkipTrashConfirm = (value: boolean) => {
    setSkipTrashConfirm(value);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hdesign_media_skip_trash_confirm', String(value));
      } catch (e) {}
    }
  };

  // Custom UI Dialog / Popup Modal state (replaces window.confirm & window.alert)
  interface DialogModalConfig {
    type: 'confirm' | 'warning' | 'danger' | 'info' | 'alert' | 'success';
    title: string;
    message: string;
    usedInList?: Array<string | { title: string; type: string }>;
    confirmText?: string;
    cancelText?: string;
    showSkipConfirmToggle?: boolean;
    onConfirm: (dontAskAgain?: boolean) => void;
    onCancel?: () => void;
  }

  const [dialogModal, setDialogModal] = useState<DialogModalConfig & { isOpen: boolean }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [dialogDontAskAgain, setDialogDontAskAgain] = useState(false);

  const openDialog = (config: DialogModalConfig) => {
    setDialogDontAskAgain(false);
    setDialogModal({ ...config, isOpen: true });
  };

  const closeDialog = () => {
    setDialogModal(prev => ({ ...prev, isOpen: false }));
  };

  // Detailed file usage inspector modal
  const [usageInspectFile, setUsageInspectFile] = useState<MediaFile | null>(null);

  // Real-time Exiting animation state for smooth deletions, moves, and restores
  const [exitingFiles, setExitingFiles] = useState<Map<string, 'trash' | 'delete' | 'restore' | 'move'>>(new Map());

  const animateAndExecute = useCallback((
    fileIds: string[],
    actionType: 'trash' | 'delete' | 'restore' | 'move',
    onComplete: () => void,
    durationMs = 280
  ) => {
    if (fileIds.length === 0) {
      onComplete();
      return;
    }
    setExitingFiles(prev => {
      const next = new Map(prev);
      fileIds.forEach(id => next.set(id, actionType));
      return next;
    });

    setTimeout(() => {
      onComplete();
      setExitingFiles(prev => {
        const next = new Map(prev);
        fileIds.forEach(id => next.delete(id));
        return next;
      });
    }, durationMs);
  }, []);

  const getExitingClass = useCallback((fileId: string) => {
    const action = exitingFiles.get(fileId);
    return action ? `is-exiting-${action}` : '';
  }, [exitingFiles]);

  const changeUsageFilter = (filter: 'all' | 'used' | 'unused') => {
    setUsageFilter(filter);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hdesign_media_usage_filter', filter);
      } catch (e) {}
    }
  };

  // Floating Drag Preview Avatar with Inertia Tilt (Supports multi-card fanned stack or folder preview)
  const [dragAvatar, setDragAvatar] = useState<{
    isDragging: boolean;
    count: number;
    files: MediaFile[];
    folder?: MediaFolder | null;
    folders?: MediaFolder[];
  }>({
    isDragging: false,
    count: 0,
    files: [],
    folder: null,
    folders: []
  });
  const dragAvatarRef = useRef<HTMLDivElement | null>(null);
  const dragPhysicsRef = useRef<{
    targetX: number;
    targetY: number;
    currentX: number;
    currentY: number;
    originX: number;
    originY: number;
    originScale: number;
    targetTilt: number;
    currentTilt: number;
    scale: number;
    targetScale: number;
    opacity: number;
    targetOpacity: number;
    lastEventX: number;
    lastEventTime: number;
    startTime: number;
    spawnDuration: number;
    active: boolean;
    isEnding: boolean;
    endTime: number;
    endDuration: number;
    startX: number;
    startY: number;
    startScale: number;
  }>({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    originX: 0,
    originY: 0,
    originScale: 1.0,
    targetTilt: 0,
    currentTilt: 0,
    scale: 1.0,
    targetScale: 1.0,
    opacity: 0,
    targetOpacity: 1,
    lastEventX: 0,
    lastEventTime: 0,
    startTime: 0,
    spawnDuration: 300,
    active: false,
    isEnding: false,
    endTime: 0,
    endDuration: 280,
    startX: 0,
    startY: 0,
    startScale: 1.0
  });

  // History for Back / Forward navigation
  const [history, setHistory] = useState<Array<string | null>>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Selection state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [lastSelectedFileId, setLastSelectedFileId] = useState<string | null>(null);

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    type: 'file' | 'folder' | 'empty';
    file?: MediaFile;
    folder?: MediaFolder;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'empty'
  });

  // Modals & Drawers
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'edit'>('create');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderFormName, setFolderFormName] = useState('');
  const [folderFormColor, setFolderFormColor] = useState('#3B82F6');
  const [folderFormParentId, setFolderFormParentId] = useState<string | null>(null);

  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null);

  // Inline rename modal / state
  const [renamingFile, setRenamingFile] = useState<MediaFile | null>(null);
  const [newFileName, setNewFileName] = useState('');

  // Drag & drop state
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [draggedFolderIds, setDraggedFolderIds] = useState<string[]>([]);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const dragOverFolderIdRef = useRef<string | null>(null);

  // Multi-folder selection state
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());

  // Marquee (rubber-band) drag-selection state
  const [marqueeRect, setMarqueeRect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const marqueeInitialSelectionRef = useRef<Set<string>>(new Set());
  const marqueeInitialFolderSelectionRef = useRef<Set<string>>(new Set());
  const marqueeHasDraggedRef = useRef<boolean>(false);
  const mainAreaRef = useRef<HTMLDivElement | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerContainerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(145);

  useEffect(() => {
    if (!headerContainerRef.current) return;
    const updateHeaderHeight = () => {
      if (headerContainerRef.current) {
        setHeaderHeight(headerContainerRef.current.offsetHeight);
      }
    };
    updateHeaderHeight();
    const ro = new ResizeObserver(updateHeaderHeight);
    ro.observe(headerContainerRef.current);
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // Expanded folders in sidebar tree
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Load data from API
  const loadMedia = useCallback(async () => {
    const cached = getCachedMedia();
    if (!cached) {
      setLoading(true);
    } else {
      setFiles(cached.files);
      setFolders(cached.folders);
      if (cached.stats) setStats(cached.stats);
      setLoading(false);
    }
    setError(null);
    try {
      const res = await fetch('/api/admin/media', {
        headers: {
          Authorization: token || ''
        }
      });
      if (!res.ok) {
        throw new Error(`Սերվերի պատասխանը: ${res.status}`);
      }
      const data = await res.json();
      setFiles(data.files || []);
      setFolders(data.folders || []);
      setStats(data.stats || null);
      notifyMediaCache({
        files: data.files || [],
        folders: data.folders || [],
        stats: data.stats || null,
        timestamp: Date.now()
      });

      if (data.trashSettings) {
        setTrashSettingsForm({
          autoDeleteEnabled: data.trashSettings.autoDeleteEnabled ?? true,
          retentionDays: data.trashSettings.retentionDays ?? 30
        });
      }

      // Auto expand root folders that have children
      const parentIdsWithChildren = new Set<string>();
      (data.folders || []).forEach((f: MediaFolder) => {
        if (f.parentId) parentIdsWithChildren.add(f.parentId);
      });
      setExpandedFolderIds(prev => new Set([...prev, ...parentIdsWithChildren]));
    } catch (err: any) {
      console.error('Error fetching media:', err);
      if (!getCachedMedia()) {
        setError(err.message || 'Չհաջողվեց բեռնել մեդիա գրադարանը');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Helper to sync state with Browser Address Bar (URL search params)
  const updateUrlQuery = useCallback((params: {
    folder?: string | null;
    preview?: string | null;
    view?: ViewMode;
    type?: 'all' | MediaFileType;
    search?: string;
  }, push = true) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);

    if ('folder' in params) {
      if (params.folder) {
        url.searchParams.set('folder', params.folder);
      } else {
        url.searchParams.delete('folder');
      }
    }

    if ('preview' in params) {
      if (params.preview) {
        url.searchParams.set('preview', params.preview);
      } else {
        url.searchParams.delete('preview');
      }
    }

    if ('view' in params) {
      if (params.view && params.view !== 'large-icons') {
        url.searchParams.set('view', params.view);
      } else {
        url.searchParams.delete('view');
      }
    }

    if ('type' in params) {
      if (params.type && params.type !== 'all') {
        url.searchParams.set('type', params.type);
      } else {
        url.searchParams.delete('type');
      }
    }

    if ('search' in params) {
      if (params.search && params.search.trim()) {
        url.searchParams.set('search', params.search.trim());
      } else {
        url.searchParams.delete('search');
      }
    }

    if (push) {
      window.history.pushState({ ...window.history.state }, '', url.toString());
    } else {
      window.history.replaceState({ ...window.history.state }, '', url.toString());
    }
  }, []);

  const openPreview = useCallback((file: MediaFile) => {
    setPreviewFile(file);
    updateUrlQuery({ preview: file.id }, true);
  }, [updateUrlQuery]);

  const closePreview = useCallback(() => {
    setPreviewFile(null);
    updateUrlQuery({ preview: null }, true);
  }, [updateUrlQuery]);

  const changeViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hdesign_media_view_mode', mode);
      } catch (e) {}
    }
    updateUrlQuery({ view: mode }, true);
  }, [updateUrlQuery]);

  const changeTypeFilter = useCallback((type: 'all' | MediaFileType) => {
    setTypeFilter(type);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hdesign_media_type_filter', type);
      } catch (e) {}
    }
    updateUrlQuery({ type }, true);
  }, [updateUrlQuery]);

  const handleColumnSortClick = (field: SortField, e: React.MouseEvent) => {
    e.stopPropagation();
    const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
    setSortCriteria(prev => {
      let next: SortCriterion[];
      const existingIndex = prev.findIndex(c => c.field === field);

      if (isMulti) {
        if (existingIndex !== -1) {
          // Toggle direction of this existing field in multi-sort
          next = prev.map((c, i) => i === existingIndex ? { ...c, order: c.order === 'asc' ? 'desc' : 'asc' } : c);
        } else {
          // Add as secondary / tertiary sort level
          next = [...prev, { field, order: 'asc' }];
        }
      } else {
        // Single column sort: if same column, toggle direction; if new column, switch to it (asc)
        if (prev.length === 1 && prev[0].field === field) {
          next = [{ field, order: prev[0].order === 'asc' ? 'desc' : 'asc' }];
        } else {
          next = [{ field, order: 'asc' }];
        }
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hdesign_media_sort_criteria', JSON.stringify(next));
          localStorage.setItem('hdesign_media_sort_field', next[0]?.field || 'name');
          localStorage.setItem('hdesign_media_sort_order', next[0]?.order || 'asc');
        } catch (err) {}
      }
      return next;
    });
  };

  const handleSortFieldChange = (field: SortField) => {
    setSortCriteria(prev => {
      const next: SortCriterion[] = [{ field, order: prev[0]?.order || 'asc' }];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hdesign_media_sort_criteria', JSON.stringify(next));
          localStorage.setItem('hdesign_media_sort_field', field);
        } catch (e) {}
      }
      return next;
    });
  };

  const handleSortOrderToggle = () => {
    setSortCriteria(prev => {
      const currentOrder = prev[0]?.order || 'asc';
      const nextOrder: SortOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      const next: SortCriterion[] = prev.map(c => ({ ...c, order: nextOrder }));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hdesign_media_sort_criteria', JSON.stringify(next));
          localStorage.setItem('hdesign_media_sort_order', nextOrder);
        } catch (e) {}
      }
      return next;
    });
  };

  const renderSortIndicator = (field: SortField) => {
    const index = sortCriteria.findIndex(c => c.field === field);
    if (index === -1) return null;
    const criterion = sortCriteria[index];
    const isOnly = sortCriteria.length === 1;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          marginLeft: '4px',
          padding: '1px 5px',
          borderRadius: '4px',
          background: 'rgba(59, 130, 246, 0.2)',
          color: '#3B82F6',
          fontSize: '0.72rem',
          fontWeight: 700
        }}
      >
        {!isOnly && <span>{index + 1}</span>}
        <span>{criterion.order === 'asc' ? '▲' : '▼'}</span>
      </span>
    );
  };

  const togglePinFile = (fileId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPinnedFileIds(prev => {
      const next = new Set(prev);
      const isCurrentlyPinned = next.has(fileId);
      if (isCurrentlyPinned) {
        next.delete(fileId);
        showToast('Նիշքը ապագամվեց');
      } else {
        next.add(fileId);
        showToast('📌 Նիշքը գամվեց վերեւում');
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hdesign_media_pinned_ids', JSON.stringify(Array.from(next)));
        } catch (err) {}
      }
      return next;
    });
  };

  const handleBatchPin = (pin: boolean) => {
    const selected = Array.from(selectedFileIds);
    if (selected.length === 0) return;
    setPinnedFileIds(prev => {
      const next = new Set(prev);
      selected.forEach(id => {
        if (pin) next.add(id);
        else next.delete(id);
      });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hdesign_media_pinned_ids', JSON.stringify(Array.from(next)));
        } catch (err) {}
      }
      showToast(pin ? `📌 ${selected.length} նիշք գամվեց վերեւում` : `${selected.length} նիշք ապագամվեց`);
      return next;
    });
  };

  const changeSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    updateUrlQuery({ search: query }, false);
  }, [updateUrlQuery]);

  // Navigate folder helper
  const navigateToFolder = (folderId: string | null, addToHistory = true) => {
    setCurrentFolderId(folderId);
    setSelectedFileIds(new Set());
    setSelectedFolderIds(new Set());
    setLastSelectedFileId(null);
    if (addToHistory) {
      const newHist = history.slice(0, historyIndex + 1);
      newHist.push(folderId);
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
      updateUrlQuery({ folder: folderId, preview: null }, true);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCurrentFolderId(history[newIdx]);
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setLastSelectedFileId(null);
      updateUrlQuery({ folder: history[newIdx], preview: null }, false);
    }
  };

  const handleForward = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.forward();
    } else if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setCurrentFolderId(history[newIdx]);
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setLastSelectedFileId(null);
      updateUrlQuery({ folder: history[newIdx], preview: null }, false);
    }
  };

  const handleUpLevel = () => {
    if (!currentFolderId) return;
    const currentF = folders.find(f => f.id === currentFolderId);
    navigateToFolder(currentF?.parentId || null);
  };

  // Initial URL parsing on load
  const initialUrlParsed = useRef(false);
  useEffect(() => {
    if (loading || initialUrlParsed.current) return;
    initialUrlParsed.current = true;
    
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const folderParam = searchParams.get('folder');
      const previewParam = searchParams.get('preview');
      const viewParam = searchParams.get('view') as ViewMode | null;
      const typeParam = searchParams.get('type') as ('all' | MediaFileType) | null;
      const searchParam = searchParams.get('search');

      if (folderParam) {
        setCurrentFolderId(folderParam === 'trash' ? 'trash' : folderParam);
      }
      if (previewParam && files.length > 0) {
        const found = files.find(f => f.id === previewParam || f.name === previewParam);
        if (found) setPreviewFile(found);
      }
      if (viewParam && ['large-icons', 'medium-icons', 'list', 'details', 'tiles'].includes(viewParam)) {
        setViewMode(viewParam);
      }
      if (typeParam) {
        setTypeFilter(typeParam);
      }
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, [loading, files]);

  // Listen to browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const folderParam = searchParams.get('folder');
      const previewParam = searchParams.get('preview');
      const viewParam = searchParams.get('view') as ViewMode | null;
      const typeParam = searchParams.get('type') as ('all' | MediaFileType) | null;
      const searchParam = searchParams.get('search');

      setCurrentFolderId(folderParam ? (folderParam === 'trash' ? 'trash' : folderParam) : null);
      setSelectedFileIds(new Set());
      setLastSelectedFileId(null);

      if (previewParam) {
        const found = files.find(f => f.id === previewParam || f.name === previewParam);
        if (found) setPreviewFile(found);
      } else {
        setPreviewFile(null);
      }

      if (viewParam && ['large-icons', 'medium-icons', 'list', 'details', 'tiles'].includes(viewParam)) {
        setViewMode(viewParam);
      } else {
        setViewMode('large-icons');
      }

      if (typeParam) {
        setTypeFilter(typeParam);
      } else {
        setTypeFilter('all');
      }

      setSearchQuery(searchParam || '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [files]);

  // Folder Map for fast lookups
  const folderMap = useMemo(() => {
    const map = new Map<string, MediaFolder>();
    folders.forEach(f => map.set(f.id, f));
    return map;
  }, [folders]);

  // Subfolders of current folder
  const currentSubfolders = useMemo(() => {
    return folders.filter(f => f.parentId === currentFolderId);
  }, [folders, currentFolderId]);

  // Breadcrumb hierarchy
  const breadcrumbs = useMemo(() => {
    if (currentFolderId === 'trash') {
      return [
        { id: null, name: 'Անհատական Կայք (ԱԿ)' },
        { id: 'trash', name: '🗑️ Աղբարկղ', color: '#EF4444' }
      ];
    }
    if (currentFolderId === 'gallery') {
      return [
        { id: null, name: 'Անհատական Կայք (ԱԿ)' },
        { id: 'gallery', name: '🖼️ Պատկերասրահ (Բոլոր նիշքերը)', color: '#8B5CF6' }
      ];
    }
    const crumbs: Array<{ id: string | null; name: string; color?: string }> = [
      { id: null, name: 'Անհատական Կայք (ԱԿ) (Գլխավոր)' }
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

  // Helper to check if a folder is a descendant of another folder
  const isDescendantFolder = useCallback((parentFolderId: string, candidateId: string | null): boolean => {
    if (!candidateId) return false;
    let curr = folderMap.get(candidateId);
    while (curr) {
      if (curr.id === parentFolderId) return true;
      curr = curr.parentId ? folderMap.get(curr.parentId) : undefined;
    }
    return false;
  }, [folderMap]);

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

  // Folder item count helper (reads from folderStats for backward compatibility)
  const folderItemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    folderStats.forEach((stat, id) => {
      counts.set(id, stat.count);
    });
    return counts;
  }, [folderStats]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    const isTrashView = currentFolderId === 'trash';
    const isGalleryView = currentFolderId === 'gallery';

    return files.filter(file => {
      // In trash view, show ONLY trashed files
      if (isTrashView) {
        if (!file.isTrashed) return false;
      } else {
        // In normal view or gallery view, HIDE trashed files
        if (file.isTrashed) return false;

        // Folder filter: Gallery view shows all files flatly!
        if (!isGalleryView) {
          const matchFolder = searchQuery ? true : file.folderId === currentFolderId;
          if (!matchFolder) return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && file.type !== typeFilter) return false;

      // Usage filter (all | used | unused)
      if (usageFilter === 'used' && (!file.usedIn || file.usedIn.length === 0)) return false;
      if (usageFilter === 'unused' && file.usedIn && file.usedIn.length > 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = file.name.toLowerCase().includes(q);
        const matchExt = file.extension.toLowerCase().includes(q);
        const matchUsage = file.usedIn?.some(u => u.toLowerCase().includes(q));
        if (!matchName && !matchExt && !matchUsage) return false;
      }

      return true;
    }).sort((a, b) => {
      // 1. PINNED FILES ALWAYS COME FIRST (except in trash view)
      if (!isTrashView) {
        const isPinnedA = pinnedFileIds.has(a.id);
        const isPinnedB = pinnedFileIds.has(b.id);
        if (isPinnedA && !isPinnedB) return -1;
        if (!isPinnedA && isPinnedB) return 1;
      }

      // 2. MULTI-LEVEL SORT CRITERIA
      for (const criterion of sortCriteria) {
        let comparison = 0;
        if (criterion.field === 'name') {
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        } else if (criterion.field === 'size') {
          comparison = a.size - b.size;
        } else if (criterion.field === 'modifiedAt') {
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        } else if (criterion.field === 'type') {
          comparison = a.type.localeCompare(b.type);
        } else if (criterion.field === 'folder') {
          const folderA = a.folderId ? (folderMap.get(a.folderId)?.name || '') : '';
          const folderB = b.folderId ? (folderMap.get(b.folderId)?.name || '') : '';
          comparison = folderA.localeCompare(folderB, undefined, { numeric: true });
        }

        if (comparison !== 0) {
          return criterion.order === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }, [files, currentFolderId, searchQuery, typeFilter, usageFilter, pinnedFileIds, sortCriteria, folderMap]);

  // Total weight / size of currently filtered files in view
  const currentViewTotalSize = useMemo(() => {
    return filteredFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  }, [filteredFiles]);

  // Total weight / size of selected files
  const selectedFilesTotalSize = useMemo(() => {
    let total = 0;
    for (const id of selectedFileIds) {
      const f = files.find(file => file.id === id);
      if (f) total += (f.size || 0);
    }
    return total;
  }, [selectedFileIds, files]);

  // Total weight / size of selected folders
  const selectedFoldersTotalSize = useMemo(() => {
    let total = 0;
    for (const id of selectedFolderIds) {
      const stat = folderStats.get(id);
      if (stat) total += stat.size;
    }
    return total;
  }, [selectedFolderIds, folderStats]);

  // Folder CRUD handlers
  const handleOpenCreateFolder = (parentId: string | null = (currentFolderId === 'gallery' ? null : currentFolderId)) => {
    setFolderModalMode('create');
    setEditingFolderId(null);
    setFolderFormName('');
    setFolderFormColor('#3B82F6');
    setFolderFormParentId(parentId === 'gallery' ? null : parentId);
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolder = (f: MediaFolder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFolderModalMode('edit');
    setEditingFolderId(f.id);
    setFolderFormName(f.name);
    setFolderFormColor(f.color || '#3B82F6');
    setFolderFormParentId(f.parentId);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderFormName.trim()) return;

    try {
      if (folderModalMode === 'create') {
        const res = await fetch('/api/admin/media/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token || ''
          },
          body: JSON.stringify({
            name: folderFormName.trim(),
            color: folderFormColor,
            parentId: folderFormParentId
          })
        });
        const data = await res.json();
        if (data.success && data.folder) {
          setFolders(prev => [...prev, data.folder]);
          showToast(`«${data.folder.name}» պանակը ստեղծված է`);
          setIsFolderModalOpen(false);
          // If created inside current folder, expand parent
          if (folderFormParentId) {
            setExpandedFolderIds(prev => new Set([...prev, folderFormParentId]));
          }
        } else {
          openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց ստեղծել պանակը', onConfirm: closeDialog });
        }
      } else if (folderModalMode === 'edit' && editingFolderId) {
        const res = await fetch('/api/admin/media/folders', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token || ''
          },
          body: JSON.stringify({
            id: editingFolderId,
            name: folderFormName.trim(),
            color: folderFormColor,
            parentId: folderFormParentId
          })
        });
        const data = await res.json();
        if (data.success && data.folder) {
          setFolders(prev => prev.map(f => f.id === editingFolderId ? data.folder : f));
          showToast('Պանակը թարմացված է');
          setIsFolderModalOpen(false);
        } else {
          openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց թարմացնել պանակը', onConfirm: closeDialog });
        }
      }
    } catch (err: any) {
      openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ պանակը պահպանելիս', onConfirm: closeDialog });
    }
  };

  const handleDeleteFolder = async (folder: MediaFolder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const count = folderItemCounts.get(folder.id) || 0;
    const confirmMessage = count > 0
      ? `«${folder.name}» պանակում առկա է ${count} նիշք: Ջնջելու դեպքում բոլոր նիշքերը կտեղափոխվեն վերադաս մակարդակ:`
      : `Վստա՞հ եք, որ ցանկանում եք ջնջել «${folder.name}» պանակը:`;

    openDialog({
      type: 'danger',
      title: '🗑️ Պանակի ջնջում',
      message: confirmMessage,
      confirmText: 'Ջնջել պանակը',
      cancelText: 'Չեղարկել',
      onConfirm: async () => {
        closeDialog();
        try {
          const res = await fetch(`/api/admin/media/folders?id=${encodeURIComponent(folder.id)}`, {
            method: 'DELETE',
            headers: { Authorization: token || '' }
          });
          const data = await res.json();
          if (data.success) {
            setFolders(prev => prev.filter(f => f.id !== folder.id));
            setFiles(prev => prev.map(file => {
              if (file.folderId === folder.id) {
                return { ...file, folderId: folder.parentId };
              }
              return file;
            }));
            if (currentFolderId === folder.id) {
              navigateToFolder(folder.parentId);
            }
            showToast(`«${folder.name}» պանակը ջնջված է`);
          } else {
            openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց ջնջել պանակը', onConfirm: closeDialog });
          }
        } catch (err: any) {
          openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ պանակը ջնջելիս', onConfirm: closeDialog });
        }
      }
    });
  };

  // Move files to target folder (with automatic restore if moved from Trash)
  const handleMoveFiles = async (targetFolderId: string | null, fileIdsToMove: string[]) => {
    if (fileIdsToMove.length === 0) return;

    const trashedMovedCount = files.filter(f => fileIdsToMove.includes(f.id) && f.isTrashed).length;
    const isFromTrash = currentFolderId === 'trash' || trashedMovedCount > 0;

    const targetName = targetFolderId ? folderMap.get(targetFolderId)?.name || 'պանակ' : 'Գլխավոր (ԱԿ)';
    if (isFromTrash) {
      showToast(`${fileIdsToMove.length} նիշք վերականգնվեց աղբարկղից և տեղափոխվեց «${targetName}»`);
    } else {
      showToast(`${fileIdsToMove.length} նիշք տեղափոխվեց «${targetName}»`);
    }
    setSelectedFileIds(new Set());
    setIsMoveModalOpen(false);

    // If moving from trash or between folders, trigger smooth animation
    const shouldAnimate = currentFolderId !== 'gallery' && !searchQuery && (isFromTrash || targetFolderId !== currentFolderId);
    const animType = isFromTrash ? 'restore' : 'move';

    if (shouldAnimate) {
      animateAndExecute(fileIdsToMove, animType, () => {
        setFiles(prev => prev.map(f => {
          if (fileIdsToMove.includes(f.id)) {
            return { ...f, folderId: targetFolderId, isTrashed: false, trashedAt: undefined };
          }
          return f;
        }));
        if (trashedMovedCount > 0) {
          setStats(prev => prev ? { ...prev, trashCount: Math.max(0, (prev.trashCount || trashedMovedCount) - trashedMovedCount) } : prev);
        }
      });
    } else {
      setFiles(prev => prev.map(f => {
        if (fileIdsToMove.includes(f.id)) {
          return { ...f, folderId: targetFolderId, isTrashed: false, trashedAt: undefined };
        }
        return f;
      }));
      if (trashedMovedCount > 0) {
        setStats(prev => prev ? { ...prev, trashCount: Math.max(0, (prev.trashCount || trashedMovedCount) - trashedMovedCount) } : prev);
      }
    }

    try {
      const res = await fetch('/api/admin/media/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || ''
        },
        body: JSON.stringify({
          fileIds: fileIdsToMove,
          targetFolderId
        })
      });
      const data = await res.json();
      if (!data.success) {
        openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց տեղափոխել նիշքերը', onConfirm: closeDialog });
        loadMedia();
      }
    } catch (err: any) {
      openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ նիշքերը տեղափոխելիս', onConfirm: closeDialog });
      loadMedia();
    }
  };

  // Move a folder into another folder (or root)
  const handleMoveFolder = async (folderId: string, targetParentId: string | null) => {
    if (!folderId) return;
    if (folderId === targetParentId) return;

    const sourceFolder = folderMap.get(folderId);
    if (!sourceFolder) return;

    if (targetParentId === 'trash') {
      openDialog({
        type: 'warning',
        title: 'Անհնար է տեղափոխել',
        message: 'Պանակը հնարավոր չէ տեղափոխել աղբարկղ: Այն ջնջելու համար օգտագործեք պանակի ջնջման կոճակը:',
        onConfirm: closeDialog
      });
      return;
    }

    if (isDescendantFolder(folderId, targetParentId)) {
      openDialog({
        type: 'warning',
        title: 'Անհնար է տեղափոխել',
        message: `«${sourceFolder.name}» պանակը չի կարող տեղափոխվել իր իսկ ենթապանակի մեջ:`,
        onConfirm: closeDialog
      });
      return;
    }

    if (sourceFolder.parentId === targetParentId) return;

    const targetName = targetParentId ? folderMap.get(targetParentId)?.name || 'պանակ' : 'Գլխավոր (ԱԿ)';
    showToast(`«${sourceFolder.name}» պանակը տեղափոխվեց «${targetName}»`);

    // Optimistic UI update
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, parentId: targetParentId, updatedAt: new Date().toISOString() } : f));

    // Automatically expand target folder in tree if it was collapsed
    if (targetParentId) {
      setExpandedFolderIds(prev => new Set(prev).add(targetParentId));
    }

    try {
      const res = await fetch('/api/admin/media/folders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || ''
        },
        body: JSON.stringify({
          id: folderId,
          parentId: targetParentId
        })
      });
      const data = await res.json();
      if (!data.success) {
        openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց տեղափոխել պանակը', onConfirm: closeDialog });
        loadMedia();
      }
    } catch (err: any) {
      openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ պանակը տեղափոխելիս', onConfirm: closeDialog });
      loadMedia();
    }
  };

  // Open Custom Context Menu
  const openContextMenu = (
    e: React.MouseEvent,
    type: 'file' | 'folder' | 'empty',
    item?: { file?: MediaFile; folder?: MediaFolder }
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Viewport boundaries (menu width ~230px, height ~320px)
    let x = e.clientX;
    let y = e.clientY;
    if (typeof window !== 'undefined') {
      if (x + 240 > window.innerWidth) {
        x = Math.max(10, window.innerWidth - 245);
      }
      if (y + 340 > window.innerHeight) {
        y = Math.max(10, window.innerHeight - 345);
      }
    }

    setContextMenu({
      isOpen: true,
      x,
      y,
      type,
      file: item?.file,
      folder: item?.folder
    });
  };

  // Download single or multiple files (Pack into ZIP/7z archive if multiple)
  const handleDownloadFiles = async (filesToDownload?: MediaFile[]) => {
    const list = filesToDownload || files.filter(f => selectedFileIds.has(f.id));
    if (list.length === 0) {
      if (previewFile) {
        handleDownloadFiles([previewFile]);
      }
      return;
    }

    if (list.length === 1) {
      // Single file download
      const file = list[0];
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Ներբեռնվում է «${file.name}» նիշքը`);
      return;
    }

    // Multiple files -> Pack into single ZIP archive
    try {
      showToast(`Պատրաստվում է ${list.length} նիշքերի ZIP արխիվը...`);
      const zip = new JSZip();

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        try {
          const res = await fetch(file.url);
          const blob = await res.blob();
          zip.file(file.name, blob);
        } catch (err) {
          console.warn('Failed to fetch file for zip:', file.name, err);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const currentFolderName = currentFolderId ? (folderMap.get(currentFolderId)?.name || 'folder') : 'all_media';
      const safeName = currentFolderName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const zipFilename = `media_${safeName}_${new Date().toISOString().slice(0, 10)}.zip`;

      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showToast(`Արխիվը (${zipFilename}) հաջողությամբ ներբեռնվեց`);
    } catch (err: any) {
      console.error('Archive error:', err);
      openDialog({ type: 'alert', title: 'Սխալ', message: 'Սխալ արխիվը պատրաստելիս: ' + (err.message || ''), onConfirm: closeDialog });
    }
  };

  // File Upload (with automatic ZIP extraction support)
  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    // Check if a ZIP file was uploaded
    const zipFile = filesToUpload.find(f => f.name.toLowerCase().endsWith('.zip') || f.type === 'application/zip');
    if (zipFile && filesToUpload.length === 1) {
      openDialog({
        type: 'confirm',
        title: '📦 ZIP Արխիվի վերբեռնում',
        message: `Դուք վերբեռնում եք «${zipFile.name}» արխիվը:\nՑանկանու՞մ եք ԱՊԱԱՐԽԻՎԱՑՆԵԼ (Extract) դրա բոլոր նիշքերը ընթացիկ պանակում:`,
        confirmText: 'Ապաարխիվացնել',
        cancelText: 'Վերբեռնել որպես ZIP',
        onConfirm: async () => {
          closeDialog();
          setIsUploading(true);
          setUploadProgressText('Բացվում է արխիվը...');
          try {
            const zip = await JSZip.loadAsync(zipFile);
            const entries = Object.keys(zip.files);
            const validFiles: File[] = [];

            for (const filename of entries) {
              const entry = zip.files[filename];
              if (entry.dir || filename.startsWith('__MACOSX/') || filename.endsWith('/.DS_Store')) continue;
              const blob = await entry.async('blob');
              const cleanName = filename.split('/').pop() || filename;
              validFiles.push(new File([blob], cleanName, { type: blob.type }));
            }

            if (validFiles.length > 0) {
              showToast(`Արխիվից առանձնացվեց ${validFiles.length} նիշք: Սկսվում է վերբեռնումը...`);
              await uploadExtractedFiles(validFiles);
              return;
            }
          } catch (err: any) {
            console.error('ZIP extraction failed:', err);
            openDialog({ type: 'alert', title: 'Սխալ', message: 'Արխիվը բացել չհաջողվեց: ' + (err.message || ''), onConfirm: closeDialog });
          }
        },
        onCancel: () => {
          closeDialog();
          uploadExtractedFiles(filesToUpload);
        }
      });
      return;
    }

    // Standard upload
    await uploadExtractedFiles(filesToUpload);
  };

  const uploadExtractedFiles = async (filesList: File[]) => {
    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      setUploadProgressText(`Վերբեռնվում է (${i + 1}/${filesList.length}): ${file.name}`);
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId && currentFolderId !== 'trash' && currentFolderId !== 'gallery') {
        formData.append('folderId', currentFolderId);
      }

      try {
        const res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: {
            Authorization: token || ''
          },
          body: formData
        });
        const data = await res.json();
        if (data.success && data.file) {
          setFiles(prev => [data.file, ...prev]);
          successCount++;
        }
      } catch (err) {
        console.error('Upload error on file:', file.name, err);
      }
    }

    setIsUploading(false);
    setUploadProgressText('');
    showToast(`${successCount} նոր նիշք հաջողությամբ վերբեռնվեց`);
  };

  // Move single file to trash (with smart detection if used in website & skip confirm support)
  const handleMoveToTrash = async (file: MediaFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isUsed = file.usedIn && file.usedIn.length > 0;

    const executeTrash = () => {
      animateAndExecute([file.id], 'trash', () => {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isTrashed: true, trashedAt: new Date().toISOString() } : f));
        setSelectedFileIds(prev => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        });
        if (previewFile?.id === file.id) setPreviewFile(null);
        setStats(prev => prev ? { ...prev, trashCount: (prev.trashCount || 0) + 1 } : prev);
      });

      showToast('Նիշքը տեղափոխվեց աղբարկղ');

      fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'moveToTrash', fileIds: [file.id] })
      }).then(res => res.json()).then(data => {
        if (!data.success) {
          openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց տեղափոխել աղբարկղ', onConfirm: closeDialog });
          loadMedia();
        }
      }).catch(err => {
        openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ նիշքը աղբարկղ տեղափոխելիս', onConfirm: closeDialog });
        loadMedia();
      });
    };

    // If file is used in website, ALWAYS show the extra prominent warning popup!
    if (isUsed) {
      openDialog({
        type: 'warning',
        title: '⚠️ Զգուշացում․ Նիշքն օգտագործվում է կայքում',
        message: `«${file.name}» նիշքը ակտիվորեն օգտագործվում է կայքի ${file.usedIn!.length} հատվածում։ Աղբարկղ տեղափոխելու դեպքում այն կարող է այլևս չցուցադրվել կայքում։`,
        usedInList: file.usedIn,
        confirmText: 'Այնուամենայնիվ տեղափոխել աղբարկղ',
        cancelText: 'Չեղարկել',
        onConfirm: () => {
          closeDialog();
          executeTrash();
        }
      });
      return;
    }

    // If skip confirm preference is enabled, execute directly
    if (skipTrashConfirm) {
      executeTrash();
      return;
    }

    // Standard trash confirmation popup
    openDialog({
      type: 'confirm',
      title: '🗑️ Տեղափոխել աղբարկղ',
      message: `Վստա՞հ եք, որ ցանկանում եք «${file.name}» նիշքը տեղափոխել աղբարկղ:`,
      confirmText: 'Տեղափոխել աղբարկղ',
      cancelText: 'Չեղարկել',
      showSkipConfirmToggle: true,
      onConfirm: (dontAskAgain) => {
        if (dontAskAgain) toggleSkipTrashConfirm(true);
        closeDialog();
        executeTrash();
      }
    });
  };

  // Batch move to trash (with smart website usage detection & skip confirm support)
  const handleBatchMoveToTrash = async (ids?: string[]) => {
    const idsToTrash = ids || Array.from(selectedFileIds);
    if (idsToTrash.length === 0) return;

    const filesToTrash = files.filter(f => idsToTrash.includes(f.id));
    const usedFiles = filesToTrash.filter(f => f.usedIn && f.usedIn.length > 0);
    const allUsedLocations = Array.from(new Set(usedFiles.flatMap(f => f.usedIn || [])));

    const executeBatchTrash = () => {
      animateAndExecute(idsToTrash, 'trash', () => {
        setFiles(prev => prev.map(f => idsToTrash.includes(f.id) ? { ...f, isTrashed: true, trashedAt: new Date().toISOString() } : f));
        setSelectedFileIds(new Set());
        if (previewFile && idsToTrash.includes(previewFile.id)) setPreviewFile(null);
        setStats(prev => prev ? { ...prev, trashCount: (prev.trashCount || 0) + idsToTrash.length } : prev);
      });

      showToast(`${idsToTrash.length} նիշք տեղափոխվեց աղբարկղ`);

      fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'moveToTrash', fileIds: idsToTrash })
      }).then(res => res.json()).then(data => {
        if (!data.success) {
          openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց տեղափոխել աղբարկղ', onConfirm: closeDialog });
          loadMedia();
        }
      }).catch(err => {
        openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ աղբարկղ տեղափոխելիս', onConfirm: closeDialog });
        loadMedia();
      });
    };

    // If any selected files are used in the website, show prominent warning popup!
    if (usedFiles.length > 0) {
      openDialog({
        type: 'warning',
        title: '⚠️ Զգուշացում․ Ընտրված նիշքերից որոշներն օգտագործվում են կայքում',
        message: `Ընտրված ${idsToTrash.length} նիշքերից ${usedFiles.length}-ը ներկայումս ակտիվորեն օգտագործվում են կայքում։ Աղբարկղ տեղափոխելու դեպքում դրանք կարող են այլևս չցուցադրվել կայքում։`,
        usedInList: allUsedLocations,
        confirmText: 'Այնուամենայնիվ տեղափոխել աղբարկղ',
        cancelText: 'Չեղարկել',
        onConfirm: () => {
          closeDialog();
          executeBatchTrash();
        }
      });
      return;
    }

    if (skipTrashConfirm) {
      executeBatchTrash();
      return;
    }

    openDialog({
      type: 'confirm',
      title: '🗑️ Տեղափոխել աղբարկղ',
      message: `Վստա՞հ եք, որ ցանկանում եք աղբարկղ տեղափոխել ընտրված ${idsToTrash.length} նիշքերը:`,
      confirmText: 'Տեղափոխել աղբարկղ',
      cancelText: 'Չեղարկել',
      showSkipConfirmToggle: true,
      onConfirm: (dontAskAgain) => {
        if (dontAskAgain) toggleSkipTrashConfirm(true);
        closeDialog();
        executeBatchTrash();
      }
    });
  };

  // Restore single file from trash
  const handleRestoreFile = async (file: MediaFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    animateAndExecute([file.id], 'restore', () => {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isTrashed: false, trashedAt: undefined } : f));
      setSelectedFileIds(prev => { const next = new Set(prev); next.delete(file.id); return next; });
      if (previewFile?.id === file.id) setPreviewFile(null);
      setStats(prev => prev ? { ...prev, trashCount: Math.max(0, (prev.trashCount || 1) - 1) } : prev);
    });

    showToast('Նիշքը հաջողությամբ վերականգնվեց');

    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'restore', fileIds: [file.id] })
      });
      const data = await res.json();
      if (!data.success) {
        openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց վերականգնել նիշքը', onConfirm: closeDialog });
        loadMedia();
      }
    } catch (err: any) {
      openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ նիշքը վերականգնելիս', onConfirm: closeDialog });
      loadMedia();
    }
  };

  // Batch restore from trash
  const handleBatchRestore = async () => {
    const idsToRestore = Array.from(selectedFileIds);
    if (idsToRestore.length === 0) return;

    animateAndExecute(idsToRestore, 'restore', () => {
      setFiles(prev => prev.map(f => idsToRestore.includes(f.id) ? { ...f, isTrashed: false, trashedAt: undefined } : f));
      setSelectedFileIds(new Set());
      if (previewFile && idsToRestore.includes(previewFile.id)) setPreviewFile(null);
      setStats(prev => prev ? { ...prev, trashCount: Math.max(0, (prev.trashCount || idsToRestore.length) - idsToRestore.length) } : prev);
    });

    showToast(`${idsToRestore.length} նիշք վերականգնվեց`);

    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'restore', fileIds: idsToRestore })
      });
      const data = await res.json();
      if (!data.success) {
        openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց վերականգնել նիշքերը', onConfirm: closeDialog });
        loadMedia();
      }
    } catch (err: any) {
      openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ նիշքերը վերականգնելիս', onConfirm: closeDialog });
      loadMedia();
    }
  };

  // Permanently delete single file from Supabase & disk (with warning if used in website)
  const handlePermanentDelete = async (file: MediaFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isUsed = file.usedIn && file.usedIn.length > 0;

    const executePermanentDelete = () => {
      animateAndExecute([file.id], 'delete', () => {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        setSelectedFileIds(prev => { const next = new Set(prev); next.delete(file.id); return next; });
        if (previewFile?.id === file.id) setPreviewFile(null);
        setStats(prev => prev ? { ...prev, trashCount: Math.max(0, (prev.trashCount || 1) - 1), totalFiles: Math.max(0, (prev.totalFiles || 1) - 1) } : prev);
      });

      showToast('Նիշքը ընդմիշտ ջնջվեց Supabase-ից');

      fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'permanentDelete', fileIds: [file.id] })
      }).then(res => res.json()).then(data => {
        if (!data.success) {
          openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց ընդմիշտ ջնջել նիշքը', onConfirm: closeDialog });
          loadMedia();
        }
      }).catch(err => {
        openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ նիշքը ընդմիշտ ջնջելիս', onConfirm: closeDialog });
        loadMedia();
      });
    };

    openDialog({
      type: isUsed ? 'warning' : 'danger',
      title: isUsed ? '⚠️ Զգուշացում․ Ընդմիշտ ջնջվող նիշքը օգտագործվում է կայքում' : '💥 Ընդմիշտ ջնջում',
      message: isUsed
        ? `«${file.name}» նիշքը օգտագործվում է կայքի ${file.usedIn!.length} հատվածում: Ընդմիշտ ջնջելու դեպքում այն կջնջվի Supabase-ից անվերադարձ և կայքի այդ հատվածները կկոտրվեն:`
        : `Վստա՞հ եք, որ ցանկանում եք ԸՆԴՄԻՇՏ հեռացնել «${file.name}» նիշքը:\nԱյն կջնջվի Supabase պահոցից և սերվերից անվերադարձ:`,
      usedInList: isUsed ? file.usedIn : undefined,
      confirmText: 'Ընդմիշտ ջնջել',
      cancelText: 'Չեղարկել',
      onConfirm: () => {
        closeDialog();
        executePermanentDelete();
      }
    });
  };

  // Batch permanently delete (with warning if used in website)
  const handleBatchPermanentDelete = async () => {
    const idsToDelete = Array.from(selectedFileIds);
    if (idsToDelete.length === 0) return;

    const filesToDelete = files.filter(f => idsToDelete.includes(f.id));
    const usedFiles = filesToDelete.filter(f => f.usedIn && f.usedIn.length > 0);
    const allUsedLocations = Array.from(new Set(usedFiles.flatMap(f => f.usedIn || [])));

    const executeBatchDelete = () => {
      animateAndExecute(idsToDelete, 'delete', () => {
        setFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
        setSelectedFileIds(new Set());
        if (previewFile && idsToDelete.includes(previewFile.id)) setPreviewFile(null);
        setStats(prev => prev ? { ...prev, trashCount: Math.max(0, (prev.trashCount || idsToDelete.length) - idsToDelete.length), totalFiles: Math.max(0, (prev.totalFiles || idsToDelete.length) - idsToDelete.length) } : prev);
      });

      showToast(`${idsToDelete.length} նիշք ընդմիշտ հեռացվեց Supabase-ից`);

      fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'permanentDelete', fileIds: idsToDelete })
      }).then(res => res.json()).then(data => {
        if (!data.success) {
          openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց ընդմիշտ ջնջել նիշքերը', onConfirm: closeDialog });
          loadMedia();
        }
      }).catch(err => {
        openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ նիշքերը ջնջելիս', onConfirm: closeDialog });
        loadMedia();
      });
    };

    openDialog({
      type: usedFiles.length > 0 ? 'warning' : 'danger',
      title: usedFiles.length > 0 ? '⚠️ Զգուշացում․ Ընտրված նիշքերից որոշներն օգտագործվում են կայքում' : '💥 Ընդմիշտ ջնջում',
      message: usedFiles.length > 0
        ? `Ընտրված ${idsToDelete.length} նիշքերից ${usedFiles.length}-ը ակտիվորեն օգտագործվում են կայքում: Դրանք ընդմիշտ կջնջվեն Supabase-ից անվերադարձ:`
        : `Վստա՞հ եք, որ ցանկանում եք ԸՆԴՄԻՇՏ հեռացնել ընտրված ${idsToDelete.length} նիշքերը:\nԴրանք կջնջվեն Supabase-ից և սերվերից անվերադարձ:`,
      usedInList: usedFiles.length > 0 ? allUsedLocations : undefined,
      confirmText: 'Ընդմիշտ ջնջել',
      cancelText: 'Չեղարկել',
      onConfirm: () => {
        closeDialog();
        executeBatchDelete();
      }
    });
  };

  // Empty entire trash
  const handleEmptyTrash = async () => {
    const trashedFiles = files.filter(f => f.isTrashed);
    if (trashedFiles.length === 0) {
      openDialog({ type: 'info', title: 'Աղբարկղ', message: 'Աղբարկղը դատարկ է:', onConfirm: closeDialog });
      return;
    }

    const usedInTrash = trashedFiles.filter(f => f.usedIn && f.usedIn.length > 0);
    const allUsedLocations = Array.from(new Set(usedInTrash.flatMap(f => f.usedIn || [])));

    openDialog({
      type: usedInTrash.length > 0 ? 'warning' : 'danger',
      title: '💥 Դատարկել աղբարկղը',
      message: usedInTrash.length > 0
        ? `Աղբարկղում առկա ${trashedFiles.length} նիշքերից ${usedInTrash.length}-ը օգտագործվում են կայքում:\nԲոլոր նիշքերը կջնջվեն Supabase-ից և սերվերից ԸՆԴՄԻՇՏ:`
        : `Վստա՞հ եք, որ ցանկանում եք դատարկել աղբարկղը:\nԲոլոր ${trashedFiles.length} նիշքերը կջնջվեն Supabase-ից և սերվերից ԸՆԴՄԻՇՏ:`,
      usedInList: usedInTrash.length > 0 ? allUsedLocations : undefined,
      confirmText: 'Դատարկել աղբարկղը',
      cancelText: 'Չեղարկել',
      onConfirm: async () => {
        closeDialog();
        const trashedIds = trashedFiles.map(f => f.id);
        animateAndExecute(trashedIds, 'delete', () => {
          setFiles(prev => prev.filter(f => !f.isTrashed));
          setSelectedFileIds(new Set());
          if (previewFile && previewFile.isTrashed) setPreviewFile(null);
          setStats(prev => prev ? { ...prev, trashCount: 0, trashSize: 0, trashSizeFormatted: '0 B' } : prev);
        });

        showToast('Աղբարկղը ամբողջությամբ դատարկվեց');

        try {
          const res = await fetch('/api/admin/media/trash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: token || '' },
            body: JSON.stringify({ action: 'empty' })
          });
          const data = await res.json();
          if (!data.success) {
            openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց դատարկել աղբարկղը', onConfirm: closeDialog });
            loadMedia();
          }
        } catch (err: any) {
          openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ աղբարկղը դատարկելիս', onConfirm: closeDialog });
          loadMedia();
        }
      }
    });
  };

  // Save trash settings (auto delete & retention days)
  const handleSaveTrashSettings = async () => {
    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'updateSettings', settings: trashSettingsForm })
      });
      const data = await res.json();
      if (data.success) {
        setIsTrashSettingsModalOpen(false);
        showToast('Աղբարկղի կարգավորումները պահպանվեցին');
        loadMedia();
      } else {
        openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Չհաջողվեց պահպանել կարգավորումները', onConfirm: closeDialog });
      }
    } catch (err: any) {
      openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ կարգավորումները պահպանելիս', onConfirm: closeDialog });
    }
  };

  // Batch Copy URLs
  const handleBatchCopyUrls = () => {
    const selectedFiles = files.filter(f => selectedFileIds.has(f.id));
    const urls = selectedFiles.map(f => {
      const fullUrl = f.url.startsWith('http') ? f.url : `${window.location.origin}${f.url}`;
      return fullUrl;
    }).join('\n');

    navigator.clipboard.writeText(urls).then(() => {
      showToast(`${selectedFiles.length} նիշքի հղումներ պատճենվեցին clipboard`);
    });
  };

  // Single copy URL
  const copyUrl = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('Հղումը պատճենվեց clipboard');
    });
  };

  // Rename file
  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !newFileName.trim()) return;

    try {
      const res = await fetch('/api/admin/media/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || ''
        },
        body: JSON.stringify({
          fileId: renamingFile.id,
          newName: newFileName.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setFiles(prev => prev.map(f => f.id === renamingFile.id ? { ...f, name: newFileName.trim() } : f));
        if (previewFile?.id === renamingFile.id) {
          setPreviewFile(prev => prev ? { ...prev, name: newFileName.trim() } : null);
        }
        showToast('Նիշքը անվանափոխվեց');
        setRenamingFile(null);
      } else {
        openDialog({ type: 'alert', title: 'Սխալ', message: data.error || 'Անվանափոխումը ձախողվեց', onConfirm: closeDialog });
      }
    } catch (err: any) {
      openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ անվանափոխելիս', onConfirm: closeDialog });
    }
  };

  // Unlink media file from website usages (single usage or all usages)
  const handleUnlinkUsage = async (file: MediaFile, targetUsage?: string) => {
    openDialog({
      type: 'warning',
      title: '🔓 Ապակապել կայքից',
      message: targetUsage
        ? `Ցանկանո՞ւմ եք ապակապել «${file.name}» նիշքը «${targetUsage}» հատվածից:`
        : `Ցանկանո՞ւմ եք ապակապել «${file.name}» նիշքը կայքի բոլոր կապված հատվածներից:`,
      confirmText: 'Ապակապել',
      cancelText: 'Չեղարկել',
      onConfirm: async () => {
        closeDialog();
        try {
          const res = await fetch('/api/admin/media/unlink', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token || ''
            },
            body: JSON.stringify({
              fileId: file.id,
              url: file.url,
              targetUsage
            })
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message || 'Հղումը ապակապվեց կայքից');
            // Optimistically update usedIn for the file in state
            setFiles(prev => prev.map(f => {
              if (f.id === file.id) {
                if (targetUsage && f.usedIn) {
                  const updatedUsedIn = f.usedIn.filter(u => u !== targetUsage);
                  return { ...f, usedIn: updatedUsedIn.length > 0 ? updatedUsedIn : undefined };
                }
                return { ...f, usedIn: undefined };
              }
              return f;
            }));

            // Update previewFile if open
            if (previewFile && previewFile.id === file.id) {
              setPreviewFile(prev => {
                if (!prev) return null;
                if (targetUsage && prev.usedIn) {
                  const updated = prev.usedIn.filter(u => u !== targetUsage);
                  return { ...prev, usedIn: updated.length > 0 ? updated : undefined };
                }
                return { ...prev, usedIn: undefined };
              });
            }

            // Update usageInspectFile if open
            if (usageInspectFile && usageInspectFile.id === file.id) {
              setUsageInspectFile(prev => {
                if (!prev) return null;
                if (targetUsage && prev.usedIn) {
                  const updated = prev.usedIn.filter(u => u !== targetUsage);
                  if (updated.length === 0) return null;
                  return { ...prev, usedIn: updated };
                }
                return null;
              });
            }

            // Reload media library in background to ensure fresh synced data
            loadMedia();
          } else {
            openDialog({
              type: 'alert',
              title: 'Սխալ',
              message: data.error || 'Ապակապումը ձախողվեց',
              onConfirm: closeDialog
            });
          }
        } catch (err: any) {
          openDialog({
            type: 'alert',
            title: 'Սխալ',
            message: err.message || 'Սխալ ապակապելիս',
            onConfirm: closeDialog
          });
        }
      }
    });
  };

  // Advanced File Selection: Standard Shift + Ctrl multi-selection
  const handleFileClick = (file: MediaFile, e: React.MouseEvent) => {
    e.stopPropagation();
    // 1. Shift-click: Range selection
    if (e.shiftKey) {
      e.preventDefault();
      const currentIdx = filteredFiles.findIndex(f => f.id === file.id);
      if (currentIdx === -1) return;

      let startIdx = 0;
      if (lastSelectedFileId) {
        const lastIdx = filteredFiles.findIndex(f => f.id === lastSelectedFileId);
        if (lastIdx !== -1) {
          startIdx = lastIdx;
        }
      }

      const minIdx = Math.min(startIdx, currentIdx);
      const maxIdx = Math.max(startIdx, currentIdx);
      const rangeIds = filteredFiles.slice(minIdx, maxIdx + 1).map(f => f.id);

      setSelectedFileIds(prev => {
        if (e.ctrlKey || e.metaKey) {
          const next = new Set(prev);
          rangeIds.forEach(id => next.add(id));
          return next;
        }
        return new Set(rangeIds);
      });
      return;
    }

    // 2. Ctrl / Cmd click: Toggle individual file without clearing others
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setSelectedFileIds(prev => {
        const next = new Set(prev);
        if (next.has(file.id)) {
          next.delete(file.id);
        } else {
          next.add(file.id);
        }
        return next;
      });
      setLastSelectedFileId(file.id);
      return;
    }

    // 3. Normal single click: If already selected, toggle off (deselect); otherwise select only this file
    setSelectedFileIds(prev => {
      if (prev.has(file.id)) {
        if (prev.size === 1) {
          setLastSelectedFileId(null);
          return new Set();
        }
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      }
      setLastSelectedFileId(file.id);
      return new Set([file.id]);
    });
  };

  // Double click: open preview
  const handleFileDoubleClick = (file: MediaFile, e: React.MouseEvent) => {
    e.stopPropagation();
    openPreview(file);
  };

  // Checkbox toggle (supporting shift-click range as well)
  const toggleSelectFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedFileId) {
      const currentIdx = filteredFiles.findIndex(f => f.id === fileId);
      const lastIdx = filteredFiles.findIndex(f => f.id === lastSelectedFileId);
      if (currentIdx !== -1 && lastIdx !== -1) {
        const minIdx = Math.min(lastIdx, currentIdx);
        const maxIdx = Math.max(lastIdx, currentIdx);
        const rangeIds = filteredFiles.slice(minIdx, maxIdx + 1).map(f => f.id);
        setSelectedFileIds(prev => {
          const next = new Set(prev);
          rangeIds.forEach(id => next.add(id));
          return next;
        });
        return;
      }
    }

    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
    setLastSelectedFileId(fileId);
  };

  // Toggle selection for a folder
  const toggleSelectFolder = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // Batch delete folders
  const handleBatchDeleteFolders = async (folderIdsToDelete?: string[]) => {
    const ids = folderIdsToDelete || Array.from(selectedFolderIds);
    if (ids.length === 0) return;

    const folderNames = ids.map(id => folderMap.get(id)?.name || 'պանակ').join(', ');
    const totalFiles = ids.reduce((acc, fId) => acc + (folderStats.get(fId)?.count || 0), 0);
    const confirmMessage = ids.length === 1
      ? `«${folderNames}» պանակում առկա է ${totalFiles} նիշք: Ջնջելու դեպքում բոլոր նիշքերը կտեղափոխվեն վերադաս մակարդակ: Վստա՞հ եք, որ ցանկանում եք ջնջել պանակը:`
      : `Վստա՞հ եք, որ ցանկանում եք ջնջել ընտրված ${ids.length} պանակները:\nԲոլոր նիշքերը կտեղափոխվեն վերադաս մակարդակ:`;

    openDialog({
      type: 'danger',
      title: '🗑️ Պանակների ջնջում',
      message: confirmMessage,
      confirmText: 'Ջնջել պանակները',
      cancelText: 'Չեղարկել',
      onConfirm: async () => {
        closeDialog();
        showToast(`${ids.length} պանակ ջնջվում է...`);

        // Optimistically remove from state
        setFolders(prev => prev.filter(f => !ids.includes(f.id)));
        setFiles(prev => prev.map(file => {
          if (file.folderId && ids.includes(file.folderId)) {
            const fObj = folderMap.get(file.folderId);
            return { ...file, folderId: fObj?.parentId || null };
          }
          return file;
        }));
        setSelectedFolderIds(new Set());

        if (currentFolderId && ids.includes(currentFolderId)) {
          navigateToFolder(null);
        }

        try {
          for (const fId of ids) {
            await fetch(`/api/admin/media/folders?id=${encodeURIComponent(fId)}`, {
              method: 'DELETE',
              headers: { Authorization: token || '' }
            });
          }
          showToast(`${ids.length} պանակ ջնջվեց`);
          loadMedia();
        } catch (err: any) {
          openDialog({ type: 'alert', title: 'Սխալ', message: err.message || 'Սխալ պանակները ջնջելիս', onConfirm: closeDialog });
          loadMedia();
        }
      }
    });
  };

  // Batch move both selected folders and selected files
  const handleBatchMoveSelected = async (targetFolderId: string | null) => {
    const fileIds = Array.from(selectedFileIds);
    const folderIds = Array.from(selectedFolderIds);

    if (fileIds.length === 0 && folderIds.length === 0) {
      setIsMoveModalOpen(false);
      return;
    }

    if (targetFolderId === 'trash') {
      openDialog({
        type: 'warning',
        title: 'Անհնար է տեղափոխել',
        message: 'Պանակները հնարավոր չէ տեղափոխել աղբարկղ:',
        onConfirm: closeDialog
      });
      return;
    }

    const invalidFolders = folderIds.filter(fId => fId === targetFolderId || isDescendantFolder(fId, targetFolderId));
    if (invalidFolders.length > 0) {
      openDialog({
        type: 'warning',
        title: 'Անհնար է տեղափոխել',
        message: 'Պանակը չի կարող տեղափոխվել իր իսկ կամ իր ենթապանակի մեջ:',
        onConfirm: closeDialog
      });
      return;
    }

    setIsMoveModalOpen(false);

    if (fileIds.length > 0) {
      await handleMoveFiles(targetFolderId, fileIds);
    }

    if (folderIds.length > 0) {
      for (const fId of folderIds) {
        await handleMoveFolder(fId, targetFolderId);
      }
      setSelectedFolderIds(new Set());
    }
  };

  const handleSelectAll = () => {
    const isAllFilesSelected = filteredFiles.length === 0 || selectedFileIds.size === filteredFiles.length;
    const isAllFoldersSelected = currentSubfolders.length === 0 || selectedFolderIds.size === currentSubfolders.length;

    if (isAllFilesSelected && isAllFoldersSelected && (selectedFileIds.size > 0 || selectedFolderIds.size > 0)) {
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setLastSelectedFileId(null);
    } else {
      setSelectedFileIds(new Set(filteredFiles.map(f => f.id)));
      if (currentFolderId !== 'trash' && currentFolderId !== 'gallery') {
        setSelectedFolderIds(new Set(currentSubfolders.map(f => f.id)));
      }
    }
  };

  const handleDeselectAll = () => {
    setSelectedFileIds(new Set());
    setSelectedFolderIds(new Set());
    setLastSelectedFileId(null);
  };

  // Global Keyboard Shortcuts (Ctrl+A, Delete, Escape, Arrow keys, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ctrl+A / Cmd+A -> Select all items in current view
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A' || e.key === 'ա' || e.key === 'Ա')) {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Escape -> Close context menu / active modal / preview or clear selection
      if (e.key === 'Escape') {
        if (contextMenu.isOpen) {
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        } else if (previewFile) {
          closePreview();
        } else if (isMoveModalOpen) {
          setIsMoveModalOpen(false);
        } else if (isFolderModalOpen) {
          setIsFolderModalOpen(false);
        } else if (isTrashSettingsModalOpen) {
          setIsTrashSettingsModalOpen(false);
        } else if (renamingFile) {
          setRenamingFile(null);
        } else if (selectedFileIds.size > 0 || selectedFolderIds.size > 0) {
          handleDeselectAll();
        }
        return;
      }

      // Delete / Backspace -> Move to Trash, Permanent Delete, or Delete selected folders
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedFileIds.size > 0 || selectedFolderIds.size > 0)) {
        e.preventDefault();
        if (selectedFolderIds.size > 0) {
          handleBatchDeleteFolders();
        } else if (currentFolderId === 'trash') {
          handleBatchPermanentDelete();
        } else {
          handleBatchMoveToTrash();
        }
        return;
      }

      // Enter -> Open preview if single file is selected
      if (e.key === 'Enter' && selectedFileIds.size === 1 && selectedFolderIds.size === 0) {
        const selId = Array.from(selectedFileIds)[0];
        const f = filteredFiles.find(item => item.id === selId);
        if (f) {
          e.preventDefault();
          openPreview(f);
          return;
        }
      }

      // Arrow keys navigation (ArrowDown, ArrowUp, ArrowRight, ArrowLeft)
      if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key) && filteredFiles.length > 0) {
        e.preventDefault();
        let currIdx = -1;
        if (lastSelectedFileId) {
          currIdx = filteredFiles.findIndex(f => f.id === lastSelectedFileId);
        } else if (selectedFileIds.size > 0) {
          const firstSelected = Array.from(selectedFileIds)[0];
          currIdx = filteredFiles.findIndex(f => f.id === firstSelected);
        }

        let nextIdx = 0;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          nextIdx = currIdx === -1 ? 0 : Math.min(filteredFiles.length - 1, currIdx + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          nextIdx = currIdx === -1 ? 0 : Math.max(0, currIdx - 1);
        }

        const nextFile = filteredFiles[nextIdx];
        if (!nextFile) return;

        if (e.shiftKey) {
          const startIdx = currIdx === -1 ? 0 : (lastSelectedFileId ? filteredFiles.findIndex(f => f.id === lastSelectedFileId) : 0);
          const minIdx = Math.min(startIdx, nextIdx);
          const maxIdx = Math.max(startIdx, nextIdx);
          const rangeIds = filteredFiles.slice(minIdx, maxIdx + 1).map(f => f.id);
          setSelectedFileIds(new Set(rangeIds));
        } else {
          setSelectedFileIds(new Set([nextFile.id]));
          setLastSelectedFileId(nextFile.id);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredFiles,
    currentSubfolders,
    selectedFileIds,
    selectedFolderIds,
    lastSelectedFileId,
    previewFile,
    isMoveModalOpen,
    isFolderModalOpen,
    isTrashSettingsModalOpen,
    renamingFile,
    currentFolderId,
    contextMenu.isOpen
  ]);

  // Close context menu on global click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.isOpen) {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu.isOpen]);

  // Toggle tree expansion
  const toggleTreeFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // Drag avatar coordinate & inertia tilt tracking (Ultra-smooth 60fps physics loop with icon-to-mouse & continuous floating levitation)
  const triggerDragEndAnimation = useCallback((targetFolderId?: string | null) => {
    const p = dragPhysicsRef.current;
    if (!p.active || p.isEnding) return;
    p.isEnding = true;
    p.endTime = performance.now();
    p.startX = p.currentX;
    p.startY = p.currentY;
    p.startScale = p.scale;

    // Locate target folder element if dropped on a folder
    let targetEl: Element | null = null;
    if (targetFolderId !== undefined) {
      if (targetFolderId === null) {
        targetEl = document.querySelector('[data-folder-id="root"]');
      } else if (targetFolderId === 'trash') {
        targetEl = document.querySelector('[data-folder-id="trash"]');
      } else {
        targetEl = document.querySelector(`[data-folder-id="${targetFolderId}"]`);
      }
    }

    if (targetEl) {
      const fRect = targetEl.getBoundingClientRect();
      p.targetX = fRect.left + fRect.width / 2 - 38;
      p.targetY = fRect.top + fRect.height / 2 - 38;
      p.targetScale = 0.2;
    } else {
      // Rebound / fly smoothly back to original file thumbnail position!
      p.targetX = p.originX;
      p.targetY = p.originY;
      p.targetScale = p.originScale;
    }

    dragOverFolderIdRef.current = null;
    setDragOverFolderId(null);
  }, []);

  const updateDragCoords = useCallback((clientX: number, clientY: number) => {
    const now = performance.now();
    const p = dragPhysicsRef.current;
    if (!p.active || p.isEnding) return;
    const dt = Math.max(1, now - p.lastEventTime);
    const dx = clientX - p.lastEventX;
    const speedX = dx / dt; // velocity in px/ms

    p.targetX = clientX - (dragAvatar.folder || (dragAvatar.folders && dragAvatar.folders.length > 0) ? 45 : 38);
    p.targetY = clientY - (dragAvatar.folder || (dragAvatar.folders && dragAvatar.folders.length > 0) ? 35 : 38);
    // Clamped inertia tilt based on horizontal velocity
    p.targetTilt = Math.max(-22, Math.min(22, speedX * 26));
    p.lastEventX = clientX;
    p.lastEventTime = now;
  }, [dragAvatar.folder, dragAvatar.folders]);

  useEffect(() => {
    if (!dragAvatar.isDragging) return;

    let animId: number;

    const updatePhysics = () => {
      if (!dragPhysicsRef.current.active) return;
      const p = dragPhysicsRef.current;
      const now = performance.now();

      if (p.isEnding) {
        const elapsed = now - p.endTime;
        const progress = Math.min(1, Math.max(0, elapsed / p.endDuration));
        const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out

        p.currentX = p.startX + (p.targetX - p.startX) * ease;
        p.currentY = p.startY + (p.targetY - p.startY) * ease;
        p.scale = p.startScale + (p.targetScale - p.startScale) * ease;
        p.opacity = Math.max(0, 1 - progress);
        p.currentTilt *= 0.85;

        if (progress >= 1) {
          p.active = false;
          setDragAvatar(prev => ({ ...prev, isDragging: false }));
          return;
        }
      } else {
        const spawnElapsed = now - p.startTime;
        if (spawnElapsed < p.spawnDuration) {
          // Smooth 300ms cubic ease-out spawn from thumbnail origin to mouse
          const spawnProgress = Math.min(1, Math.max(0, spawnElapsed / p.spawnDuration));
          const ease = 1 - Math.pow(1 - spawnProgress, 3);

          p.currentX = p.originX + (p.targetX - p.originX) * ease;
          p.currentY = p.originY + (p.targetY - p.originY) * ease;
          p.scale = p.originScale + (1.0 - p.originScale) * ease;
          p.opacity = 0.95 + 0.05 * ease;
        } else {
          // Normal dragging phase: follow mouse smoothly with inertia
          p.currentX += (p.targetX - p.currentX) * 0.28;
          p.currentY += (p.targetY - p.currentY) * 0.28;
          p.scale += (1.0 - p.scale) * 0.28;
          p.opacity = 1.0;
        }

        // Tilt follows velocity with spring lerp
        p.currentTilt += (p.targetTilt - p.currentTilt) * 0.18;
        p.targetTilt *= 0.88;
      }

      // Continuous subtle organic floating/levitation motion (never completely static, even when holding still over drop target)
      const hoverY = p.isEnding ? 0 : Math.sin(now * 0.0052) * 4.2;
      const hoverTilt = p.isEnding ? 0 : Math.sin(now * 0.0034) * 2.4;

      if (dragAvatarRef.current) {
        dragAvatarRef.current.style.transform = `translate3d(${p.currentX.toFixed(1)}px, ${(p.currentY + hoverY).toFixed(1)}px, 0) rotate(${(p.currentTilt + hoverTilt).toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;
        dragAvatarRef.current.style.opacity = p.opacity.toFixed(3);
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);

    const handleGlobalDragOver = (e: DragEvent) => {
      updateDragCoords(e.clientX, e.clientY);
    };

    const handleGlobalDragEnd = () => {
      triggerDragEndAnimation(dragOverFolderIdRef.current);
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('drop', handleGlobalDragEnd);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('drop', handleGlobalDragEnd);
    };
  }, [dragAvatar.isDragging, triggerDragEndAnimation, updateDragCoords]);

  // Drag and Drop files onto folder cards/tree items
  const handleDragStart = (fileId: string, e: React.DragEvent) => {
    const toMove = selectedFileIds.has(fileId) ? Array.from(selectedFileIds) : [fileId];
    setDraggedFileIds(toMove);
    e.dataTransfer.setData('text/plain', JSON.stringify(toMove));
    e.dataTransfer.effectAllowed = 'move';

    // Collect dragged file objects (primary file first, then the rest)
    const primary = files.find(f => f.id === fileId);
    const otherFiles = toMove
      .filter(id => id !== fileId)
      .map(id => files.find(f => f.id === id))
      .filter(Boolean) as MediaFile[];
    const dragFilesList = primary ? [primary, ...otherFiles] : otherFiles;

    // Create transparent drag image to hide default browser drag ghost
    try {
      const img = new Image();
      img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4=';
      e.dataTransfer.setDragImage(img, 0, 0);
    } catch (err) {}

    const el = e.currentTarget as HTMLElement | null;
    let originX = e.clientX - 38;
    let originY = e.clientY - 38;
    let originScale = 2.2;

    if (el) {
      // Target the exact thumbnail container inside the dragged card
      const thumbEl = el.querySelector('[data-thumbnail-img="true"]') || el.querySelector('img') || el.querySelector('svg') || el;
      const rect = (thumbEl || el).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      originX = centerX - 38;
      originY = centerY - 38;
      originScale = Math.max(0.8, Math.min(3.5, rect.width / 76));
    }

    const now = performance.now();
    dragPhysicsRef.current = {
      targetX: e.clientX - 38,
      targetY: e.clientY - 38,
      currentX: originX,
      currentY: originY,
      originX,
      originY,
      originScale,
      targetTilt: 0,
      currentTilt: 0,
      scale: originScale, // Starts at the exact position and scale of the file thumbnail!
      targetScale: 1.0,   // Shrinks and glides to mouse cursor!
      opacity: 1.0,
      targetOpacity: 1.0,
      lastEventX: e.clientX,
      lastEventTime: now,
      startTime: now,
      spawnDuration: 300,
      active: true,
      isEnding: false,
      endTime: 0,
      endDuration: 280,
      startX: originX,
      startY: originY,
      startScale: originScale
    };

    setDragAvatar({
      isDragging: true,
      count: toMove.length,
      files: dragFilesList
    });
  };

  // Drag Start for folders (supports multi-folder drag)
  const handleFolderDragStart = (folderId: string, e: React.DragEvent) => {
    e.stopPropagation();
    const toMoveFolderIds = selectedFolderIds.has(folderId) ? Array.from(selectedFolderIds) : [folderId];
    setDraggedFolderId(folderId);
    setDraggedFolderIds(toMoveFolderIds);
    setDraggedFileIds([]);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folders', folderIds: toMoveFolderIds }));
    e.dataTransfer.effectAllowed = 'move';

    const primaryFolder = folderMap.get(folderId);
    const draggedFolderObjects = toMoveFolderIds.map(id => folderMap.get(id)).filter(Boolean) as MediaFolder[];

    // Create transparent drag image to hide default browser drag ghost
    try {
      const img = new Image();
      img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4=';
      e.dataTransfer.setDragImage(img, 0, 0);
    } catch (err) {}

    const el = e.currentTarget as HTMLElement | null;
    let originX = e.clientX - 45;
    let originY = e.clientY - 35;
    let originScale = 1.4;

    if (el) {
      const rect = el.getBoundingClientRect();
      originX = rect.left + rect.width / 2 - 45;
      originY = rect.top + rect.height / 2 - 35;
      originScale = Math.max(0.8, Math.min(2.0, rect.width / 90));
    }

    const now = performance.now();
    dragPhysicsRef.current = {
      targetX: e.clientX - 45,
      targetY: e.clientY - 35,
      currentX: originX,
      currentY: originY,
      originX,
      originY,
      originScale,
      targetTilt: 0,
      currentTilt: 0,
      scale: originScale,
      targetScale: 1.0,
      opacity: 1.0,
      targetOpacity: 1.0,
      lastEventX: e.clientX,
      lastEventTime: now,
      startTime: now,
      spawnDuration: 260,
      active: true,
      isEnding: false,
      endTime: 0,
      endDuration: 240,
      startX: originX,
      startY: originY,
      startScale: originScale
    };

    setDragAvatar({
      isDragging: true,
      count: toMoveFolderIds.length,
      files: [],
      folder: primaryFolder || null,
      folders: draggedFolderObjects
    });
  };

  const handleDragEnd = () => {
    triggerDragEndAnimation(dragOverFolderIdRef.current);
    setDraggedFolderId(null);
    setDraggedFolderIds([]);
    setDraggedFileIds([]);
  };

  const handleFolderDragOver = (folderId: string | null, e: React.DragEvent) => {
    e.preventDefault();
    updateDragCoords(e.clientX, e.clientY);

    // When dragging folder(s), disallow dropping onto itself or its descendants or into trash
    const currentFolderIds = draggedFolderIds.length > 0 ? draggedFolderIds : (draggedFolderId ? [draggedFolderId] : []);
    if (currentFolderIds.length > 0) {
      const isInvalid = currentFolderIds.some(fId => fId === folderId || isDescendantFolder(fId, folderId)) || folderId === 'trash';
      if (isInvalid) {
        e.dataTransfer.dropEffect = 'none';
        if (dragOverFolderIdRef.current !== null) {
          dragOverFolderIdRef.current = null;
          setDragOverFolderId(null);
        }
        return;
      }
    }

    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderIdRef.current !== folderId) {
      dragOverFolderIdRef.current = folderId;
      setDragOverFolderId(folderId);
    }
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverFolderIdRef.current = null;
    setDragOverFolderId(null);
  };

  const handleFolderDrop = (targetFolderId: string | null, e: React.DragEvent) => {
    e.preventDefault();
    triggerDragEndAnimation(targetFolderId);

    // Check if dragging files from computer
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
      return;
    }

    // Dropping folder(s)
    const currentFolderIds = draggedFolderIds.length > 0 ? draggedFolderIds : (draggedFolderId ? [draggedFolderId] : []);
    if (currentFolderIds.length > 0) {
      setDraggedFolderId(null);
      setDraggedFolderIds([]);
      currentFolderIds.forEach(folderToMove => {
        if (folderToMove !== targetFolderId && !isDescendantFolder(folderToMove, targetFolderId) && targetFolderId !== 'trash') {
          handleMoveFolder(folderToMove, targetFolderId);
        }
      });
      setSelectedFolderIds(new Set());
      return;
    }

    // Dropping files
    if (draggedFileIds.length > 0) {
      handleMoveFiles(targetFolderId, draggedFileIds);
      setDraggedFileIds([]);
      setSelectedFileIds(new Set());
    }
  };

  // Marquee (rubber-band) selection event listeners
  useEffect(() => {
    if (!marqueeRect) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - marqueeRect.startX);
      const dy = Math.abs(e.clientY - marqueeRect.startY);

      if (dx > 4 || dy > 4) {
        marqueeHasDraggedRef.current = true;
      }

      setMarqueeRect(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);

      if (dx <= 4 && dy <= 4) return;

      const left = Math.min(marqueeRect.startX, e.clientX);
      const right = Math.max(marqueeRect.startX, e.clientX);
      const top = Math.min(marqueeRect.startY, e.clientY);
      const bottom = Math.max(marqueeRect.startY, e.clientY);

      if (!mainAreaRef.current) return;
      const fileCards = mainAreaRef.current.querySelectorAll<HTMLElement>('[data-file-id]');
      const hitFileIds = new Set<string>();

      fileCards.forEach(card => {
        const fileId = card.getAttribute('data-file-id');
        if (!fileId) return;
        const rect = card.getBoundingClientRect();
        const intersects = !(rect.right < left || rect.left > right || rect.bottom < top || rect.top > bottom);
        if (intersects) {
          hitFileIds.add(fileId);
        }
      });

      const folderCards = mainAreaRef.current.querySelectorAll<HTMLElement>('.media-folder-card[data-folder-id]');
      const hitFolderIds = new Set<string>();

      folderCards.forEach(card => {
        const folderId = card.getAttribute('data-folder-id');
        if (!folderId) return;
        const rect = card.getBoundingClientRect();
        const intersects = !(rect.right < left || rect.left > right || rect.bottom < top || rect.top > bottom);
        if (intersects) {
          hitFolderIds.add(folderId);
        }
      });

      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        const combinedFiles = new Set<string>(marqueeInitialSelectionRef.current);
        hitFileIds.forEach(id => combinedFiles.add(id));
        setSelectedFileIds(combinedFiles);

        const combinedFolders = new Set<string>(marqueeInitialFolderSelectionRef.current);
        hitFolderIds.forEach(id => combinedFolders.add(id));
        setSelectedFolderIds(combinedFolders);
      } else {
        setSelectedFileIds(hitFileIds);
        setSelectedFolderIds(hitFolderIds);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!marqueeHasDraggedRef.current && !(e.shiftKey || e.ctrlKey || e.metaKey)) {
        setSelectedFileIds(new Set());
        setSelectedFolderIds(new Set());
        setLastSelectedFileId(null);
      }
      setMarqueeRect(null);
      setTimeout(() => {
        marqueeHasDraggedRef.current = false;
      }, 60);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [marqueeRect]);

  const handleMainAreaMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (target.closest('button, input, select, textarea, a, .media-file-card, .media-folder-card, .media-sidebar-nav-item, .media-file-list-item, .media-table-row, .media-file-tile-item, [data-interactive="true"], [data-file-id], [data-folder-id]')) {
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    marqueeHasDraggedRef.current = false;
    marqueeInitialSelectionRef.current = (e.shiftKey || e.ctrlKey || e.metaKey) ? new Set(selectedFileIds) : new Set();
    marqueeInitialFolderSelectionRef.current = (e.shiftKey || e.ctrlKey || e.metaKey) ? new Set(selectedFolderIds) : new Set();

    setMarqueeRect({
      startX,
      startY,
      currentX: startX,
      currentY: startY
    });
  };

  // Window drop for direct desktop drag upload
  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      setIsDraggingOverDropzone(true);
    }
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverDropzone(false);
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverDropzone(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Render tree item recursively for Left Navigation Pane
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
          data-folder-id={folder.id}
          className={`media-sidebar-nav-item ${isSelected ? 'is-selected' : ''}`}
          draggable={true}
          onDragStart={e => handleFolderDragStart(folder.id, e)}
          onDragEnd={handleDragEnd}
          onClick={() => navigateToFolder(folder.id)}
          onContextMenu={e => openContextMenu(e, 'folder', { folder })}
          onDragOver={e => handleFolderDragOver(folder.id, e)}
          onDragLeave={handleFolderDragLeave}
          onDrop={e => handleFolderDrop(folder.id, e)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `6px 8px 6px ${depth * 14 + 10}px`,
            borderRadius: '8px',
            cursor: 'grab',
            fontSize: '0.85rem',
            color: isSelected ? '#ffffff' : 'var(--fg)',
            background: isSelected 
              ? 'var(--accent)' 
              : isDragTarget 
              ? 'rgba(59, 130, 246, 0.25)' 
              : 'transparent',
            border: isDragTarget ? '1px dashed #3b82f6' : '1px solid transparent',
            transition: 'all 0.15s ease',
            userSelect: 'none'
          }}
          title={`${folder.name} (${stat.count} նիշք • ${stat.sizeFormatted})`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            {hasChildren ? (
              <span
                onClick={e => toggleTreeFolder(folder.id, e)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: isSelected ? '#ffffff' : 'var(--muted)',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease'
                }}
              >
                ▶
              </span>
            ) : (
              <span style={{ width: '18px', display: 'inline-block' }} />
            )}

            {/* Folder Icon tinted with custom color */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={folder.color || '#3B82F6'}
              stroke={isSelected ? '#ffffff' : folder.color || '#3B82F6'}
              strokeWidth="1.5"
              style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>

            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: isSelected ? 600 : 400
              }}
            >
              {folder.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--panel-border)',
                color: isSelected ? '#ffffff' : 'var(--muted)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title={`${folder.name}՝ ${stat.count} նիշք • ${stat.sizeFormatted}`}
            >
              <span>{stat.count}</span>
              <span style={{ opacity: 0.7, fontSize: '0.66rem' }}>• {stat.sizeFormatted}</span>
            </span>

            {/* Actions button */}
            <button
              type="button"
              onClick={e => handleOpenEditFolder(folder, e)}
              title="Կարգավորել գույնը / անունը"
              style={{
                background: 'transparent',
                border: 'none',
                color: isSelected ? '#ffffff' : 'var(--muted)',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                opacity: 0.8
              }}
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Child folders */}
        {hasChildren && isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {subfolders.map(sf => renderFolderTreeNode(sf, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Helper for rendering file thumbnail
  const renderThumbnail = (file: MediaFile, size: 'small' | 'medium' | 'large' = 'medium') => {
    const isImg = file.type === 'image' || file.type === 'vector';
    const isVid = file.type === 'video';
    const isFont = file.type === 'font';
    const isAudio = file.type === 'audio';

    if (isImg) {
      return (
        <div data-thumbnail-img="true" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#090a0f' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.url}
            alt={file.name}
            loading="lazy"
            draggable={false}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
              userSelect: 'none',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      );
    }

    if (isVid) {
      return (
        <div data-thumbnail-img="true" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', color: '#818cf8', position: 'relative' }}>
          <svg width={size === 'large' ? 44 : 28} height={size === 'large' ? 44 : 28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: '4px', letterSpacing: '0.05em' }}>VIDEO</span>
        </div>
      );
    }

    if (isFont) {
      return (
        <div data-thumbnail-img="true" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', color: '#34d399' }}>
          <span style={{ fontSize: size === 'large' ? '2.4rem' : '1.4rem', fontWeight: 700, fontFamily: 'serif' }}>Aa</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>{file.extension.toUpperCase()}</span>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div data-thumbnail-img="true" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #701a75 0%, #4a044e 100%)', color: '#f472b6' }}>
          <svg width={size === 'large' ? 40 : 26} height={size === 'large' ? 40 : 26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>AUDIO</span>
        </div>
      );
    }

    return (
      <div data-thumbnail-img="true" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--panel)', color: 'var(--muted)' }}>
        <svg width={size === 'large' ? 36 : 24} height={size === 'large' ? 36 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '2px' }}>{file.extension.toUpperCase()}</span>
      </div>
    );
  };

  // Sticky header base top (70px on desktop)
  const headerStickyTopOffset = 70;
  // Distance from sticky header to sticky sidebar is ALWAYS exactly 16px (same as in normal unscrolled state)
  const sidebarStickyTop = headerStickyTopOffset + headerHeight + 16;
  const sidebarMaxHeight = `calc(100vh - ${sidebarStickyTop + 24}px)`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        minHeight: '750px',
        color: 'var(--fg)',
        position: 'relative'
      }}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
    >
      <style>{`
        .admin-media-header-sticky {
          position: sticky;
          top: 70px;
          z-index: 40;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .admin-media-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 16px;
          align-items: start;
        }
        .admin-media-sidebar-sticky {
          position: sticky;
          top: 240px;
          z-index: 30;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        @media (max-width: 900px) {
          .admin-media-header-sticky {
            top: 55px;
          }
          .admin-media-grid {
            grid-template-columns: 1fr;
          }
          .admin-media-sidebar-sticky {
            position: relative;
            top: 0 !important;
            max-height: 280px !important;
          }
        }
        .media-file-card {
          position: relative;
          transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s ease, background 0.18s ease;
        }
        .media-file-card:hover {
          transform: translateY(-3px);
          border-color: rgba(59, 130, 246, 0.6) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(59, 130, 246, 0.25) !important;
        }
        .media-file-list-item {
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .media-file-list-item:hover {
          background: rgba(59, 130, 246, 0.08) !important;
          border-color: rgba(59, 130, 246, 0.45) !important;
          transform: translateX(3px);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        }
        .media-file-tile-item {
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .media-file-tile-item:hover {
          background: rgba(59, 130, 246, 0.08) !important;
          border-color: rgba(59, 130, 246, 0.45) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12) !important;
        }
        .media-folder-card {
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .media-folder-card:hover {
          transform: translateY(-2px);
          border-color: rgba(59, 130, 246, 0.6) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
        }
        .media-folder-card:hover .folder-checkbox {
          opacity: 1 !important;
        }
        .media-folder-card.is-selected {
          border-color: #3B82F6 !important;
          background: rgba(59, 130, 246, 0.14) !important;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.22) !important;
        }
        @keyframes dragCardBobTop {
          0% { transform: rotate(-10deg) translateY(0px) scale(0.98); }
          50% { transform: rotate(-7deg) translateY(-4px) scale(0.99); }
          100% { transform: rotate(-12deg) translateY(3px) scale(0.975); }
        }
        @keyframes dragCardBobMid {
          0% { transform: rotate(0deg) translateY(0px) scale(0.95); }
          50% { transform: rotate(3deg) translateY(3px) scale(0.96); }
          100% { transform: rotate(-3deg) translateY(-3px) scale(0.945); }
        }
        @keyframes dragCardBobBottom {
          0% { transform: rotate(10deg) translateY(0px) scale(0.92); }
          50% { transform: rotate(13deg) translateY(-3px) scale(0.935); }
          100% { transform: rotate(7deg) translateY(4px) scale(0.915); }
        }
        @keyframes dragSingleCardBob {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-3px) scale(1.015); }
          100% { transform: translateY(3px) scale(0.99); }
        }
        .media-table-row {
          transition: background 0.12s ease;
        }
        .media-table-row:hover {
          background: rgba(59, 130, 246, 0.09) !important;
        }
        .media-table-header-cell {
          transition: background 0.15s ease, color 0.15s ease;
        }
        .media-table-header-cell:hover {
          background: rgba(59, 130, 246, 0.12) !important;
          color: #3B82F6 !important;
        }
        .media-sidebar-nav-item {
          transition: all 0.15s ease;
        }
        .media-sidebar-nav-item:hover {
          background: rgba(59, 130, 246, 0.12) !important;
          transform: translateX(2px);
        }
        .media-sidebar-nav-item.is-selected {
          background: var(--accent) !important;
          color: #ffffff !important;
        }
        .media-sidebar-nav-item.is-selected:hover {
          background: #93c5fd !important;
          color: #0f172a !important;
        }
        .media-sidebar-nav-item.is-selected:hover span,
        .media-sidebar-nav-item.is-selected:hover div,
        .media-sidebar-nav-item.is-selected:hover button {
          color: #0f172a !important;
        }
        .media-sidebar-nav-item.is-trash-selected.is-selected {
          background: #EF4444 !important;
          color: #ffffff !important;
        }
        .media-sidebar-nav-item.is-trash-selected.is-selected:hover {
          background: #fca5a5 !important;
          color: #450a0a !important;
        }
        .media-sidebar-nav-item.is-trash-selected.is-selected:hover span,
        .media-sidebar-nav-item.is-trash-selected.is-selected:hover div {
          color: #450a0a !important;
        }
        .media-pill-btn {
          transition: all 0.15s ease;
        }
        .media-pill-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(59, 130, 246, 0.6) !important;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }
        .media-icon-btn {
          transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .media-icon-btn:hover {
          transform: scale(1.15);
          color: var(--fg) !important;
        }
        .media-file-pin-btn {
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease, background 0.15s ease;
        }
        .media-file-pin-btn:hover {
          transform: scale(1.15);
        }
        .media-file-card:hover .media-file-pin-btn,
        .media-file-list-item:hover .media-file-pin-btn,
        .media-file-tile-item:hover .media-file-pin-btn,
        .media-file-pin-btn.is-pinned {
          opacity: 1 !important;
        }

        /* Real-time smooth exit and entry animations */
        @keyframes fileTrashExit {
          0% {
            transform: scale(1) translateY(0) rotate(0deg);
            opacity: 1;
            filter: blur(0px);
          }
          40% {
            transform: scale(0.95) translateY(-6px) rotate(1.5deg);
            opacity: 0.9;
          }
          100% {
            transform: scale(0.35) translateY(45px) rotate(-10deg);
            opacity: 0;
            filter: blur(8px);
          }
        }
        @keyframes fileDeleteExit {
          0% {
            transform: scale(1);
            opacity: 1;
            filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0));
          }
          30% {
            transform: scale(1.05);
            opacity: 1;
            filter: drop-shadow(0 0 16px rgba(239, 68, 68, 0.8)) brightness(1.25);
          }
          100% {
            transform: scale(0.25) rotate(8deg);
            opacity: 0;
            filter: drop-shadow(0 0 24px rgba(239, 68, 68, 0)) brightness(2) blur(10px);
          }
        }
        @keyframes fileMoveExit {
          0% {
            transform: scale(1) translate(0, 0);
            opacity: 1;
          }
          35% {
            transform: scale(0.96) translateY(-8px);
            opacity: 0.85;
          }
          100% {
            transform: scale(0.3) translate(-35px, -45px);
            opacity: 0;
            filter: blur(6px);
          }
        }
        @keyframes fileRestoreExit {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          35% {
            transform: scale(1.06) translateY(-10px);
            opacity: 0.9;
            filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.7));
          }
          100% {
            transform: scale(0.4) translateY(-40px);
            opacity: 0;
            filter: blur(8px);
          }
        }
        @keyframes itemEntry {
          from {
            transform: scale(0.93) translateY(8px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        .media-file-card,
        .media-file-list-item,
        .media-file-tile-item,
        .media-folder-card,
        .media-table-row {
          animation: itemEntry 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .media-file-card.is-exiting-trash,
        .media-file-list-item.is-exiting-trash,
        .media-file-tile-item.is-exiting-trash,
        .media-table-row.is-exiting-trash {
          animation: fileTrashExit 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
          pointer-events: none !important;
        }
        .media-file-card.is-exiting-delete,
        .media-file-list-item.is-exiting-delete,
        .media-file-tile-item.is-exiting-delete,
        .media-table-row.is-exiting-delete {
          animation: fileDeleteExit 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
          pointer-events: none !important;
        }
        .media-file-card.is-exiting-move,
        .media-file-list-item.is-exiting-move,
        .media-file-tile-item.is-exiting-move,
        .media-table-row.is-exiting-move {
          animation: fileMoveExit 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
          pointer-events: none !important;
        }
        .media-file-card.is-exiting-restore,
        .media-file-list-item.is-exiting-restore,
        .media-file-tile-item.is-exiting-restore,
        .media-table-row.is-exiting-restore {
          animation: fileRestoreExit 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* Toast Notification */}
      {mounted && toastMessage && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999999,
            background: '#10B981',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>,
        document.body
      )}

      {/* Invisible file input for Upload */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files) handleUploadFiles(e.target.files);
        }}
      />

      {/* Global Drag & Drop Overlay */}
      {isDraggingOverDropzone && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            background: 'rgba(59, 130, 246, 0.2)',
            backdropFilter: 'blur(4px)',
            border: '3px dashed #3B82F6',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B82F6',
            pointerEvents: 'none'
          }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '12px' }}>
            Բաց թողեք նիշքերն այստեղ
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '4px' }}>
            Նիշքերը կվերբեռնվեն ընթացիկ պանակում
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          STICKY TOP CONTAINER: Explorer Header & Multi-Selection Bar
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="admin-media-header-sticky" ref={headerContainerRef}>
        {/* Top Header Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--panel)',
            border: '1px solid var(--panel-border)',
            borderRadius: '16px',
            padding: '14px 16px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: 'none'
          }}
        >
          {/* Top Row: Address Bar, History, Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleBack}
              title="Հետ (Alt + Left)"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--panel-border)',
                color: historyIndex <= 0 ? 'var(--muted)' : 'var(--fg)',
                opacity: historyIndex <= 0 ? 0.4 : 1,
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                cursor: historyIndex <= 0 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'all 0.15s ease'
              }}
            >
              ←
            </button>
            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleForward}
              title="Առաջ (Alt + Right)"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--panel-border)',
                color: historyIndex >= history.length - 1 ? 'var(--muted)' : 'var(--fg)',
                opacity: historyIndex >= history.length - 1 ? 0.4 : 1,
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                cursor: historyIndex >= history.length - 1 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'all 0.15s ease'
              }}
            >
              →
            </button>
            <button
              type="button"
              disabled={!currentFolderId}
              onClick={handleUpLevel}
              title="Վերադաս պանակ (Alt + Up)"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--panel-border)',
                color: !currentFolderId ? 'var(--muted)' : 'var(--fg)',
                opacity: !currentFolderId ? 0.4 : 1,
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                cursor: !currentFolderId ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'all 0.15s ease'
              }}
            >
              ↑
            </button>
          </div>

          {/* Windows-like Breadcrumb Address Bar */}
          <div
            style={{
              flex: 1,
              minWidth: '240px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg)',
              border: '1px solid var(--panel-border)',
              borderRadius: '10px',
              padding: '6px 12px',
              height: '38px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id || 'root'}>
                  {idx > 0 && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>›</span>}
                  <button
                    type="button"
                    onClick={() => navigateToFolder(crumb.id)}
                    onDragOver={e => !isLast && handleFolderDragOver(crumb.id, e)}
                    onDragLeave={handleFolderDragLeave}
                    onDrop={e => !isLast && handleFolderDrop(crumb.id, e)}
                    style={{
                      background: dragOverFolderId === crumb.id 
                        ? 'rgba(59, 130, 246, 0.35)' 
                        : isLast 
                        ? 'rgba(59, 130, 246, 0.15)' 
                        : 'transparent',
                      color: isLast ? '#3B82F6' : 'var(--fg)',
                      border: dragOverFolderId === crumb.id ? '1px dashed #3B82F6' : '1px solid transparent',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: isLast ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {idx === 0 ? (
                      <span>🖥️</span>
                    ) : (
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: crumb.color || '#3B82F6',
                          display: 'inline-block'
                        }}
                      />
                    )}
                    <span>{crumb.name}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => changeSearchQuery(e.target.value)}
              placeholder="🔍 Որոնել մեդիայում..."
              style={{
                width: '100%',
                height: '38px',
                background: 'var(--bg)',
                border: '1px solid var(--panel-border)',
                borderRadius: '10px',
                padding: '0 30px 0 12px',
                color: 'var(--fg)',
                fontSize: '0.85rem'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => changeSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Second Row: Actions, View Modes, Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          {/* Main Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleOpenCreateFolder(currentFolderId)}
              style={{
                background: 'var(--panel-border)',
                color: 'var(--fg)',
                border: '1px solid var(--panel-border)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📁＋</span>
              <span>Նոր Պանակ</span>
            </button>

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: isUploading ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)'
              }}
            >
              <span>↑</span>
              <span>{isUploading ? 'Վերբեռնվում է...' : 'Վերբեռնել Նիշք'}</span>
            </button>

            {/* Quick Filter: Used in site */}
            <button
              type="button"
              className="media-pill-btn"
              onClick={() => changeUsageFilter(usageFilter === 'used' ? 'all' : 'used')}
              style={{
                background: usageFilter === 'used' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: usageFilter === 'used' ? '#10B981' : 'var(--muted)',
                border: `1px solid ${usageFilter === 'used' ? '#10B981' : 'var(--panel-border)'}`,
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🔗</span>
              <span>Կայքում օգտագործվողները</span>
            </button>

            {/* Quick Filter: Unused in site */}
            <button
              type="button"
              className="media-pill-btn"
              onClick={() => changeUsageFilter(usageFilter === 'unused' ? 'all' : 'unused')}
              style={{
                background: usageFilter === 'unused' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                color: usageFilter === 'unused' ? '#F59E0B' : 'var(--muted)',
                border: `1px solid ${usageFilter === 'unused' ? '#F59E0B' : 'var(--panel-border)'}`,
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>💤</span>
              <span>Չօգտագործվողները</span>
            </button>
          </div>

          {/* Right Section: View Mode & Sorting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Sort Field Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <select
                value={sortField}
                onChange={e => handleSortFieldChange(e.target.value as SortField)}
                style={{
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <option value="name">Անունով (Name)</option>
                <option value="size">Չափսով (Size)</option>
                <option value="modifiedAt">Ամսաթվով (Date)</option>
                <option value="type">Տեսակով (Type)</option>
                <option value="folder">Պանակով (Folder)</option>
              </select>

              <button
                type="button"
                onClick={handleSortOrderToggle}
                title={`Տեսակավորում՝ ${sortOrder === 'asc' ? 'Աճող (Ascending)' : 'Նվազող (Descending)'}`}
                style={{
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem'
                }}
              >
                {sortOrder === 'asc' ? '▲' : '▼'}
              </button>

              {sortCriteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSortCriteria([{ field: sortField, order: sortOrder }])}
                  title="Մաքրել բազմամակարդակ դասակարգումը (Reset multi-sort)"
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#3B82F6',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {sortCriteria.length} մակարդակ ✕
                </button>
              )}
            </div>

            {/* 5 View Mode Buttons (Like Windows Explorer) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg)',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                padding: '2px'
              }}
            >
              {/* Large Icons */}
              <button
                type="button"
                onClick={() => changeViewMode('large-icons')}
                title="Խոշոր պատկերակներ (Large Icons)"
                style={{
                  background: viewMode === 'large-icons' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'large-icons' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}
              >
                ⊞
              </button>

              {/* Medium Icons */}
              <button
                type="button"
                onClick={() => changeViewMode('medium-icons')}
                title="Միջին պատկերակներ (Medium Icons)"
                style={{
                  background: viewMode === 'medium-icons' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'medium-icons' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}
              >
                ⊟
              </button>

              {/* List */}
              <button
                type="button"
                onClick={() => changeViewMode('list')}
                title="Ցուցակ (List)"
                style={{
                  background: viewMode === 'list' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'list' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}
              >
                ☰
              </button>

              {/* Details Table */}
              <button
                type="button"
                onClick={() => changeViewMode('details')}
                title="Մանրամասն (Details)"
                style={{
                  background: viewMode === 'details' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'details' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}
              >
                📋
              </button>

              {/* Tiles */}
              <button
                type="button"
                onClick={() => changeViewMode('tiles')}
                title="Սալիկներ (Tiles)"
                style={{
                  background: viewMode === 'tiles' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'tiles' ? '#ffffff' : 'var(--muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}
              >
                🗔
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills (File types) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingTop: '4px' }}>
          {[
            { id: 'all', label: 'Բոլորը', count: stats?.totalFiles || files.length },
            { id: 'image', label: '🖼️ Նկարներ', count: stats?.imagesCount },
            { id: 'vector', label: '📐 Վեկտոր/SVG', count: stats?.vectorsCount },
            { id: 'video', label: '🎬 Տեսանյութեր', count: stats?.videosCount },
            { id: 'font', label: '🔤 Տառատեսակներ', count: stats?.fontsCount },
            { id: 'audio', label: '🎵 Աուդիո', count: undefined },
            { id: 'document', label: '📄 Փաստաթղթեր', count: undefined }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className="media-pill-btn"
              onClick={() => changeTypeFilter(tab.id as any)}
              style={{
                background: typeFilter === tab.id ? 'var(--accent)' : 'var(--bg)',
                color: typeFilter === tab.id ? '#ffffff' : 'var(--muted)',
                border: '1px solid var(--panel-border)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
            </button>
          ))}
        </div>

        {/* Persistent Multi-Selection / Status Bar */}
        {selectedFileIds.size === 0 && selectedFolderIds.size === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              color: 'var(--fg)',
              padding: '10px 18px',
              minHeight: '52px',
              boxSizing: 'border-box',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              flexWrap: 'wrap',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem' }}>{currentFolderId === 'trash' ? '🗑️' : '📁'}</span>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                  {currentFolderId === 'trash'
                    ? `Աղբարկղում՝ ${filteredFiles.length} նիշք`
                    : `Ընդհանուր՝ ${currentSubfolders.length > 0 ? `${currentSubfolders.length} պանակ, ` : ''}${filteredFiles.length} նիշք`}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>•</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                  {formatBytes(currentViewTotalSize + currentSubfolders.reduce((acc, sf) => acc + (folderStats.get(sf.id)?.size || 0), 0))}
                </span>
              </div>

              {(filteredFiles.length > 0 || currentSubfolders.length > 0) && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#3B82F6',
                    border: '1px solid rgba(59, 130, 246, 0.28)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Նշել բոլորը (Ctrl + A)"
                >
                  Նշել բոլորը
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--muted)' }}>
              <span>💡 Քաշեք մկնիկով (Marquee) նիշքեր կամ պանակներ ընտրելու համար</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(90deg, #1e3a8a 0%, #172554 100%)',
              border: '1px solid #3b82f6',
              color: '#ffffff',
              padding: '10px 18px',
              minHeight: '52px',
              boxSizing: 'border-box',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
              animation: 'fadeIn 0.2s ease',
              flexWrap: 'wrap',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {selectedFolderIds.size > 0 && selectedFileIds.size > 0
                  ? `Ընտրված է ${selectedFolderIds.size} պանակ, ${selectedFileIds.size} նիշք (${formatBytes(selectedFilesTotalSize + selectedFoldersTotalSize)})`
                  : selectedFolderIds.size > 0
                  ? `Ընտրված է ${selectedFolderIds.size} պանակ (${formatBytes(selectedFoldersTotalSize)})`
                  : `Ընտրված է ${selectedFileIds.size} նիշք (${formatBytes(selectedFilesTotalSize)})`}
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {(selectedFileIds.size === filteredFiles.length && (currentSubfolders.length === 0 || selectedFolderIds.size === currentSubfolders.length))
                  ? 'Ապանշել բոլորը'
                  : 'Նշել բոլորը'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {selectedFileIds.size === 1 && selectedFolderIds.size === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const selId = Array.from(selectedFileIds)[0];
                    const selFile = files.find(f => f.id === selId);
                    if (selFile) openPreview(selFile);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>👁️</span>
                  <span>Դիտել</span>
                </button>
              )}

              {/* Move button */}
              <button
                type="button"
                onClick={() => {
                  setMoveTargetFolderId(currentFolderId === 'trash' ? null : currentFolderId);
                  setIsMoveModalOpen(true);
                }}
                style={{
                  background: '#3B82F6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>📁</span>
                <span>Տեղափոխել...</span>
              </button>

              {currentFolderId === 'trash' ? (
                <>
                  <button
                    type="button"
                    onClick={handleBatchRestore}
                    style={{
                      background: '#10B981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>♻️</span>
                    <span>Վերականգնել</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchPermanentDelete}
                    style={{
                      background: '#EF4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    💥 Ընդմիշտ ջնջել
                  </button>
                </>
              ) : (
                <>
                  {selectedFileIds.size > 0 && selectedFolderIds.size === 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const allPinned = Array.from(selectedFileIds).every(id => pinnedFileIds.has(id));
                          handleBatchPin(!allPinned);
                        }}
                        style={{
                          background: Array.from(selectedFileIds).every(id => pinnedFileIds.has(id))
                            ? '#F59E0B'
                            : 'rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <span>📌</span>
                        <span>{Array.from(selectedFileIds).every(id => pinnedFileIds.has(id)) ? 'Ապագամել' : 'Գամել վերեւում'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleBatchCopyUrls}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🔗 Պատճենել հղումները
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadFiles()}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <span>{selectedFileIds.size > 1 ? '📦' : '⬇️'}</span>
                        <span>{selectedFileIds.size > 1 ? 'Ներբեռնել ZIP-ով' : 'Ներբեռնել'}</span>
                      </button>
                    </>
                  )}

                  {selectedFolderIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => handleBatchDeleteFolders()}
                      style={{
                        background: '#EF4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Ջնջել պանակները
                    </button>
                  )}

                  {selectedFileIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => handleBatchMoveToTrash()}
                      style={{
                        background: '#EF4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Տեղափոխել աղբարկղ
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleDeselectAll}
                title="Չեղարկել ընտրությունը (Esc)"
                style={{
                  background: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          MAIN EXPLORER BODY: Left Tree Sidebar + Right File Grid
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="admin-media-grid">
        {/* LEFT NAVIGATION PANE (Sticky Explorer Sidebar) */}
        <div
          className="admin-media-sidebar-sticky"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--panel-border)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'sticky',
            top: `${sidebarStickyTop}px`,
            zIndex: 30,
            maxHeight: sidebarMaxHeight,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            transition: 'top 0.2s cubic-bezier(0.16, 1, 0.3, 1), max-height 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              marginBottom: '4px'
            }}
          >
            Արագ Մուտք
          </div>

          {/* Root / All Media quick link */}
          <div
            data-folder-id="root"
            className={`media-sidebar-nav-item ${currentFolderId === null ? 'is-selected' : ''}`}
            onClick={() => navigateToFolder(null)}
            onDragOver={e => handleFolderDragOver(null, e)}
            onDragLeave={handleFolderDragLeave}
            onDrop={e => handleFolderDrop(null, e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.86rem',
              color: currentFolderId === null ? '#ffffff' : 'var(--fg)',
              background: currentFolderId === null ? 'var(--accent)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🖥️</span>
              <span style={{ fontWeight: currentFolderId === null ? 700 : 500 }}>Անհատական Կայք (ԱԿ)</span>
            </div>
            {files.filter(f => !f.isTrashed && f.folderId === null).length > 0 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: currentFolderId === null ? 'rgba(255,255,255,0.25)' : 'var(--panel-border)',
                  fontWeight: 600
                }}
              >
                {files.filter(f => !f.isTrashed && f.folderId === null).length}
              </span>
            )}
          </div>

          {/* Gallery quick link (All files flat view) */}
          <div
            data-folder-id="gallery"
            className={`media-sidebar-nav-item ${currentFolderId === 'gallery' ? 'is-selected' : ''}`}
            onClick={() => navigateToFolder('gallery')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.86rem',
              color: currentFolderId === 'gallery' ? '#ffffff' : 'var(--fg)',
              background: currentFolderId === 'gallery' ? 'var(--accent)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🖼️</span>
              <span style={{ fontWeight: currentFolderId === 'gallery' ? 700 : 500 }}>Պատկերասրահ (Gallery)</span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: currentFolderId === 'gallery' ? 'rgba(255,255,255,0.25)' : 'var(--panel-border)',
                fontWeight: 600
              }}
            >
              {files.filter(f => !f.isTrashed).length}
            </span>
          </div>

          {/* Trash quick link */}
          <div
            data-folder-id="trash"
            className={`media-sidebar-nav-item ${currentFolderId === 'trash' ? 'is-selected is-trash-selected' : ''}`}
            onClick={() => navigateToFolder('trash')}
            onDragOver={e => handleFolderDragOver('trash', e)}
            onDragLeave={handleFolderDragLeave}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              triggerDragEndAnimation('trash');
              if (draggedFileIds.length > 0) {
                handleBatchMoveToTrash(draggedFileIds);
                setDraggedFileIds([]);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.86rem',
              color: currentFolderId === 'trash' ? '#ffffff' : 'var(--fg)',
              background: currentFolderId === 'trash' ? '#EF4444' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🗑️</span>
              <span style={{ fontWeight: currentFolderId === 'trash' ? 700 : 500 }}>Աղբարկղ</span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: currentFolderId === 'trash' ? 'rgba(255,255,255,0.25)' : ((stats?.trashCount || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--panel-border)'),
                color: currentFolderId === 'trash' ? '#ffffff' : ((stats?.trashCount || 0) > 0 ? '#EF4444' : 'var(--muted)'),
                fontWeight: 700
              }}
            >
              {stats?.trashCount || 0}
            </span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '6px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)'
              }}
            >
              Պանակներ
            </div>
            <button
              type="button"
              onClick={() => handleOpenCreateFolder(null)}
              title="Ավելացնել նոր գլխավոր պանակ"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3B82F6',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '2px 6px',
                fontWeight: 700
              }}
            >
              ＋
            </button>
          </div>

          {/* Root-level folder tree with nested children */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {folders.filter(f => f.parentId === null).map(rf => renderFolderTreeNode(rf, 0))}
          </div>

          {folders.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
              Պանակներ չկան:
              <br />
              Ստեղծեք առաջին պանակը:
            </div>
          )}

          {/* SUPABASE STORAGE PROGRESS BAR & USAGE CARD */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '14px',
              borderTop: '1px solid var(--panel-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fg)', letterSpacing: '0.02em' }}>
                  Supabase Պահոց
                </span>
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(62, 207, 142, 0.15)',
                  color: '#3ECF8E',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ECF8E', display: 'inline-block' }} />
                {stats?.storageLimitFormatted || '1 GB'}
              </span>
            </div>

            {/* Glowing Custom Progress Bar Track */}
            <div
              style={{
                width: '100%',
                height: '10px',
                background: 'var(--bg)',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--panel-border)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: `${stats?.storagePercent || 0}%`,
                  height: '100%',
                  background: (stats?.storagePercent || 0) > 85
                    ? 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)'
                    : (stats?.storagePercent || 0) > 60
                    ? 'linear-gradient(90deg, #3ECF8E 0%, #F59E0B 100%)'
                    : 'linear-gradient(90deg, #3B82F6 0%, #3ECF8E 100%)',
                  borderRadius: '8px',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: (stats?.storagePercent || 0) > 85
                    ? '0 0 12px rgba(239, 68, 68, 0.5)'
                    : '0 0 12px rgba(62, 207, 142, 0.5)'
                }}
              />
            </div>

            {/* Used / Total & Percent */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
                {stats?.totalSizeFormatted || '0 MB'} / {stats?.storageLimitFormatted || '1 GB'}
              </span>
              <span
                style={{
                  fontWeight: 800,
                  color: (stats?.storagePercent || 0) > 85 ? '#EF4444' : '#3ECF8E'
                }}
              >
                {stats?.storagePercent || 0}%
              </span>
            </div>

            {/* Remaining Space Pill Box */}
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--muted)',
                background: 'var(--bg)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid var(--panel-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>⚡</span>
                <span>Մնացել է՝</span>
              </span>
              <span style={{ fontWeight: 700, color: 'var(--fg)' }}>
                {stats?.storageRemainingFormatted || '1 GB'} ազատ
              </span>
            </div>

            {/* Breakdown Mini Badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                marginTop: '2px'
              }}
            >
              <div style={{ background: 'var(--bg)', padding: '4px 6px', borderRadius: '6px', textAlign: 'center', fontSize: '0.65rem' }}>
                <div style={{ color: 'var(--muted)' }}>Նկարներ</div>
                <div style={{ fontWeight: 700, color: 'var(--fg)' }}>{stats?.imagesSizeFormatted || '0 MB'}</div>
              </div>
              <div style={{ background: 'var(--bg)', padding: '4px 6px', borderRadius: '6px', textAlign: 'center', fontSize: '0.65rem' }}>
                <div style={{ color: 'var(--muted)' }}>Վիդեո</div>
                <div style={{ fontWeight: 700, color: 'var(--fg)' }}>{stats?.videosSizeFormatted || '0 MB'}</div>
              </div>
              <div style={{ background: 'var(--bg)', padding: '4px 6px', borderRadius: '6px', textAlign: 'center', fontSize: '0.65rem' }}>
                <div style={{ color: 'var(--muted)' }}>Տառեր</div>
                <div style={{ fontWeight: 700, color: 'var(--fg)' }}>{stats?.fontsSizeFormatted || '0 MB'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN AREA (Subfolders and Files) */}
        <div
          ref={mainAreaRef}
          onMouseDown={handleMainAreaMouseDown}
          onClick={(e) => {
            if (marqueeHasDraggedRef.current) return;
            if (selectedFileIds.size > 0 || selectedFolderIds.size > 0) {
              handleDeselectAll();
            }
          }}
          onContextMenu={e => openContextMenu(e, 'empty')}
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--panel-border)',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            minHeight: '550px',
            userSelect: marqueeRect ? 'none' : 'auto'
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: 'var(--muted)' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--panel-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div>Բեռնվում են մեդիա նիշքերը...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#EF4444' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Սխալ</div>
              <div>{error}</div>
              <button
                type="button"
                onClick={loadMedia}
                style={{
                  marginTop: '16px',
                  background: 'var(--accent)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  cursor: 'pointer'
                }}
              >
                Կրկին փորձել
              </button>
            </div>
          ) : (
            <>
              {/* TRASH TOP BANNER */}
              {currentFolderId === 'trash' && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.07)',
                    border: '1px solid rgba(239, 68, 68, 0.22)',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem'
                      }}
                    >
                      🗑️
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Աղբարկղ</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#EF4444',
                            fontWeight: 700
                          }}
                        >
                          {filteredFiles.length} նիշք · {stats?.trashSizeFormatted || '0 B'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                        Ջնջված նիշքերը պահվում են այստեղ մինչև 30 օր, ապա ավտոմատ մաքրվում են
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsTrashSettingsModalOpen(true)}
                      style={{
                        background: 'var(--panel)',
                        color: 'var(--fg)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>⚙️</span>
                      <span>Կարգավորումներ</span>
                    </button>

                    <button
                      type="button"
                      disabled={filteredFiles.length === 0}
                      onClick={handleEmptyTrash}
                      style={{
                        background: '#EF4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: filteredFiles.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: filteredFiles.length === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <span>💥</span>
                      <span>Դատարկել աղբարկղը</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SUBFOLDERS SECTION OF CURRENT FOLDER (if any) */}
              {currentSubfolders.length > 0 && !searchQuery && currentFolderId !== 'trash' && currentFolderId !== 'gallery' && (
                <div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--muted)',
                      marginBottom: '10px'
                    }}
                  >
                    Ենթապանակներ ({currentSubfolders.length})
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, max(180px, calc(25% - 12px))), 1fr))',
                      gap: '12px'
                    }}
                  >
                    {currentSubfolders.map(subf => {
                      const stat = folderStats.get(subf.id) || { count: 0, size: 0, sizeFormatted: '0 B' };
                      const isDragTarget = dragOverFolderId === subf.id;
                      const isFolderSelected = selectedFolderIds.has(subf.id);

                      return (
                        <div
                          key={subf.id}
                          className={`media-folder-card ${isFolderSelected ? 'is-selected' : ''}`}
                          data-folder-id={subf.id}
                          draggable={true}
                          onDragStart={e => handleFolderDragStart(subf.id, e)}
                          onDragEnd={handleDragEnd}
                          onClick={e => {
                            e.stopPropagation();
                            if (e.ctrlKey || e.metaKey || selectedFolderIds.size > 0) {
                              toggleSelectFolder(subf.id, e);
                            } else {
                              navigateToFolder(subf.id);
                            }
                          }}
                          onDoubleClick={e => {
                            e.stopPropagation();
                            navigateToFolder(subf.id);
                          }}
                          onContextMenu={e => openContextMenu(e, 'folder', { folder: subf })}
                          onDragOver={e => handleFolderDragOver(subf.id, e)}
                          onDragLeave={handleFolderDragLeave}
                          onDrop={e => handleFolderDrop(subf.id, e)}
                          style={{
                            background: isDragTarget
                              ? 'rgba(59, 130, 246, 0.25)'
                              : isFolderSelected
                              ? 'rgba(59, 130, 246, 0.16)'
                              : 'var(--bg)',
                            border: `1px solid ${isDragTarget || isFolderSelected ? '#3B82F6' : 'var(--panel-border)'}`,
                            borderRadius: '12px',
                            padding: '12px',
                            cursor: 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            transition: 'all 0.15s ease',
                            boxShadow: isFolderSelected
                              ? '0 4px 16px rgba(59, 130, 246, 0.22)'
                              : '0 2px 8px rgba(0,0,0,0.04)',
                            position: 'relative'
                          }}
                          title={`${subf.name} (${stat.count} նիշք • ${stat.sizeFormatted})`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            {/* Selection Checkbox */}
                            <div
                              className="folder-checkbox"
                              onClick={e => toggleSelectFolder(subf.id, e)}
                              style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                border: isFolderSelected ? '1px solid #3B82F6' : '1px solid var(--panel-border)',
                                background: isFolderSelected ? '#3B82F6' : 'var(--panel)',
                                opacity: isFolderSelected || selectedFolderIds.size > 0 ? 1 : 0,
                                transition: 'opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease',
                                flexShrink: 0
                              }}
                              title={isFolderSelected ? 'Ապանշել պանակը' : 'Նշել պանակը'}
                            >
                              {isFolderSelected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>

                            <svg
                              width="28"
                              height="28"
                              viewBox="0 0 24 24"
                              fill={subf.color || '#3B82F6'}
                              stroke={subf.color || '#3B82F6'}
                              strokeWidth="1.5"
                              style={{ flexShrink: 0 }}
                            >
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: isFolderSelected ? '#3B82F6' : 'var(--fg)'
                                }}
                              >
                                {subf.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{stat.count} նիշք</span>
                                <span>•</span>
                                <span>{stat.sizeFormatted}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={e => handleOpenEditFolder(subf, e)}
                              title="Խմբագրել"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                fontSize: '0.85rem'
                              }}
                            >
                              ⚙
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FILES SECTION */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--muted)'
                    }}
                  >
                    Նիշքեր ({filteredFiles.length})
                  </div>

                  {filteredFiles.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Ընդհանուր՝ {filteredFiles.reduce((acc, f) => acc + f.size, 0) > 0 ? (
                        (filteredFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1) + ' MB'
                      ) : '0 MB'}
                    </div>
                  )}
                </div>

                {/* Empty State */}
                {filteredFiles.length === 0 && currentSubfolders.length === 0 && (
                  <div
                    style={{
                      border: '2px dashed var(--panel-border)',
                      borderRadius: '16px',
                      padding: '60px 20px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      color: 'var(--muted)'
                    }}
                  >
                    <div style={{ fontSize: '2.4rem' }}>📁</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--fg)' }}>
                      Այս պանակը դատարկ է
                    </div>
                    <div style={{ fontSize: '0.85rem', maxWidth: '360px' }}>
                      Վերբեռնեք նիշքեր քաշելով ձեր համակարգչից այստեղ կամ ստեղծեք նոր ենթապանակ:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          background: 'var(--accent)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ↑ Վերբեռնել նիշք
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateFolder(currentFolderId)}
                        style={{
                          background: 'var(--panel)',
                          color: 'var(--fg)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ＋ Նոր Ենթապանակ
                      </button>
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    VIEW MODE 1: LARGE ICONS / GRID
                    ───────────────────────────────────────────────────────────── */}
                {viewMode === 'large-icons' && filteredFiles.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, max(180px, calc(25% - 16px))), 1fr))',
                      gap: '16px'
                    }}
                  >
                    {filteredFiles.map(file => {
                      const isSelected = selectedFileIds.has(file.id);
                      const isPinned = pinnedFileIds.has(file.id);

                      return (
                        <div
                          key={file.id}
                          data-file-id={file.id}
                          className={`media-file-card ${getExitingClass(file.id)}`}
                          draggable
                          onDragStart={e => handleDragStart(file.id, e)}
                          onDragEnd={handleDragEnd}
                          onClick={e => handleFileClick(file, e)}
                          onDoubleClick={e => handleFileDoubleClick(file, e)}
                          onContextMenu={e => openContextMenu(e, 'file', { file })}
                          style={{
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg)',
                            border: `1.5px solid ${isSelected ? '#3B82F6' : (isPinned ? 'rgba(245, 158, 11, 0.6)' : 'var(--panel-border)')}`,
                            borderRadius: '14px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected
                              ? '0 4px 14px rgba(59, 130, 246, 0.2)'
                              : (isPinned ? '0 2px 10px rgba(245, 158, 11, 0.15)' : 'none')
                          }}
                        >
                          {/* Selection Checkbox */}
                          <div
                            onClick={e => toggleSelectFile(file.id, e)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              zIndex: 10,
                              width: '22px',
                              height: '22px',
                              borderRadius: '6px',
                              background: isSelected ? '#3B82F6' : 'rgba(0,0,0,0.5)',
                              border: '1.5px solid #ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            {isSelected ? '✓' : ''}
                          </div>

                          {/* Pin Badge / Button */}
                          <div
                            onClick={e => togglePinFile(file.id, e)}
                            className={`media-file-pin-btn ${isPinned ? 'is-pinned' : ''}`}
                            title={isPinned ? 'Ապագամել վերեւից' : 'Գամել վերեւում (Pin to top)'}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '46px',
                              zIndex: 10,
                              width: '22px',
                              height: '22px',
                              borderRadius: '6px',
                              background: isPinned ? '#F59E0B' : 'rgba(0,0,0,0.55)',
                              backdropFilter: 'blur(4px)',
                              border: '1px solid rgba(255,255,255,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              boxShadow: isPinned ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none'
                            }}
                          >
                            📌
                          </div>

                          {/* Extension Badge */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              zIndex: 10,
                              background: 'rgba(0,0,0,0.6)',
                              backdropFilter: 'blur(4px)',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}
                          >
                            {file.extension}
                          </div>

                          {/* Thumbnail */}
                          <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                            {renderThumbnail(file, 'large')}
                          </div>

                          {/* Info Footer */}
                          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={file.name}
                            >
                              {isPinned && <span style={{ color: '#F59E0B', fontSize: '0.8rem' }}>📌</span>}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)' }}>
                              <span>{file.sizeFormatted}</span>
                              {file.usedIn && file.usedIn.length > 0 && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setUsageInspectFile(file);
                                  }}
                                  title={`Օգտագործվում է կայքի ${file.usedIn.length} հատվածում (Կտտացրեք՝ տեսնելու ցանկը)`}
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10B981',
                                    border: '1px solid rgba(16, 185, 129, 0.35)',
                                    padding: '1px 6px',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '0.68rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span>Կայքում ({file.usedIn.length})</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    VIEW MODE 2: MEDIUM CARDS
                    ───────────────────────────────────────────────────────────── */}
                {viewMode === 'medium-icons' && filteredFiles.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '12px'
                    }}
                  >
                    {filteredFiles.map(file => {
                      const isSelected = selectedFileIds.has(file.id);
                      const isPinned = pinnedFileIds.has(file.id);

                      return (
                        <div
                          key={file.id}
                          className={`media-file-card ${getExitingClass(file.id)}`}
                          draggable
                          onDragStart={e => handleDragStart(file.id, e)}
                          onDragEnd={handleDragEnd}
                          onClick={e => handleFileClick(file, e)}
                          onDoubleClick={e => handleFileDoubleClick(file, e)}
                          onContextMenu={e => openContextMenu(e, 'file', { file })}
                          style={{
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg)',
                            border: `1.5px solid ${isSelected ? '#3B82F6' : (isPinned ? 'rgba(245, 158, 11, 0.6)' : 'var(--panel-border)')}`,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected
                              ? '0 4px 14px rgba(59, 130, 246, 0.2)'
                              : (isPinned ? '0 2px 8px rgba(245, 158, 11, 0.15)' : 'none')
                          }}
                        >
                          <div
                            onClick={e => toggleSelectFile(file.id, e)}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              left: '6px',
                              zIndex: 10,
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              background: isSelected ? '#3B82F6' : 'rgba(0,0,0,0.5)',
                              border: '1px solid #ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '0.7rem'
                            }}
                          >
                            {isSelected ? '✓' : ''}
                          </div>

                          {/* Pin Badge / Button */}
                          <div
                            onClick={e => togglePinFile(file.id, e)}
                            className={`media-file-pin-btn ${isPinned ? 'is-pinned' : ''}`}
                            title={isPinned ? 'Ապագամել վերեւից' : 'Գամել վերեւում (Pin to top)'}
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              zIndex: 10,
                              width: '20px',
                              height: '20px',
                              borderRadius: '5px',
                              background: isPinned ? '#F59E0B' : 'rgba(0,0,0,0.55)',
                              backdropFilter: 'blur(4px)',
                              border: '1px solid rgba(255,255,255,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              cursor: 'pointer',
                              boxShadow: isPinned ? '0 0 8px rgba(245, 158, 11, 0.5)' : 'none'
                            }}
                          >
                            📌
                          </div>

                          <div style={{ height: '100px', width: '100%' }}>
                            {renderThumbnail(file, 'medium')}
                          </div>

                          <div style={{ padding: '8px 10px' }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '0.76rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={file.name}
                            >
                              {isPinned && <span style={{ color: '#F59E0B', fontSize: '0.72rem' }}>📌</span>}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--muted)', marginTop: '2px' }}>
                              <span>{file.sizeFormatted}</span>
                              {file.usedIn && file.usedIn.length > 0 && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setUsageInspectFile(file);
                                  }}
                                  title={`Օգտագործվում է կայքի ${file.usedIn.length} հատվածում (Կտտացրեք՝ տեսնելու ցանկը)`}
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10B981',
                                    border: '1px solid rgba(16, 185, 129, 0.35)',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    fontSize: '0.64rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span>Կայքում ({file.usedIn.length})</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    VIEW MODE 3: LIST
                    ───────────────────────────────────────────────────────────── */}
                {viewMode === 'list' && filteredFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredFiles.map(file => {
                      const isSelected = selectedFileIds.has(file.id);
                      const isPinned = pinnedFileIds.has(file.id);

                      return (
                        <div
                          key={file.id}
                          data-file-id={file.id}
                          className={`media-file-list-item ${getExitingClass(file.id)}`}
                          draggable
                          onDragStart={e => handleDragStart(file.id, e)}
                          onDragEnd={handleDragEnd}
                          onClick={e => handleFileClick(file, e)}
                          onDoubleClick={e => handleFileDoubleClick(file, e)}
                          onContextMenu={e => openContextMenu(e, 'file', { file })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg)',
                            border: `1px solid ${isSelected ? '#3B82F6' : (isPinned ? 'rgba(245, 158, 11, 0.5)' : 'var(--panel-border)')}`,
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <div
                              onClick={e => toggleSelectFile(file.id, e)}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                background: isSelected ? '#3B82F6' : 'var(--panel)',
                                border: '1px solid var(--panel-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '0.7rem'
                              }}
                            >
                              {isSelected ? '✓' : ''}
                            </div>

                            <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                              {renderThumbnail(file, 'small')}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: '0.84rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                {isPinned && <span style={{ color: '#F59E0B', fontSize: '0.8rem' }}>📌</span>}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                                {file.sizeFormatted} • {file.extension.toUpperCase()}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {file.usedIn && file.usedIn.length > 0 && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setUsageInspectFile(file);
                                }}
                                title={`Օգտագործվում է կայքի ${file.usedIn.length} հատվածում (Կտտացրեք՝ տեսնելու ցանկը)`}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                <span>Կայքում ({file.usedIn.length})</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="media-icon-btn"
                              onClick={e => togglePinFile(file.id, e)}
                              title={isPinned ? 'Ապագամել վերեւից' : 'Գամել վերեւում (Pin to top)'}
                              style={{
                                background: isPinned ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                border: isPinned ? '1px solid rgba(245, 158, 11, 0.5)' : 'none',
                                color: isPinned ? '#F59E0B' : 'var(--muted)',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                              }}
                            >
                              📌
                            </button>
                            <button
                              type="button"
                              className="media-icon-btn"
                              onClick={e => copyUrl(file.url, e)}
                              title="Պատճենել հղումը"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--muted)',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              🔗
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    VIEW MODE 4: DETAILS / TABLE
                    ───────────────────────────────────────────────────────────── */}
                {viewMode === 'details' && filteredFiles.length > 0 && (
                  <div
                    style={{
                      overflowX: 'auto',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '12px'
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--panel-border)', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px', width: '40px' }}>
                            <input
                              type="checkbox"
                              checked={selectedFileIds.size === filteredFiles.length && filteredFiles.length > 0}
                              onChange={handleSelectAll}
                            />
                          </th>
                          <th style={{ padding: '10px 6px', width: '36px', textAlign: 'center' }}>📌</th>
                          <th
                            className="media-table-header-cell"
                            style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                            onClick={e => handleColumnSortClick('name', e)}
                            title="Կտտացրեք դասակարգելու համար (Ctrl + Կտտոց՝ բազմակի դասակարգում)"
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                              Անուն {renderSortIndicator('name')}
                            </span>
                          </th>
                          <th
                            className="media-table-header-cell"
                            style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                            onClick={e => handleColumnSortClick('type', e)}
                            title="Կտտացրեք դասակարգելու համար (Ctrl + Կտտոց՝ բազմակի դասակարգում)"
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                              Տեսակ {renderSortIndicator('type')}
                            </span>
                          </th>
                          <th
                            className="media-table-header-cell"
                            style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                            onClick={e => handleColumnSortClick('size', e)}
                            title="Կտտացրեք դասակարգելու համար (Ctrl + Կտտոց՝ բազմակի դասակարգում)"
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                              Չափս {renderSortIndicator('size')}
                            </span>
                          </th>
                          <th
                            className="media-table-header-cell"
                            style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                            onClick={e => handleColumnSortClick('folder', e)}
                            title="Կտտացրեք դասակարգելու համար (Ctrl + Կտտոց՝ բազմակի դասակարգում)"
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                              Պանակ {renderSortIndicator('folder')}
                            </span>
                          </th>
                          <th
                            className="media-table-header-cell"
                            style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                            onClick={e => handleColumnSortClick('modifiedAt', e)}
                            title="Կտտացրեք դասակարգելու համար (Ctrl + Կտտոց՝ բազմակի դասակարգում)"
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                              Ամսաթիվ {renderSortIndicator('modifiedAt')}
                            </span>
                          </th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Գործողություններ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFiles.map(file => {
                          const isSelected = selectedFileIds.has(file.id);
                          const isPinned = pinnedFileIds.has(file.id);
                          const folderObj = file.folderId ? folderMap.get(file.folderId) : undefined;
                          const isUsed = file.usedIn && file.usedIn.length > 0;

                          return (
                            <tr
                              key={file.id}
                              data-file-id={file.id}
                              className={`media-table-row ${getExitingClass(file.id)}`}
                              draggable
                              onDragStart={e => handleDragStart(file.id, e)}
                              onDragEnd={handleDragEnd}
                              onClick={e => handleFileClick(file, e)}
                              onDoubleClick={e => handleFileDoubleClick(file, e)}
                              onContextMenu={e => openContextMenu(e, 'file', { file })}
                              style={{
                                borderBottom: '1px solid var(--panel-border)',
                                background: isSelected ? 'rgba(59, 130, 246, 0.08)' : (isPinned ? 'rgba(245, 158, 11, 0.04)' : 'transparent'),
                                cursor: 'pointer',
                                transition: 'background 0.1s ease'
                              }}
                            >
                              <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => toggleSelectFile(file.id, e as any)}
                                />
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="media-icon-btn"
                                  onClick={e => togglePinFile(file.id, e)}
                                  title={isPinned ? 'Ապագամել վերեւից' : 'Գամել վերեւում (Pin to top)'}
                                  style={{
                                    background: isPinned ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                    border: isPinned ? '1px solid rgba(245, 158, 11, 0.5)' : 'none',
                                    color: isPinned ? '#F59E0B' : 'var(--muted)',
                                    borderRadius: '6px',
                                    padding: '2px 4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    opacity: isPinned ? 1 : 0.35
                                  }}
                                >
                                  📌
                                </button>
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                    {renderThumbnail(file, 'small')}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      {isPinned && <span style={{ color: '#F59E0B', fontSize: '0.78rem' }}>📌</span>}
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                                {file.extension}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>
                                {file.sizeFormatted}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {folderObj ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: folderObj.color || '#3B82F6' }} />
                                    <span>{folderObj.name}</span>
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }}>Գլխավոր</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--muted)', fontSize: '0.78rem' }}>
                                {new Date(file.modifiedAt).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                    {/* «Կայքում» Action */}
                                    {isUsed && (
                                      <button
                                        type="button"
                                        onClick={e => {
                                          e.stopPropagation();
                                          setUsageInspectFile(file);
                                        }}
                                        title={`Օգտագործվում է կայքի ${file.usedIn!.length} հատվածում (Կտտացրեք՝ տեսնելու ցանկը)`}
                                        style={{
                                          background: 'rgba(16, 185, 129, 0.15)',
                                          color: '#10B981',
                                          border: '1px solid rgba(16, 185, 129, 0.35)',
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                          fontWeight: 600,
                                          fontSize: '0.72rem',
                                          whiteSpace: 'nowrap',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>Կայքում ({file.usedIn!.length})</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      className="media-icon-btn"
                                      onClick={e => copyUrl(file.url, e)}
                                      title="Պատճենել հղումը"
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--muted)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      📋
                                    </button>
                                    {file.isTrashed ? (
                                      <>
                                        <button
                                          type="button"
                                          className="media-icon-btn"
                                          onClick={e => handleRestoreFile(file, e)}
                                          title="Վերականգնել նիշքը"
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#10B981',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                          }}
                                        >
                                          ♻️
                                        </button>
                                        <button
                                          type="button"
                                          className="media-icon-btn"
                                          onClick={e => handlePermanentDelete(file, e)}
                                          title="Ընդմիշտ ջնջել"
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#EF4444',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                          }}
                                        >
                                          💥
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        className="media-icon-btn"
                                        onClick={e => handleMoveToTrash(file, e)}
                                        title="Տեղափոխել աղբարկղ"
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: '#EF4444',
                                          cursor: 'pointer',
                                          fontSize: '0.9rem'
                                        }}
                                      >
                                        🗑️
                                      </button>
                                    )}
                                  </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    VIEW MODE 5: TILES
                    ───────────────────────────────────────────────────────────── */}
                {viewMode === 'tiles' && filteredFiles.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, max(200px, calc(25% - 12px))), 1fr))',
                      gap: '12px'
                    }}
                  >
                    {filteredFiles.map(file => {
                      const isSelected = selectedFileIds.has(file.id);
                      const isPinned = pinnedFileIds.has(file.id);
                      const isUsed = file.usedIn && file.usedIn.length > 0;

                      return (
                        <div
                          key={file.id}
                          data-file-id={file.id}
                          className={`media-file-tile-item ${getExitingClass(file.id)}`}
                          draggable
                          onDragStart={e => handleDragStart(file.id, e)}
                          onDragEnd={handleDragEnd}
                          onClick={e => handleFileClick(file, e)}
                          onDoubleClick={e => handleFileDoubleClick(file, e)}
                          onContextMenu={e => openContextMenu(e, 'file', { file })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg)',
                            border: `1px solid ${isSelected ? '#3B82F6' : (isPinned ? 'rgba(245, 158, 11, 0.5)' : 'var(--panel-border)')}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                            {renderThumbnail(file, 'small')}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={file.name}
                            >
                              {isPinned && <span style={{ color: '#F59E0B', fontSize: '0.78rem' }}>📌</span>}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{file.extension.toUpperCase()} • {file.sizeFormatted}</span>
                              {isUsed && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setUsageInspectFile(file);
                                  }}
                                  title={`Օգտագործվում է կայքի ${file.usedIn!.length} հատվածում (Կտտացրեք՝ տեսնելու ցանկը)`}
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10B981',
                                    border: '1px solid rgba(16, 185, 129, 0.35)',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    fontSize: '0.65rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span>Կայքում ({file.usedIn!.length})</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="media-icon-btn"
                              onClick={e => togglePinFile(file.id, e)}
                              title={isPinned ? 'Ապագամել վերեւից' : 'Գամել վերեւում (Pin to top)'}
                              style={{
                                background: isPinned ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                border: isPinned ? '1px solid rgba(245, 158, 11, 0.5)' : 'none',
                                color: isPinned ? '#F59E0B' : 'var(--muted)',
                                borderRadius: '6px',
                                padding: '3px 5px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                opacity: isPinned ? 1 : 0.4
                              }}
                            >
                              📌
                            </button>
                            <div onClick={e => toggleSelectFile(file.id, e)}>
                              <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Keyboard Shortcuts Hints Bar */}
                {filteredFiles.length > 0 && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '8px 12px',
                      background: 'var(--bg)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: '0.72rem',
                      color: 'var(--muted)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span><kbd style={{ background: 'var(--panel)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--panel-border)', fontWeight: 600 }}>Ctrl</kbd> + Կտտոց՝ բազմակի ընտրություն</span>
                      <span><kbd style={{ background: 'var(--panel)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--panel-border)', fontWeight: 600 }}>Shift</kbd> + Կտտոց՝ միջակայքի նշում</span>
                      <span><kbd style={{ background: 'var(--panel)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--panel-border)', fontWeight: 600 }}>Ctrl</kbd> + <kbd style={{ background: 'var(--panel)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--panel-border)', fontWeight: 600 }}>A</kbd>՝ նշել բոլորը</span>
                      <span><kbd style={{ background: 'var(--panel)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--panel-border)', fontWeight: 600 }}>Del</kbd>՝ ջնջել</span>
                    </div>
                    <div>
                      <span>Կրկնակի կտտոց՝ դիտել</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: FOLDER CREATE & EDIT (With Custom Color Picker & Nesting)
          ══════════════════════════════════════════════════════════════════════════ */}
      {mounted && isFolderModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-modal-backdrop="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'modalBackdropFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={() => setIsFolderModalOpen(false)}
        >
          <div
            data-modal-container="true"
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              animation: 'modalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={folderFormColor || 'var(--accent)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {editingFolderId ? 'Խմբագրել Պանակը' : 'Նոր Պանակ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFolder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Folder Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--muted)' }}>
                  Պանակի Անվանումը *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={folderFormName}
                  onChange={e => setFolderFormName(e.target.value)}
                  placeholder="Օրինակ՝ Լոգոներ, Քեյսեր, Պաստառներ..."
                  style={{
                    width: '100%',
                    height: '42px',
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '10px',
                    padding: '0 12px',
                    color: 'var(--fg)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              {/* Parent Folder */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--muted)' }}>
                  Ծնող Պանակ (Տեղադրել այլ պանակի մեջ)
                </label>
                <select
                  value={folderFormParentId || ''}
                  onChange={e => setFolderFormParentId(e.target.value ? e.target.value : null)}
                  style={{
                    width: '100%',
                    height: '40px',
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '10px',
                    padding: '0 12px',
                    color: 'var(--fg)',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">🖥️ Անհատական Կայք (ԱԿ) (Գլխավոր)</option>
                  {folders
                    .filter(f => f.id !== editingFolderId)
                    .map(f => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Folder Color Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--muted)' }}>
                  Պանակի Գույնը (Color)
                </label>

                {/* Preset Color Swatches */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {COLOR_PRESETS.map(c => {
                    const isSelected = folderFormColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFolderFormColor(c.hex)}
                        title={c.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: c.hex,
                          border: isSelected ? '3px solid #ffffff' : '1px solid rgba(0,0,0,0.2)',
                          boxShadow: isSelected ? '0 0 10px rgba(255,255,255,0.6)' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Hex / Color Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={folderFormColor}
                    onChange={e => setFolderFormColor(e.target.value)}
                    style={{
                      width: '40px',
                      height: '36px',
                      borderRadius: '6px',
                      border: '1px solid var(--panel-border)',
                      cursor: 'pointer',
                      background: 'transparent'
                    }}
                  />
                  <input
                    type="text"
                    value={folderFormColor}
                    onChange={e => setFolderFormColor(e.target.value)}
                    placeholder="#3B82F6"
                    style={{
                      flex: 1,
                      height: '36px',
                      background: 'var(--bg)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: 'var(--fg)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                {folderModalMode === 'edit' && editingFolderId && (
                  <button
                    type="button"
                    onClick={() => {
                      const f = folders.find(item => item.id === editingFolderId);
                      if (f) handleDeleteFolder(f);
                      setIsFolderModalOpen(false);
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginRight: 'auto'
                    }}
                  >
                    Ջնջել Պանակը
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--fg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Չեղարկել
                </button>

                <button
                  type="submit"
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 22px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {folderModalMode === 'create' ? 'Ստեղծել' : 'Պահպանել'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: MOVE TO FOLDER
          ══════════════════════════════════════════════════════════════════════════ */}
      {mounted && isMoveModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsMoveModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              Տեղափոխել Պանակ
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
              {selectedFolderIds.size > 0 && selectedFileIds.size > 0
                ? `Ընտրեք թիրախային պանակը, ուր ցանկանում եք տեղափոխել ընտրված ${selectedFolderIds.size} պանակները և ${selectedFileIds.size} նիշքերը:`
                : selectedFolderIds.size > 0
                ? `Ընտրեք թիրախային պանակը, ուր ցանկանում եք տեղափոխել ընտրված ${selectedFolderIds.size} պանակները:`
                : `Ընտրեք թիրախային պանակը, ուր ցանկանում եք տեղափոխել ընտրված ${selectedFileIds.size} նիշքերը:`}
            </p>

            <div
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                border: '1px solid var(--panel-border)',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div
                onClick={() => setMoveTargetFolderId(null)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: moveTargetFolderId === null ? 'var(--accent)' : 'transparent',
                  color: moveTargetFolderId === null ? '#ffffff' : 'var(--fg)',
                  fontWeight: moveTargetFolderId === null ? 700 : 400,
                  fontSize: '0.85rem'
                }}
              >
                🖥️ Անհատական Կայք (ԱԿ) (Գլխավոր)
              </div>

              {folders
                .filter(f => !selectedFolderIds.has(f.id) && !Array.from(selectedFolderIds).some(sfId => isDescendantFolder(sfId, f.id)))
                .map(f => (
                  <div
                    key={f.id}
                    onClick={() => setMoveTargetFolderId(f.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: moveTargetFolderId === f.id ? 'var(--accent)' : 'transparent',
                      color: moveTargetFolderId === f.id ? '#ffffff' : 'var(--fg)',
                      fontWeight: moveTargetFolderId === f.id ? 700 : 400,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: f.color || '#3B82F6'
                      }}
                    />
                    <span>📁 {f.name}</span>
                  </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                style={{
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Չեղարկել
              </button>
              <button
                type="button"
                onClick={() => handleBatchMoveSelected(moveTargetFolderId)}
                style={{
                  background: 'var(--accent)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Տեղափոխել
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: FULL FILE INSPECTOR / PREVIEW
          ══════════════════════════════════════════════════════════════════════════ */}
      {mounted && previewFile && typeof document !== 'undefined' && createPortal(
        <div
          data-modal-backdrop="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'modalBackdropFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={closePreview}
        >
          <div
            data-modal-container="true"
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
              animation: 'modalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Left Preview Box */}
            <div
              style={{
                background: '#0a0a0f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {previewFile.type === 'image' || previewFile.type === 'vector' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                  }}
                />
              ) : previewFile.type === 'video' ? (
                <video
                  controls
                  autoPlay
                  src={previewFile.url}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    borderRadius: '8px'
                  }}
                />
              ) : previewFile.type === 'font' ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    color: '#ffffff',
                    width: '100%',
                    padding: '20px'
                  }}
                >
                  <style>
                    {`
                      @font-face {
                        font-family: 'PreviewFontCustom';
                        src: url('${previewFile.url}');
                      }
                    `}
                  </style>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>Տառատեսակի Նախադիտում</div>
                  <div
                    style={{
                      fontFamily: 'PreviewFontCustom, sans-serif',
                      fontSize: '2rem',
                      lineHeight: 1.4,
                      textAlign: 'center',
                      wordBreak: 'break-word',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '20px',
                      borderRadius: '12px',
                      width: '100%'
                    }}
                    contentEditable
                    suppressContentEditableWarning
                  >
                    ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔևՕՖ
                    <br />
                    The quick brown fox jumps over the lazy dog. 1234567890
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    (Կարող եք մուտքագրել սեփական տեքստ վերևի դաշտում)
                  </div>
                </div>
              ) : previewFile.type === 'audio' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', color: '#ffffff' }}>
                  <div style={{ fontSize: '3rem' }}>🎵</div>
                  <audio controls src={previewFile.url} style={{ width: '280px' }} />
                </div>
              ) : (
                <div style={{ color: 'var(--muted)', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📄</div>
                  <div>Նախադիտումը հասանելի չէ այս ֆորմատի համար:</div>
                </div>
              )}
            </div>

            {/* Right Details Panel */}
            <div
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    background: 'var(--panel-border)',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  {previewFile.extension}
                </span>
                <button
                  type="button"
                  onClick={closePreview}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Title & Rename */}
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, wordBreak: 'break-word' }}>
                  {previewFile.name}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRenamingFile(previewFile);
                    setNewFileName(previewFile.name);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3B82F6',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: 0,
                    marginTop: '4px'
                  }}
                >
                  ✏️ Անվանափոխել
                </button>
              </div>

              {/* Usage Banner if used in website */}
              {previewFile.usedIn && previewFile.usedIn.length > 0 && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🔗</span>
                      <span>Օգտագործվում է կայքում ({previewFile.usedIn.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnlinkUsage(previewFile)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>🔓</span>
                      <span>Ապակապել բոլորը</span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {previewFile.usedIn.map((usage, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--bg)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--panel-border)',
                          fontSize: '0.78rem'
                        }}
                      >
                        <span style={{ color: 'var(--fg)' }}>✓ {usage}</span>
                        <button
                          type="button"
                          onClick={() => handleUnlinkUsage(previewFile, usage)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: '5px',
                            padding: '2px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Ապակապել
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Properties */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--muted)' }}>Չափս</span>
                  <span style={{ fontWeight: 600 }}>{previewFile.sizeFormatted}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--muted)' }}>Տեսակ</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{previewFile.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--muted)' }}>Պանակ</span>
                  <span style={{ fontWeight: 600 }}>
                    {previewFile.folderId ? folderMap.get(previewFile.folderId)?.name || 'Պանակ' : 'Անհատական Կայք (ԱԿ) (Գլխավոր)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--muted)' }}>Փոփոխվել է</span>
                  <span style={{ fontWeight: 600 }}>{new Date(previewFile.modifiedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* URL with 1-Click Copy */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                  Հղում (Public URL)
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    value={previewFile.url}
                    style={{
                      flex: 1,
                      height: '36px',
                      background: 'var(--bg)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: 'var(--fg)',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => copyUrl(previewFile.url)}
                    style={{
                      background: '#3B82F6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 14px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Պատճենել
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                {previewFile.isTrashed ? (
                  <>
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#EF4444', marginBottom: '2px' }}>
                        ⚠️ Այս նիշքը գտնվում է աղբարկղում
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                        {previewFile.daysRemaining !== undefined
                          ? `Ինքնաջնջմանը մնացել է ${previewFile.daysRemaining} օր:`
                          : 'Ավտոմատ ինքնաջնջումն անջատված է:'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreFile(previewFile)}
                      style={{
                        background: '#10B981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>♻️</span>
                      <span>Վերականգնել նիշքը</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(previewFile)}
                      style={{
                        background: '#EF4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>💥</span>
                      <span>Ընդմիշտ ջնջել Supabase-ից</span>
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={previewFile.url}
                      download={previewFile.name}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '10px',
                        padding: '10px',
                        textAlign: 'center',
                        color: 'var(--fg)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>⬇</span>
                      <span>Ներբեռնել համակարգիչ</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleMoveToTrash(previewFile)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#EF4444',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🗑️</span>
                      <span>Տեղափոխել աղբարկղ</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: INLINE RENAME FILE
          ══════════════════════════════════════════════════════════════════════════ */}
      {mounted && renamingFile && typeof document !== 'undefined' && createPortal(
        <div
          data-modal-backdrop="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'modalBackdropFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={() => setRenamingFile(null)}
        >
          <div
            data-modal-container="true"
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '380px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              animation: 'modalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              Անվանափոխել Նիշքը
            </h3>

            <form onSubmit={handleSaveRename} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                required
                autoFocus
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  background: 'var(--bg)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '8px',
                  padding: '0 10px',
                  color: 'var(--fg)',
                  fontSize: '0.9rem'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--fg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    cursor: 'pointer'
                  }}
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Պահպանել
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: TRASH SETTINGS (AUTO-CLEANUP & RETENTION DAYS)
          ══════════════════════════════════════════════════════════════════════════ */}
      {mounted && isTrashSettingsModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-modal-backdrop="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'modalBackdropFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={() => setIsTrashSettingsModalOpen(false)}
        >
          <div
            data-modal-container="true"
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              animation: 'modalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>🗑️</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--fg)' }}>
                  Աղբարկղի Կարգավորումներ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTrashSettingsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Toggle auto cleanup */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--fg)' }}>
                    Ավտոմատ ինքնաջնջում
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Ժամկետը լրանալուց հետո նիշքերը ընդմիշտ կջնջվեն Supabase-ից
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={trashSettingsForm.autoDeleteEnabled}
                  onChange={e => setTrashSettingsForm(prev => ({ ...prev, autoDeleteEnabled: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
              </label>

              {/* Retention days */}
              {trashSettingsForm.autoDeleteEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--fg)' }}>
                    Քանի՞ օր հետո ինքնաջնջվի (Պահպանման ժամկետ)․
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[7, 14, 30, 60, 90].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTrashSettingsForm(prev => ({ ...prev, retentionDays: d }))}
                        style={{
                          background: trashSettingsForm.retentionDays === d ? 'var(--accent)' : 'var(--bg)',
                          color: trashSettingsForm.retentionDays === d ? '#ffffff' : 'var(--fg)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {d} օր
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={trashSettingsForm.retentionDays}
                    onChange={e => setTrashSettingsForm(prev => ({ ...prev, retentionDays: Math.max(1, parseInt(e.target.value) || 1) }))}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'var(--fg)',
                      fontSize: '0.88rem',
                      width: '100%'
                    }}
                  />
                </div>
              )}

              {/* Fast Delete without Confirmation Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚡</span>
                    <span>Արագ ջնջում (Առանց հաստատման)</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Աղբարկղ տեղափոխելիս հաստատման հարցում չի ցուցադրվի (բացառությամբ կայքին կապված նիշքերի)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={skipTrashConfirm}
                  onChange={e => toggleSkipTrashConfirm(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsTrashSettingsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'var(--fg)',
                  cursor: 'pointer'
                }}
              >
                Չեղարկել
              </button>
              <button
                type="button"
                onClick={handleSaveTrashSettings}
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Պահպանել
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          RIGHT-CLICK CONTEXT MENU (WINDOWS-STYLE POPUP)
          ══════════════════════════════════════════════════════════════════════════ */}
      {mounted && contextMenu.isOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 999999,
            background: 'var(--panel)',
            border: '1px solid var(--panel-border)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            minWidth: '220px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            fontSize: '0.84rem',
            animation: 'fadeIn 0.1s ease',
            color: 'var(--fg)'
          }}
        >
          {/* 1. FILE CONTEXT MENU */}
          {contextMenu.type === 'file' && (
            <>
              {(() => {
                const isMultiSelected = Boolean(contextMenu.file && selectedFileIds.has(contextMenu.file.id) && selectedFileIds.size > 1);
                const isUsed = Boolean(contextMenu.file?.usedIn && contextMenu.file.usedIn.length > 0);
                const usedCount = contextMenu.file?.usedIn?.length || 0;

                return (
                  <>
                    {!isMultiSelected && contextMenu.file && (
                      <button
                        type="button"
                        onClick={() => {
                          if (contextMenu.file) openPreview(contextMenu.file);
                          setContextMenu(prev => ({ ...prev, isOpen: false }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--fg)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          fontWeight: 600
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
                      >
                        <span style={{ fontSize: '1rem' }}>👁️</span>
                        <span style={{ flex: 1 }}>Դիտել</span>
                        <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>Enter</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const toDownload = isMultiSelected
                          ? files.filter(f => selectedFileIds.has(f.id))
                          : (contextMenu.file ? [contextMenu.file] : []);
                        handleDownloadFiles(toDownload);
                        setContextMenu(prev => ({ ...prev, isOpen: false }));
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--fg)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
                    >
                      <span style={{ fontSize: '1rem' }}>{isMultiSelected ? '📦' : '⬇️'}</span>
                      <span style={{ flex: 1 }}>{isMultiSelected ? `Ներբեռնել ZIP-ով (${selectedFileIds.size})` : 'Ներբեռնել'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isMultiSelected) {
                          handleBatchCopyUrls();
                        } else if (contextMenu.file) {
                          copyUrl(contextMenu.file.url);
                        }
                        setContextMenu(prev => ({ ...prev, isOpen: false }));
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--fg)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
                    >
                      <span style={{ fontSize: '1rem' }}>🔗</span>
                      <span style={{ flex: 1 }}>{isMultiSelected ? 'Պատճենել հղումները' : 'Պատճենել հղումը'}</span>
                    </button>

                    {!isMultiSelected && contextMenu.file && (
                      <button
                        type="button"
                        onClick={() => {
                          if (contextMenu.file) {
                            setRenamingFile(contextMenu.file);
                            setNewFileName(contextMenu.file.name);
                          }
                          setContextMenu(prev => ({ ...prev, isOpen: false }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--fg)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
                      >
                        <span style={{ fontSize: '1rem' }}>✏️</span>
                        <span style={{ flex: 1 }}>Անվանափոխել</span>
                      </button>
                    )}

                    {currentFolderId !== 'trash' && !contextMenu.file?.isTrashed && (
                      <button
                        type="button"
                        onClick={e => {
                          if (isMultiSelected) {
                            const allPinned = Array.from(selectedFileIds).every(id => pinnedFileIds.has(id));
                            handleBatchPin(!allPinned);
                          } else if (contextMenu.file) {
                            togglePinFile(contextMenu.file.id, e);
                          }
                          setContextMenu(prev => ({ ...prev, isOpen: false }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--fg)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
                      >
                        <span style={{ fontSize: '1rem' }}>📌</span>
                        <span style={{ flex: 1 }}>
                          {isMultiSelected
                            ? (Array.from(selectedFileIds).every(id => pinnedFileIds.has(id)) ? 'Ապագամել նշվածները' : 'Գամել նշվածները վերեւում')
                            : (contextMenu.file && pinnedFileIds.has(contextMenu.file.id) ? 'Ապագամել վերեւից' : 'Գամել վերեւում')}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (contextMenu.file && !isMultiSelected) {
                          setSelectedFileIds(new Set([contextMenu.file.id]));
                        }
                        setMoveTargetFolderId(currentFolderId === 'trash' ? null : currentFolderId);
                        setIsMoveModalOpen(true);
                        setContextMenu(prev => ({ ...prev, isOpen: false }));
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--fg)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
                    >
                      <span style={{ fontSize: '1rem' }}>📁</span>
                      <span style={{ flex: 1 }}>Տեղափոխել պանակ...</span>
                    </button>

                    {/* «Կայքում» գործողություն context menu-ի մեջ (Միայն կապակցված նիշքերի համար, առանց շղթայի պատկերակի) */}
                    {contextMenu.file && isUsed && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (contextMenu.file) setUsageInspectFile(contextMenu.file);
                            setContextMenu(prev => ({ ...prev, isOpen: false }));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'transparent',
                            color: '#10B981',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            fontWeight: 600
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ flex: 1 }}>Կայքում ({usedCount})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (contextMenu.file) handleUnlinkUsage(contextMenu.file);
                            setContextMenu(prev => ({ ...prev, isOpen: false }));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'transparent',
                            color: '#F59E0B',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            fontWeight: 600
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: '1rem' }}>🔓</span>
                          <span style={{ flex: 1 }}>Ապակապել կայքից</span>
                        </button>
                      </>
                    )}

                    <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '4px 0' }} />

                    {currentFolderId === 'trash' || contextMenu.file?.isTrashed ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (isMultiSelected) {
                              handleBatchRestore();
                            } else if (contextMenu.file) {
                              handleRestoreFile(contextMenu.file);
                            }
                            setContextMenu(prev => ({ ...prev, isOpen: false }));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'transparent',
                            color: '#10B981',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            fontWeight: 600
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: '1rem' }}>♻️</span>
                          <span style={{ flex: 1 }}>Վերականգնել</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isMultiSelected) {
                              handleBatchPermanentDelete();
                            } else if (contextMenu.file) {
                              handlePermanentDelete(contextMenu.file);
                            }
                            setContextMenu(prev => ({ ...prev, isOpen: false }));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'transparent',
                            color: '#EF4444',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            fontWeight: 600
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: '1rem' }}>💥</span>
                          <span style={{ flex: 1 }}>Ընդմիշտ ջնջել</span>
                          <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>Shift+Del</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (isMultiSelected) {
                            handleBatchMoveToTrash();
                          } else if (contextMenu.file) {
                            handleMoveToTrash(contextMenu.file);
                          }
                          setContextMenu(prev => ({ ...prev, isOpen: false }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'transparent',
                          color: '#EF4444',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          fontWeight: 600
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: '1rem' }}>🗑️</span>
                        <span style={{ flex: 1 }}>Տեղափոխել աղբարկղ</span>
                        <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>Del</span>
                      </button>
                    )}
                  </>
                );
              })()}
            </>
          )}

          {/* 2. FOLDER CONTEXT MENU */}
          {contextMenu.type === 'folder' && contextMenu.folder && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.folder) navigateToFolder(contextMenu.folder.id);
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--fg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontWeight: 600
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
              >
                <span style={{ fontSize: '1rem' }}>📂</span>
                <span style={{ flex: 1 }}>Բացել</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (contextMenu.folder) handleOpenCreateFolder(contextMenu.folder.id);
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--fg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
              >
                <span style={{ fontSize: '1rem' }}>📁＋</span>
                <span style={{ flex: 1 }}>Նոր Ենթապանակ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (contextMenu.folder) handleOpenEditFolder(contextMenu.folder);
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--fg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
              >
                <span style={{ fontSize: '1rem' }}>⚙️</span>
                <span style={{ flex: 1 }}>Խմբագրել անունը / գույնը</span>
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '4px 0' }} />

              <button
                type="button"
                onClick={() => {
                  if (contextMenu.folder) handleDeleteFolder(contextMenu.folder);
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#EF4444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontWeight: 600
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '1rem' }}>🗑️</span>
                <span style={{ flex: 1 }}>Ջնջել պանակը</span>
              </button>
            </>
          )}

          {/* 3. EMPTY AREA CONTEXT MENU */}
          {contextMenu.type === 'empty' && (
            <>
              {currentFolderId !== 'trash' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenCreateFolder(currentFolderId);
                      setContextMenu(prev => ({ ...prev, isOpen: false }));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--fg)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      fontWeight: 600
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
                  >
                    <span style={{ fontSize: '1rem' }}>📁＋</span>
                    <span style={{ flex: 1 }}>Նոր Պանակ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setContextMenu(prev => ({ ...prev, isOpen: false }));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--fg)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
                  >
                    <span style={{ fontSize: '1rem' }}>↑</span>
                    <span style={{ flex: 1 }}>Վերբեռնել Նիշք</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  loadMedia();
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--fg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
              >
                <span style={{ fontSize: '1rem' }}>🔄</span>
                <span style={{ flex: 1 }}>Թարմացնել</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>F5</span>
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '4px 0' }} />

              <button
                type="button"
                onClick={() => {
                  handleSelectAll();
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--fg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
              >
                <span style={{ fontSize: '1rem' }}>⬚</span>
                <span style={{ flex: 1 }}>Նշել բոլորը</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>Ctrl+A</span>
              </button>

              {currentFolderId === 'trash' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrashSettingsModalOpen(true);
                      setContextMenu(prev => ({ ...prev, isOpen: false }));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--fg)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--fg)')}
                  >
                    <span style={{ fontSize: '1rem' }}>⚙️</span>
                    <span style={{ flex: 1 }}>Աղբարկղի կարգավորումներ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleEmptyTrash();
                      setContextMenu(prev => ({ ...prev, isOpen: false }));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'transparent',
                      color: '#EF4444',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      fontWeight: 600
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '1rem' }}>💥</span>
                    <span style={{ flex: 1 }}>Դատարկել աղբարկղը</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>,
        document.body
      )}

      {/* Dynamic Floating Drag Avatar with Inertia Tilt (1.5x smaller compact 3-card stack) */}
      {mounted && dragAvatar.isDragging && typeof document !== 'undefined' && createPortal(
        <div
          ref={dragAvatarRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 999999,
            pointerEvents: 'none',
            willChange: 'transform, opacity',
            transformOrigin: 'center center',
            transform: `translate3d(${dragPhysicsRef.current.currentX.toFixed(1)}px, ${dragPhysicsRef.current.currentY.toFixed(1)}px, 0) scale(${dragPhysicsRef.current.scale.toFixed(3)})`,
            opacity: dragPhysicsRef.current.opacity,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '76px',
            height: '76px',
            userSelect: 'none'
          }}
        >
          {dragAvatar.folders && dragAvatar.folders.length > 1 ? (
            <div style={{ position: 'relative', width: '84px', height: '84px' }}>
              {/* 2nd Folder (Underneath) */}
              {dragAvatar.folders[1] && (
                <div
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '6px',
                    transform: 'rotate(7deg) scale(0.94)',
                    zIndex: 1,
                    width: '78px',
                    padding: '8px 6px',
                    borderRadius: '10px',
                    background: 'var(--panel, #0f172a)',
                    border: `1.2px solid ${dragAvatar.folders[1].color || '#3B82F6'}`,
                    boxShadow: '0 8px 18px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    animation: 'dragCardBobBottom 2.8s ease-in-out infinite alternate',
                    animationDelay: '-1.4s'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={dragAvatar.folders[1].color || '#3B82F6'} stroke={dragAvatar.folders[1].color || '#3B82F6'} strokeWidth="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <div style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                    {dragAvatar.folders[1].name}
                  </div>
                </div>
              )}

              {/* 1st Folder (On Top) */}
              {dragAvatar.folders[0] && (
                <div
                  style={{
                    position: 'absolute',
                    left: '-8px',
                    top: '0px',
                    transform: 'rotate(-7deg) scale(0.98)',
                    zIndex: 2,
                    width: '78px',
                    padding: '8px 6px',
                    borderRadius: '10px',
                    background: 'var(--panel, #0f172a)',
                    border: `1.5px solid ${dragAvatar.folders[0].color || '#3B82F6'}`,
                    boxShadow: `0 12px 26px rgba(0,0,0,0.65), 0 0 14px ${dragAvatar.folders[0].color || '#3B82F6'}55`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    animation: 'dragCardBobTop 2.6s ease-in-out infinite alternate'
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill={dragAvatar.folders[0].color || '#3B82F6'} stroke={dragAvatar.folders[0].color || '#3B82F6'} strokeWidth="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <div style={{ fontSize: '0.62rem', color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                    {dragAvatar.folders[0].name}
                  </div>
                </div>
              )}

              {/* Multi Folder Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-7px',
                  right: '-7px',
                  zIndex: 10,
                  background: '#3B82F6',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
                  border: '1.5px solid #ffffff'
                }}
              >
                +{dragAvatar.count}
              </div>
            </div>
          ) : dragAvatar.folder ? (
            <div
              style={{
                width: '88px',
                padding: '10px 8px',
                borderRadius: '12px',
                background: 'var(--panel, #0f172a)',
                border: `1.5px solid ${dragAvatar.folder.color || '#3B82F6'}`,
                boxShadow: `0 14px 32px rgba(0, 0, 0, 0.7), 0 0 16px ${dragAvatar.folder.color || '#3B82F6'}66`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                overflow: 'hidden',
                pointerEvents: 'none',
                animation: 'dragSingleCardBob 2.6s ease-in-out infinite alternate'
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill={dragAvatar.folder.color || '#3B82F6'}
                stroke={dragAvatar.folder.color || '#3B82F6'}
                strokeWidth="1.5"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {dragAvatar.folder.name}
              </div>
              {folderStats.has(dragAvatar.folder.id) && (
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                  {folderStats.get(dragAvatar.folder.id)?.sizeFormatted}
                </div>
              )}
            </div>
          ) : dragAvatar.count <= 1 ? (
            dragAvatar.files[0] && (
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  aspectRatio: '1 / 1',
                  borderRadius: '10px',
                  background: 'var(--panel, #0f172a)',
                  border: '1.5px solid #3B82F6',
                  boxShadow: '0 14px 32px rgba(0, 0, 0, 0.7), 0 0 16px rgba(59, 130, 246, 0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  animation: 'dragSingleCardBob 2.6s ease-in-out infinite alternate'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    fontSize: '0.52rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  {dragAvatar.files[0].extension}
                </div>
                <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                  {renderThumbnail(dragAvatar.files[0], 'small')}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)',
                    padding: '10px 4px 2px 4px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ fontSize: '0.58rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dragAvatar.files[0].name}
                  </div>
                </div>
              </div>
            )
          ) : dragAvatar.count === 2 ? (
            <div style={{ position: 'relative', width: '76px', height: '76px' }}>
              {/* 2nd Card (Underneath): Tilted right */}
              {dragAvatar.files[1] && (
                <div
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '5px',
                    transform: 'rotate(6deg) scale(0.94)',
                    zIndex: 1,
                    width: '72px',
                    height: '72px',
                    borderRadius: '10px',
                    background: 'var(--panel, #0f172a)',
                    border: '1.2px solid rgba(59, 130, 246, 0.7)',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.55)',
                    overflow: 'hidden',
                    opacity: 0.94,
                    animation: 'dragCardBobBottom 2.8s ease-in-out infinite alternate',
                    animationDelay: '-1.4s'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      zIndex: 10,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {dragAvatar.files[1].extension}
                  </div>
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {renderThumbnail(dragAvatar.files[1], 'small')}
                  </div>
                </div>
              )}

              {/* 1st Card (On Top of 2nd): Tilted left */}
              {dragAvatar.files[0] && (
                <div
                  style={{
                    position: 'absolute',
                    left: '-10px',
                    top: '0px',
                    transform: 'rotate(-8deg) scale(0.98)',
                    zIndex: 2,
                    width: '72px',
                    height: '72px',
                    borderRadius: '10px',
                    background: 'var(--panel, #0f172a)',
                    border: '1.5px solid #3B82F6',
                    boxShadow: '0 12px 26px rgba(0,0,0,0.7), 0 0 14px rgba(59, 130, 246, 0.4)',
                    overflow: 'hidden',
                    animation: 'dragCardBobTop 2.5s ease-in-out infinite alternate'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      zIndex: 10,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {dragAvatar.files[0].extension}
                  </div>
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {renderThumbnail(dragAvatar.files[0], 'small')}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)',
                      padding: '8px 4px 2px 4px',
                      fontSize: '0.58rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {dragAvatar.files[0].name}
                  </div>
                </div>
              )}

              {/* Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-7px',
                  right: '-7px',
                  zIndex: 10,
                  background: '#3B82F6',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
                  border: '1.5px solid #ffffff'
                }}
              >
                +2
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '76px', height: '76px' }}>
              {/* 3rd Card (Bottom Layer, Under 2nd): Tilted right */}
              {dragAvatar.files[2] && (
                <div
                  style={{
                    position: 'absolute',
                    left: '22px',
                    top: '7px',
                    transform: 'rotate(10deg) scale(0.92)',
                    zIndex: 1,
                    width: '72px',
                    height: '72px',
                    borderRadius: '10px',
                    background: 'var(--panel, #0f172a)',
                    border: '1.2px solid rgba(59, 130, 246, 0.65)',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.55)',
                    overflow: 'hidden',
                    opacity: 0.92,
                    animation: 'dragCardBobBottom 2.9s ease-in-out infinite alternate',
                    animationDelay: '-1.8s'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      zIndex: 10,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {dragAvatar.files[2].extension}
                  </div>
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {renderThumbnail(dragAvatar.files[2], 'small')}
                  </div>
                </div>
              )}

              {/* 2nd Card (Middle Layer, Under 1st, On top of 3rd): Straight */}
              {dragAvatar.files[1] && (
                <div
                  style={{
                    position: 'absolute',
                    left: '3px',
                    top: '3px',
                    transform: 'rotate(0deg) scale(0.95)',
                    zIndex: 2,
                    width: '72px',
                    height: '72px',
                    borderRadius: '10px',
                    background: 'var(--panel, #0f172a)',
                    border: '1.2px solid rgba(59, 130, 246, 0.8)',
                    boxShadow: '0 10px 22px rgba(0,0,0,0.65)',
                    overflow: 'hidden',
                    opacity: 0.96,
                    animation: 'dragCardBobMid 2.7s ease-in-out infinite alternate',
                    animationDelay: '-0.9s'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      zIndex: 10,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {dragAvatar.files[1].extension}
                  </div>
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {renderThumbnail(dragAvatar.files[1], 'small')}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)',
                      padding: '8px 4px 2px 4px',
                      fontSize: '0.56rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {dragAvatar.files[1].name}
                  </div>
                </div>
              )}

              {/* 1st Card (Top Layer, On top of 2nd): Tilted left */}
              {dragAvatar.files[0] && (
                <div
                  style={{
                    position: 'absolute',
                    left: '-16px',
                    top: '0px',
                    transform: 'rotate(-10deg) scale(0.98)',
                    zIndex: 3,
                    width: '72px',
                    height: '72px',
                    borderRadius: '10px',
                    background: 'var(--panel, #0f172a)',
                    border: '1.5px solid #3B82F6',
                    boxShadow: '0 14px 30px rgba(0,0,0,0.75), 0 0 16px rgba(59, 130, 246, 0.45)',
                    overflow: 'hidden',
                    animation: 'dragCardBobTop 2.4s ease-in-out infinite alternate'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      zIndex: 10,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {dragAvatar.files[0].extension}
                  </div>
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {renderThumbnail(dragAvatar.files[0], 'small')}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)',
                      padding: '10px 4px 2px 4px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ fontSize: '0.58rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dragAvatar.files[0].name}
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-item Count Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-10px',
                  zIndex: 10,
                  background: '#3B82F6',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.5), 0 0 8px rgba(59,130,246,0.6)',
                  border: '1.5px solid #ffffff'
                }}
              >
                +{dragAvatar.count}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Marquee (Rubber-Band) Selection Box */}
      {mounted && marqueeRect && (Math.abs(marqueeRect.currentX - marqueeRect.startX) > 4 || Math.abs(marqueeRect.currentY - marqueeRect.startY) > 4) && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(marqueeRect.startX, marqueeRect.currentX)}px`,
            top: `${Math.min(marqueeRect.startY, marqueeRect.currentY)}px`,
            width: `${Math.abs(marqueeRect.currentX - marqueeRect.startX)}px`,
            height: `${Math.abs(marqueeRect.currentY - marqueeRect.startY)}px`,
            border: '1.5px solid #3B82F6',
            background: 'rgba(59, 130, 246, 0.18)',
            borderRadius: '4px',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
            pointerEvents: 'none',
            zIndex: 99999
          }}
        />,
        document.body
      )}
      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: CUSTOM DIALOG / POPUP MODAL (REPLACES WINDOW.ALERT & CONFIRM)
          ══════════════════════════════════════════════════════════════════════════ */}
      {mounted && dialogModal.isOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-modal-backdrop="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'modalBackdropFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={() => {
            if (dialogModal.type === 'alert' || dialogModal.type === 'info') {
              closeDialog();
            } else if (dialogModal.onCancel) {
              dialogModal.onCancel();
            } else {
              closeDialog();
            }
          }}
        >
          <div
            data-modal-container="true"
            style={{
              background: 'var(--panel)',
              border: `1.5px solid ${
                dialogModal.type === 'warning'
                  ? '#F59E0B'
                  : dialogModal.type === 'danger'
                  ? '#EF4444'
                  : 'var(--panel-border)'
              }`,
              borderRadius: '18px',
              width: '100%',
              maxWidth: dialogModal.usedInList && dialogModal.usedInList.length > 0 ? '500px' : '440px',
              padding: '24px',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'modalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header / Title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '1.4rem',
                  background:
                    dialogModal.type === 'danger'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : dialogModal.type === 'warning'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : dialogModal.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(59, 130, 246, 0.15)',
                  color:
                    dialogModal.type === 'danger'
                      ? '#EF4444'
                      : dialogModal.type === 'warning'
                      ? '#F59E0B'
                      : dialogModal.type === 'success'
                      ? '#10B981'
                      : '#3B82F6'
                }}
              >
                {dialogModal.type === 'danger'
                  ? '🗑️'
                  : dialogModal.type === 'warning'
                  ? '⚠️'
                  : dialogModal.type === 'success'
                  ? '✓'
                  : 'ℹ️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--fg)' }}>
                  {dialogModal.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  {dialogModal.message}
                </p>
              </div>
            </div>

            {/* If files are linked/in-use: display interactive usage preview */}
            {dialogModal.usedInList && dialogModal.usedInList.length > 0 && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️ Զգուշացում․ Այս նիշքն օգտագործվում է հետևյալ բաժիններում՝</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {dialogModal.usedInList.map((u, i) => {
                    const title = typeof u === 'string' ? u : u.title;
                    const type = typeof u === 'string' ? '' : u.type;
                    return (
                      <div
                        key={i}
                        style={{
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--panel)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--panel-border)'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{title}</span>
                        {type && <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{type}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              {dialogModal.type !== 'alert' && dialogModal.type !== 'info' && (
                <button
                  type="button"
                  onClick={() => {
                    if (dialogModal.onCancel) dialogModal.onCancel();
                    else closeDialog();
                  }}
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--fg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {dialogModal.cancelText || 'Չեղարկել'}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (dialogModal.onConfirm) dialogModal.onConfirm();
                  closeDialog();
                }}
                style={{
                  background:
                    dialogModal.type === 'danger'
                      ? '#DC2626'
                      : dialogModal.type === 'warning'
                      ? '#D97706'
                      : 'var(--accent)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                {dialogModal.confirmText || (dialogModal.type === 'alert' || dialogModal.type === 'info' ? 'Լավ' : 'Հաստատել')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: DETAILED USAGE INSPECTOR MODAL
          ══════════════════════════════════════════════════════════════════════════ */}
      {mounted && usageInspectFile && typeof document !== 'undefined' && createPortal(
        <div
          data-modal-backdrop="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'modalBackdropFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={() => setUsageInspectFile(null)}
        >
          <div
            data-modal-container="true"
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '540px',
              padding: '24px',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              animation: 'modalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}
                >
                  🔗
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--fg)' }}>
                    Կայքում Օգտագործման Վայրեր
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Նիշքը կապված է կայքի հետևյալ բաժիններին
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsageInspectFile(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* File Info Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--bg)',
                borderRadius: '12px',
                border: '1px solid var(--panel-border)'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                {renderThumbnail(usageInspectFile, 'small')}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {usageInspectFile.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '2px' }}>
                  {usageInspectFile.sizeFormatted} • {usageInspectFile.extension.toUpperCase()} • {usageInspectFile.type}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyUrl(usageInspectFile.url)}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3B82F6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>📋</span>
                <span>Հղում</span>
              </button>
            </div>

            {/* Usages List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--fg)' }}>
                  Ակտիվ հղումներ ({usageInspectFile.usedIn?.length || 0})
                </span>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                  ● Օգտագործվում է
                </span>
              </div>

              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingRight: '4px'
                }}
              >
                {usageInspectFile.usedIn && usageInspectFile.usedIn.length > 0 ? (
                  usageInspectFile.usedIn.map((usage, idx) => {
                    let icon = '📌';
                    if (usage.includes('Քեյս') || usage.includes('Case')) icon = '💼';
                    else if (usage.includes('Հավելված') || usage.includes('App')) icon = '📱';
                    else if (usage.includes('Տառատեսակ') || usage.includes('Font')) icon = '🔤';
                    else if (usage.includes('Կարծիք') || usage.includes('Testimonial')) icon = '⭐';
                    else if (usage.includes('Բրենդինգ') || usage.includes('Branding')) icon = '🎨';
                    else if (usage.includes('Կարգավորում') || usage.includes('Settings')) icon = '⚙️';

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--bg)',
                          borderRadius: '10px',
                          border: '1px solid var(--panel-border)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                          <span style={{ fontWeight: 500, color: 'var(--fg)' }}>{usage}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10B981',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}
                          >
                            Ակտիվ
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnlinkUsage(usageInspectFile, usage)}
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              borderRadius: '6px',
                              padding: '3px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>🔓</span>
                            <span>Ապակապել</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Այս նիշքը չի օգտագործվում կայքի ոչ մի հատվածում:
                  </div>
                )}
              </div>
            </div>

            {/* Note & Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                💡 Կայքից ապակապելուց հետո նիշքը կմնա պահոցում, բայց կայքում չի ցուցադրվի
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {usageInspectFile.usedIn && usageInspectFile.usedIn.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleUnlinkUsage(usageInspectFile)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🔓</span>
                    <span>Ապակապել բոլորը</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    openPreview(usageInspectFile);
                    setUsageInspectFile(null);
                  }}
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--fg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  👁️ Նախադիտել
                </button>
                <button
                  type="button"
                  onClick={() => setUsageInspectFile(null)}
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Փակել
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
