"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { MediaFolder, MediaFile, ViewMode, SortField, SortOrder, MediaFileType, StorageStats, TrashSettings } from '@/lib/mediaTypes';

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
  // Data state
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);

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

  const [sortField, setSortField] = useState<SortField>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hdesign_media_sort_field') as SortField | null;
        if (saved && ['name', 'size', 'modifiedAt', 'type'].includes(saved)) {
          return saved;
        }
      } catch (e) {}
    }
    return 'name';
  });

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hdesign_media_sort_order') as SortOrder | null;
        if (saved === 'asc' || saved === 'desc') {
          return saved;
        }
      } catch (e) {}
    }
    return 'asc';
  });

  const [onlyUsedInSite, setOnlyUsedInSite] = useState(false);

  // Floating Drag Preview Avatar with Inertia Tilt
  const [dragAvatar, setDragAvatar] = useState<{
    isDragging: boolean;
    count: number;
    file?: MediaFile;
  }>({
    isDragging: false,
    count: 0
  });
  const dragAvatarRef = useRef<HTMLDivElement | null>(null);
  const dragPhysicsRef = useRef<{
    targetX: number;
    targetY: number;
    currentX: number;
    currentY: number;
    targetTilt: number;
    currentTilt: number;
    lastEventX: number;
    lastEventTime: number;
    active: boolean;
  }>({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    targetTilt: 0,
    currentTilt: 0,
    lastEventX: 0,
    lastEventTime: 0,
    active: false
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
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

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
    setLoading(true);
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
      setError(err.message || 'Չհաջողվեց բեռնել մեդիա գրադարանը');
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

  const handleSortFieldChange = (field: SortField) => {
    setSortField(field);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hdesign_media_sort_field', field);
      } catch (e) {}
    }
  };

  const handleSortOrderToggle = () => {
    setSortOrder(prev => {
      const next = prev === 'asc' ? 'desc' : 'asc';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('hdesign_media_sort_order', next);
        } catch (e) {}
      }
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
        { id: null, name: 'Այս Համակարգիչը' },
        { id: 'trash', name: '🗑️ Աղբարկղ', color: '#EF4444' }
      ];
    }
    const crumbs: Array<{ id: string | null; name: string; color?: string }> = [
      { id: null, name: 'Այս Համակարգիչը (Գլխավոր)' }
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

  // Folder item count helper
  const folderItemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    folders.forEach(f => counts.set(f.id, 0));
    files.forEach(f => {
      if (!f.isTrashed && f.folderId && counts.has(f.folderId)) {
        counts.set(f.folderId, (counts.get(f.folderId) || 0) + 1);
      }
    });
    return counts;
  }, [folders, files]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    const isTrashView = currentFolderId === 'trash';
    return files.filter(file => {
      // In trash view, show ONLY trashed files
      if (isTrashView) {
        if (!file.isTrashed) return false;
      } else {
        // In normal view, HIDE trashed files
        if (file.isTrashed) return false;

        // Folder filter:
        const matchFolder = searchQuery ? true : file.folderId === currentFolderId;
        if (!matchFolder) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && file.type !== typeFilter) return false;

      // Used in site filter
      if (onlyUsedInSite && (!file.usedIn || file.usedIn.length === 0)) return false;

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
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
      } else if (sortField === 'size') {
        comparison = a.size - b.size;
      } else if (sortField === 'modifiedAt') {
        comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
      } else if (sortField === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [files, currentFolderId, searchQuery, typeFilter, onlyUsedInSite, sortField, sortOrder]);

  // Folder CRUD handlers
  const handleOpenCreateFolder = (parentId: string | null = currentFolderId) => {
    setFolderModalMode('create');
    setEditingFolderId(null);
    setFolderFormName('');
    setFolderFormColor('#3B82F6');
    setFolderFormParentId(parentId);
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
          alert(data.error || 'Չհաջողվեց ստեղծել պանակը');
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
          alert(data.error || 'Չհաջողվեց թարմացնել պանակը');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ պանակը պահպանելիս');
    }
  };

  const handleDeleteFolder = async (folder: MediaFolder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const count = folderItemCounts.get(folder.id) || 0;
    const confirmText = count > 0
      ? `Վստա՞հ եք, որ ցանկանում եք ջնջել «${folder.name}» պանակը:\nԴրանում առկա ${count} ֆայլերը կտեղափոխվեն վերադաս մակարդակ:`
      : `Վստա՞հ եք, որ ցանկանում եք ջնջել «${folder.name}» պանակը:`;

    if (!confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/admin/media/folders?id=${encodeURIComponent(folder.id)}`, {
        method: 'DELETE',
        headers: { Authorization: token || '' }
      });
      const data = await res.json();
      if (data.success) {
        setFolders(prev => prev.filter(f => f.id !== folder.id));
        // Reparent local files
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
        alert(data.error || 'Չհաջողվեց ջնջել պանակը');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ պանակը ջնջելիս');
    }
  };

  // Move files to target folder
  const handleMoveFiles = async (targetFolderId: string | null, fileIdsToMove: string[]) => {
    if (fileIdsToMove.length === 0) return;
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
      if (data.success) {
        setFiles(prev => prev.map(f => {
          if (fileIdsToMove.includes(f.id)) {
            return { ...f, folderId: targetFolderId };
          }
          return f;
        }));
        const targetName = targetFolderId ? folderMap.get(targetFolderId)?.name || 'պանակ' : 'Գլխավոր մակարդակ';
        showToast(`${fileIdsToMove.length} նիշք տեղափոխվեց «${targetName}»`);
        setSelectedFileIds(new Set());
        setIsMoveModalOpen(false);
      } else {
        alert(data.error || 'Չհաջողվեց տեղափոխել նիշքերը');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ նիշքերը տեղափոխելիս');
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

    // If right clicking on a file that is not yet selected, select it
    if (type === 'file' && item?.file) {
      if (!selectedFileIds.has(item.file.id)) {
        setSelectedFileIds(new Set([item.file.id]));
        setLastSelectedFileId(item.file.id);
      }
    }

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
      alert('Սխալ արխիվը պատրաստելիս: ' + (err.message || ''));
    }
  };

  // File Upload (with automatic ZIP extraction support)
  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    // Check if a ZIP file was uploaded
    const zipFile = filesToUpload.find(f => f.name.toLowerCase().endsWith('.zip') || f.type === 'application/zip');
    if (zipFile && filesToUpload.length === 1) {
      const shouldExtract = confirm(`Դուք վերբեռնում եք «${zipFile.name}» արխիվը:\nՑանկանու՞մ եք ԱՊԱԱՐԽԻՎԱՑՆԵԼ (Extract) դրա բոլոր նիշքերը ընթացիկ պանակում:`);
      if (shouldExtract) {
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
        }
      }
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
      if (currentFolderId && currentFolderId !== 'trash') {
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

  // Move single file to trash
  const handleMoveToTrash = async (file: MediaFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'moveToTrash', fileIds: [file.id] })
      });
      const data = await res.json();
      if (data.success) {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isTrashed: true, trashedAt: new Date().toISOString() } : f));
        setSelectedFileIds(prev => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        });
        if (previewFile?.id === file.id) setPreviewFile(null);
        showToast('Նիշքը տեղափոխվեց աղբարկղ');
        loadMedia();
      } else {
        alert(data.error || 'Չհաջողվեց տեղափոխել աղբարկղ');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ նիշքը աղբարկղ տեղափոխելիս');
    }
  };

  // Batch move to trash
  const handleBatchMoveToTrash = async (ids?: string[]) => {
    const idsToTrash = ids || Array.from(selectedFileIds);
    if (idsToTrash.length === 0) return;
    if (!confirm(`Վստա՞հ եք, որ ցանկանում եք աղբարկղ տեղափոխել ընտրված ${idsToTrash.length} նիշքերը:`)) return;

    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'moveToTrash', fileIds: idsToTrash })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedFileIds(new Set());
        if (previewFile && idsToTrash.includes(previewFile.id)) setPreviewFile(null);
        showToast(`${idsToTrash.length} նիշք տեղափոխվեց աղբարկղ`);
        loadMedia();
      } else {
        alert(data.error || 'Չհաջողվեց տեղափոխել աղբարկղ');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ աղբարկղ տեղափոխելիս');
    }
  };

  // Restore single file from trash
  const handleRestoreFile = async (file: MediaFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'restore', fileIds: [file.id] })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedFileIds(prev => { const next = new Set(prev); next.delete(file.id); return next; });
        if (previewFile?.id === file.id) setPreviewFile(null);
        showToast('Նիշքը հաջողությամբ վերականգնվեց');
        loadMedia();
      } else {
        alert(data.error || 'Չհաջողվեց վերականգնել նիշքը');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ նիշքը վերականգնելիս');
    }
  };

  // Batch restore from trash
  const handleBatchRestore = async () => {
    const idsToRestore = Array.from(selectedFileIds);
    if (idsToRestore.length === 0) return;
    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'restore', fileIds: idsToRestore })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedFileIds(new Set());
        showToast(`${idsToRestore.length} նիշք վերականգնվեց`);
        loadMedia();
      } else {
        alert(data.error || 'Չհաջողվեց վերականգնել նիշքերը');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ նիշքերը վերականգնելիս');
    }
  };

  // Permanently delete single file from Supabase & disk
  const handlePermanentDelete = async (file: MediaFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Վստա՞հ եք, որ ցանկանում եք ԸՆԴՄԻՇՏ հեռացնել «${file.name}» նիշքը:\nԱյն կջնջվի Supabase պահոցից և սերվերից անվերադարձ:`)) return;

    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'permanentDelete', fileIds: [file.id] })
      });
      const data = await res.json();
      if (data.success) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        setSelectedFileIds(prev => { const next = new Set(prev); next.delete(file.id); return next; });
        if (previewFile?.id === file.id) setPreviewFile(null);
        showToast('Նիշքը ընդմիշտ ջնջվեց Supabase-ից');
        loadMedia();
      } else {
        alert(data.error || 'Չհաջողվեց ընդմիշտ ջնջել նիշքը');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ նիշքը ընդմիշտ ջնջելիս');
    }
  };

  // Batch permanently delete
  const handleBatchPermanentDelete = async () => {
    const idsToDelete = Array.from(selectedFileIds);
    if (idsToDelete.length === 0) return;
    if (!confirm(`Վստա՞հ եք, որ ցանկանում եք ԸՆԴՄԻՇՏ հեռացնել ընտրված ${idsToDelete.length} նիշքերը:\nԴրանք կջնջվեն Supabase-ից և սերվերից անվերադարձ:`)) return;

    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'permanentDelete', fileIds: idsToDelete })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedFileIds(new Set());
        if (previewFile && idsToDelete.includes(previewFile.id)) setPreviewFile(null);
        showToast(`${idsToDelete.length} նիշք ընդմիշտ հեռացվեց Supabase-ից`);
        loadMedia();
      } else {
        alert(data.error || 'Չհաջողվեց ընդմիշտ ջնջել նիշքերը');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ նիշքերը ջնջելիս');
    }
  };

  // Empty entire trash
  const handleEmptyTrash = async () => {
    const trashedCount = files.filter(f => f.isTrashed).length;
    if (trashedCount === 0) {
      alert('Աղբարկղը դատարկ է:');
      return;
    }
    if (!confirm(`Վստա՞հ եք, որ ցանկանում եք դատարկել աղբարկղը:\nԲոլոր ${trashedCount} նիշքերը կջնջվեն Supabase-ից և սերվերից ԸՆԴՄԻՇՏ:`)) return;

    try {
      const res = await fetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token || '' },
        body: JSON.stringify({ action: 'empty' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Աղբարկղը ամբողջությամբ դատարկվեց');
        loadMedia();
      } else {
        alert(data.error || 'Չհաջողվեց դատարկել աղբարկղը');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ աղբարկղը դատարկելիս');
    }
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
        alert(data.error || 'Չհաջողվեց պահպանել կարգավորումները');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ կարգավորումները պահպանելիս');
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
        alert(data.error || 'Անվանափոխումը ձախողվեց');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ անվանափոխելիս');
    }
  };

  // Advanced File Selection: Standard Shift + Ctrl multi-selection
  const handleFileClick = (file: MediaFile, e: React.MouseEvent) => {
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

    // 3. Normal single click: Select only this file and update anchor
    setSelectedFileIds(new Set([file.id]));
    setLastSelectedFileId(file.id);
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

  const handleSelectAll = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map(f => f.id)));
    }
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

      // Ctrl+A / Cmd+A -> Select all files in current view
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A' || e.key === 'ա' || e.key === 'Ա')) {
        e.preventDefault();
        setSelectedFileIds(new Set(filteredFiles.map(f => f.id)));
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
        } else if (selectedFileIds.size > 0) {
          setSelectedFileIds(new Set());
          setLastSelectedFileId(null);
        }
        return;
      }

      // Delete / Backspace -> Move to Trash or Permanent Delete selected items
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFileIds.size > 0) {
        e.preventDefault();
        if (currentFolderId === 'trash') {
          handleBatchPermanentDelete();
        } else {
          handleBatchMoveToTrash();
        }
        return;
      }

      // Enter -> Open preview if single file is selected
      if (e.key === 'Enter' && selectedFileIds.size === 1) {
        const selId = Array.from(selectedFileIds)[0];
        const f = filteredFiles.find(item => item.id === selId);
        if (f) {
          e.preventDefault();
          openPreview(f);
          return;
        }
      }

      // Arrow keys navigation (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
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
    selectedFileIds,
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

  // Drag avatar coordinate & inertia tilt tracking (Ultra-smooth 60fps physics loop without React re-renders)
  useEffect(() => {
    if (!dragAvatar.isDragging) return;

    let animId: number;

    const updatePhysics = () => {
      if (!dragPhysicsRef.current.active) return;
      const p = dragPhysicsRef.current;

      // Smooth lerp for position and tilt
      p.currentX += (p.targetX - p.currentX) * 0.4;
      p.currentY += (p.targetY - p.currentY) * 0.4;
      p.currentTilt += (p.targetTilt - p.currentTilt) * 0.18;
      
      // Decay tilt back to 0 smoothly
      p.targetTilt *= 0.88;

      if (dragAvatarRef.current) {
        dragAvatarRef.current.style.transform = `translate3d(${p.currentX + 14}px, ${p.currentY + 14}px, 0) rotate(${p.currentTilt.toFixed(2)}deg) scale(0.9)`;
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);

    const handleGlobalDragOver = (e: DragEvent) => {
      const now = performance.now();
      const p = dragPhysicsRef.current;
      const dt = Math.max(1, now - p.lastEventTime);
      const dx = e.clientX - p.lastEventX;
      const speedX = dx / dt; // velocity in px/ms

      p.targetX = e.clientX;
      p.targetY = e.clientY;
      // Clamped inertia tilt based on horizontal velocity
      p.targetTilt = Math.max(-22, Math.min(22, speedX * 26));
      p.lastEventX = e.clientX;
      p.lastEventTime = now;
    };

    const handleGlobalDragEnd = () => {
      dragPhysicsRef.current.active = false;
      setDragAvatar(prev => ({ ...prev, isDragging: false }));
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
  }, [dragAvatar.isDragging]);

  // Drag and Drop files onto folder cards/tree items
  const handleDragStart = (fileId: string, e: React.DragEvent) => {
    const toMove = selectedFileIds.has(fileId) ? Array.from(selectedFileIds) : [fileId];
    setDraggedFileIds(toMove);
    e.dataTransfer.setData('text/plain', JSON.stringify(toMove));
    e.dataTransfer.effectAllowed = 'move';

    const primary = files.find(f => f.id === fileId);

    // Create transparent drag image to hide default browser drag ghost
    try {
      const img = new Image();
      img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4=';
      e.dataTransfer.setDragImage(img, 0, 0);
    } catch (err) {}

    dragPhysicsRef.current = {
      targetX: e.clientX,
      targetY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      targetTilt: 0,
      currentTilt: 0,
      lastEventX: e.clientX,
      lastEventTime: performance.now(),
      active: true
    };

    setDragAvatar({
      isDragging: true,
      count: toMove.length,
      file: primary
    });
  };

  const handleDragEnd = () => {
    dragPhysicsRef.current.active = false;
    setDragAvatar(prev => ({ ...prev, isDragging: false }));
    setDragOverFolderId(null);
  };

  const handleFolderDragOver = (folderId: string | null, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
  };

  const handleFolderDrop = (targetFolderId: string | null, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    // Check if dragging files from computer
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
      return;
    }

    if (draggedFileIds.length > 0) {
      handleMoveFiles(targetFolderId, draggedFileIds);
      setDraggedFileIds([]);
    }
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
    const count = folderItemCounts.get(folder.id) || 0;

    return (
      <div key={folder.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
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
            cursor: 'pointer',
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
          title={folder.name}
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
                fontWeight: 600
              }}
            >
              {count}
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
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#090a0f' }}>
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
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', color: '#818cf8', position: 'relative' }}>
          <svg width={size === 'large' ? 44 : 28} height={size === 'large' ? 44 : 28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: '4px', letterSpacing: '0.05em' }}>VIDEO</span>
        </div>
      );
    }

    if (isFont) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', color: '#34d399' }}>
          <span style={{ fontSize: size === 'large' ? '2.4rem' : '1.4rem', fontWeight: 700, fontFamily: 'serif' }}>Aa</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>{file.extension.toUpperCase()}</span>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #701a75 0%, #4a044e 100%)', color: '#f472b6' }}>
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
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--panel)', color: 'var(--muted)' }}>
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
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
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
        </div>
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
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
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
                    style={{
                      background: isLast ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: isLast ? '#3B82F6' : 'var(--fg)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: isLast ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
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
              onClick={() => setOnlyUsedInSite(prev => !prev)}
              style={{
                background: onlyUsedInSite ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: onlyUsedInSite ? '#10B981' : 'var(--muted)',
                border: `1px solid ${onlyUsedInSite ? '#10B981' : 'var(--panel-border)'}`,
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
          </div>

          {/* Right Section: View Mode & Sorting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Sort Field Selector */}
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value as SortField)}
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
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={`Տեսակավորում՝ ${sortOrder === 'asc' ? 'Աճող' : 'Նվազող'}`}
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

        {/* Multi-Selection Bar */}
        {selectedFileIds.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #1e3a8a 0%, #172554 100%)',
            border: '1px solid #3b82f6',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
            animation: 'fadeIn 0.2s ease',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Ընտրված է {selectedFileIds.size} նիշք
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {selectedFileIds.size === filteredFiles.length ? 'Ապանշել բոլորը' : 'Նշել բոլորը'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {selectedFileIds.size === 1 && (
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
                <button
                  type="button"
                  onClick={() => {
                    setMoveTargetFolderId(currentFolderId);
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
                  <span>Տեղափոխել պանակ...</span>
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
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedFileIds(new Set());
                setLastSelectedFileId(null);
              }}
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
              <span style={{ fontWeight: currentFolderId === null ? 700 : 500 }}>Այս Համակարգիչը</span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: currentFolderId === null ? 'rgba(255,255,255,0.25)' : 'var(--panel-border)',
                fontWeight: 600
              }}
            >
              {files.filter(f => !f.isTrashed).length}
            </span>
          </div>

          {/* Trash quick link */}
          <div
            onClick={() => navigateToFolder('trash')}
            onDragOver={e => handleFolderDragOver('trash', e)}
            onDragLeave={handleFolderDragLeave}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
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
          onContextMenu={e => openContextMenu(e, 'empty')}
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--panel-border)',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            minHeight: '550px'
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
                        {trashSettingsForm.autoDeleteEnabled
                          ? `Նիշքերը ավտոմատ կերպով ընդմիշտ կջնջվեն ${trashSettingsForm.retentionDays} օր հետո։`
                          : 'Ավտոմատ ինքնաջնջումն անջատված է։ Նիշքերը պահպանվում են մինչև դատարկելը։'}
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
              {currentSubfolders.length > 0 && !searchQuery && currentFolderId !== 'trash' && (
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
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '12px'
                    }}
                  >
                    {currentSubfolders.map(subf => {
                      const count = folderItemCounts.get(subf.id) || 0;
                      const isDragTarget = dragOverFolderId === subf.id;

                      return (
                        <div
                          key={subf.id}
                          onClick={() => navigateToFolder(subf.id)}
                          onContextMenu={e => openContextMenu(e, 'folder', { folder: subf })}
                          onDragOver={e => handleFolderDragOver(subf.id, e)}
                          onDragLeave={handleFolderDragLeave}
                          onDrop={e => handleFolderDrop(subf.id, e)}
                          style={{
                            background: isDragTarget ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg)',
                            border: `1px solid ${isDragTarget ? '#3B82F6' : 'var(--panel-border)'}`,
                            borderRadius: '12px',
                            padding: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
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
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {subf.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                                {count} նիշք
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
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    {filteredFiles.map(file => {
                      const isSelected = selectedFileIds.has(file.id);

                      return (
                        <div
                          key={file.id}
                          draggable
                          onDragStart={e => handleDragStart(file.id, e)}
                          onDragEnd={handleDragEnd}
                          onClick={e => handleFileClick(file, e)}
                          onDoubleClick={e => handleFileDoubleClick(file, e)}
                          onContextMenu={e => openContextMenu(e, 'file', { file })}
                          style={{
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg)',
                            border: `1.5px solid ${isSelected ? '#3B82F6' : 'var(--panel-border)'}`,
                            borderRadius: '14px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 4px 14px rgba(59, 130, 246, 0.2)' : 'none'
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
                                whiteSpace: 'nowrap'
                              }}
                              title={file.name}
                            >
                              {file.name}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)' }}>
                              <span>{file.sizeFormatted}</span>
                              {file.usedIn && file.usedIn.length > 0 && (
                                <span
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10B981',
                                    padding: '1px 6px',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '0.68rem'
                                  }}
                                >
                                  Կայքում ✓
                                </span>
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

                      return (
                        <div
                          key={file.id}
                          draggable
                          onDragStart={e => handleDragStart(file.id, e)}
                          onDragEnd={handleDragEnd}
                          onClick={e => handleFileClick(file, e)}
                          onDoubleClick={e => handleFileDoubleClick(file, e)}
                          onContextMenu={e => openContextMenu(e, 'file', { file })}
                          style={{
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg)',
                            border: `1.5px solid ${isSelected ? '#3B82F6' : 'var(--panel-border)'}`,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative'
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
                                whiteSpace: 'nowrap'
                              }}
                              title={file.name}
                            >
                              {file.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '2px' }}>
                              {file.sizeFormatted}
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

                      return (
                        <div
                          key={file.id}
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
                            border: `1px solid ${isSelected ? '#3B82F6' : 'var(--panel-border)'}`,
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
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {file.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                                {file.sizeFormatted} • {file.extension.toUpperCase()}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {file.usedIn && file.usedIn.length > 0 && (
                              <span
                                style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600
                                }}
                              >
                                Կայքում
                              </span>
                            )}
                            <button
                              type="button"
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
                          <th style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => setSortField('name')}>
                            Անուն {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => setSortField('type')}>
                            Տեսակ {sortField === 'type' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => setSortField('size')}>
                            Չափս {sortField === 'size' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th style={{ padding: '10px 12px' }}>Պանակ</th>
                          <th style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => setSortField('modifiedAt')}>
                            Ամսաթիվ {sortField === 'modifiedAt' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Գործողություն</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFiles.map(file => {
                          const isSelected = selectedFileIds.has(file.id);
                          const folderObj = file.folderId ? folderMap.get(file.folderId) : undefined;

                          return (
                            <tr
                              key={file.id}
                              draggable
                              onDragStart={e => handleDragStart(file.id, e)}
                              onDragEnd={handleDragEnd}
                              onClick={e => handleFileClick(file, e)}
                              onDoubleClick={e => handleFileDoubleClick(file, e)}
                              onContextMenu={e => openContextMenu(e, 'file', { file })}
                              style={{
                                borderBottom: '1px solid var(--panel-border)',
                                background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
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
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                    {renderThumbnail(file, 'small')}
                                  </div>
                                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                    {file.name}
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
                                    <button
                                      type="button"
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
                                    {file.isTrashed ? (
                                      <>
                                        <button
                                          type="button"
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
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: '12px'
                    }}
                  >
                    {filteredFiles.map(file => {
                      const isSelected = selectedFileIds.has(file.id);

                      return (
                        <div
                          key={file.id}
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
                            border: `1px solid ${isSelected ? '#3B82F6' : 'var(--panel-border)'}`,
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
                                whiteSpace: 'nowrap'
                              }}
                              title={file.name}
                            >
                              {file.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                              {file.extension.toUpperCase()} • {file.sizeFormatted}
                            </div>
                          </div>

                          <div onClick={e => toggleSelectFile(file.id, e)}>
                            <input type="checkbox" checked={isSelected} readOnly />
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
      {isFolderModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsFolderModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={folderFormColor}
                  stroke={folderFormColor}
                  strokeWidth="1.5"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  {folderModalMode === 'create' ? 'Նոր Պանակ' : 'Խմբագրել Պանակը'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}
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

              {/* Parent Folder (Allows nesting folders inside folders!) */}
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
                  <option value="">Գլխավոր Մակարդակ (Root)</option>
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: MOVE TO FOLDER
          ══════════════════════════════════════════════════════════════════════════ */}
      {isMoveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
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
              Ընտրեք թիրախային պանակը, ուր ցանկանում եք տեղափոխել ընտրված {selectedFileIds.size} նիշքերը:
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
                🖥️ Գլխավոր Մակարդակ (Root)
              </div>

              {folders.map(f => (
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
                onClick={() => handleMoveFiles(moveTargetFolderId, Array.from(selectedFileIds))}
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: FULL FILE INSPECTOR / PREVIEW
          ══════════════════════════════════════════════════════════════════════════ */}
      {previewFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={closePreview}
        >
          <div
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
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
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
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#10B981', marginBottom: '4px' }}>
                    ✓ Օգտագործվում է կայքում.
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--fg)', lineHeight: 1.4 }}>
                    {previewFile.usedIn.map((usage, idx) => (
                      <li key={idx}>{usage}</li>
                    ))}
                  </ul>
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
                    {previewFile.folderId ? folderMap.get(previewFile.folderId)?.name || 'Պանակ' : 'Գլխավոր (Root)'}
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: INLINE RENAME FILE
          ══════════════════════════════════════════════════════════════════════════ */}
      {renamingFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setRenamingFile(null)}
        >
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '380px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: TRASH SETTINGS (AUTO-CLEANUP & RETENTION DAYS)
          ══════════════════════════════════════════════════════════════════════════ */}
      {isTrashSettingsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10002,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsTrashSettingsModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--panel-border)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          RIGHT-CLICK CONTEXT MENU (WINDOWS-STYLE POPUP)
          ══════════════════════════════════════════════════════════════════════════ */}
      {contextMenu.isOpen && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 99999,
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
              {selectedFileIds.size <= 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const f = contextMenu.file || (selectedFileIds.size === 1 ? files.find(item => item.id === Array.from(selectedFileIds)[0]) : undefined);
                    if (f) openPreview(f);
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
                  const toDownload = selectedFileIds.size > 0 
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
                <span style={{ fontSize: '1rem' }}>{selectedFileIds.size > 1 ? '📦' : '⬇️'}</span>
                <span style={{ flex: 1 }}>{selectedFileIds.size > 1 ? `Ներբեռնել ZIP-ով (${selectedFileIds.size})` : 'Ներբեռնել'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedFileIds.size > 1) {
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
                <span style={{ flex: 1 }}>{selectedFileIds.size > 1 ? 'Պատճենել հղումները' : 'Պատճենել հղումը'}</span>
              </button>

              {selectedFileIds.size <= 1 && contextMenu.file && (
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

              {currentFolderId !== 'trash' && (
                <button
                  type="button"
                  onClick={() => {
                    setMoveTargetFolderId(currentFolderId);
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
              )}

              <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '4px 0' }} />

              {currentFolderId === 'trash' || contextMenu.file?.isTrashed ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedFileIds.size > 1) {
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
                      if (selectedFileIds.size > 1) {
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
                    if (selectedFileIds.size > 1) {
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
        </div>
      )}

      {/* Dynamic Floating Drag Avatar with Inertia Tilt (Square Card Preview) */}
      {dragAvatar.isDragging && (
        <div
          ref={dragAvatarRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 999999,
            pointerEvents: 'none',
            willChange: 'transform',
            transformOrigin: 'top left',
            width: '120px',
            height: '120px',
            aspectRatio: '1 / 1',
            borderRadius: '14px',
            background: 'var(--panel, #0f172a)',
            border: '2px solid #3B82F6',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(59, 130, 246, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            userSelect: 'none'
          }}
        >
          {/* Top-Left Counter / Check Badge */}
          <div
            style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              zIndex: 10,
              background: '#3B82F6',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: dragAvatar.count > 1 ? '2px 7px' : '2px 6px',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {dragAvatar.count > 1 ? `+${dragAvatar.count}` : '✓'}
          </div>

          {/* Top-Right Extension Badge */}
          {dragAvatar.file && (
            <div
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                zIndex: 10,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              {dragAvatar.file.extension}
            </div>
          )}

          {/* Square Thumbnail Preview */}
          <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {dragAvatar.file ? renderThumbnail(dragAvatar.file, 'medium') : null}
          </div>

          {/* Bottom Gradient Footer with Filename */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)',
              padding: '16px 8px 6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1px'
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {dragAvatar.file?.name || 'Նիշք'}
            </div>
            <div style={{ fontSize: '0.62rem', color: '#93c5fd' }}>
              {dragAvatar.count > 1 ? `${dragAvatar.count} ընտրված նիշք` : (dragAvatar.file?.sizeFormatted || '')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
