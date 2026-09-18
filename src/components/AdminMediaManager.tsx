"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MediaFolder, MediaFile, ViewMode, SortField, SortOrder, MediaFileType } from '@/lib/mediaTypes';

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
  const [stats, setStats] = useState<{
    totalFiles: number;
    totalSizeFormatted: string;
    imagesCount: number;
    videosCount: number;
    fontsCount: number;
    vectorsCount: number;
  } | null>(null);

  // Navigation & View state
  // currentFolderId: null means Root / All, or string folder ID
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('large-icons');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaFileType>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [onlyUsedInSite, setOnlyUsedInSite] = useState(false);

  // History for Back / Forward navigation
  const [history, setHistory] = useState<Array<string | null>>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Selection state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

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

  // Navigate folder helper
  const navigateToFolder = (folderId: string | null, addToHistory = true) => {
    setCurrentFolderId(folderId);
    setSelectedFileIds(new Set());
    if (addToHistory) {
      const newHist = history.slice(0, historyIndex + 1);
      newHist.push(folderId);
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCurrentFolderId(history[newIdx]);
      setSelectedFileIds(new Set());
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setCurrentFolderId(history[newIdx]);
      setSelectedFileIds(new Set());
    }
  };

  const handleUpLevel = () => {
    if (!currentFolderId) return;
    const currentF = folders.find(f => f.id === currentFolderId);
    navigateToFolder(currentF?.parentId || null);
  };

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
      if (f.folderId && counts.has(f.folderId)) {
        counts.set(f.folderId, (counts.get(f.folderId) || 0) + 1);
      }
    });
    return counts;
  }, [folders, files]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // Folder filter:
      // If currentFolderId is null, we show root files OR if searching, search everywhere
      const matchFolder = searchQuery ? true : file.folderId === currentFolderId;
      if (!matchFolder) return false;

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

  // File Upload
  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgressText(`Վերբեռնվում է (${i + 1}/${filesToUpload.length}): ${file.name}`);
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) {
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

  // Delete file
  const handleDeleteFile = async (file: MediaFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Վստա՞հ եք, որ ցանկանում եք հեռացնել «${file.name}» նիշքը:`)) return;

    try {
      const res = await fetch(`/api/admin/media?fileId=${encodeURIComponent(file.id)}&deletePhysical=true`, {
        method: 'DELETE',
        headers: { Authorization: token || '' }
      });
      const data = await res.json();
      if (data.success) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        setSelectedFileIds(prev => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        });
        if (previewFile?.id === file.id) setPreviewFile(null);
        showToast('Նիշքը հեռացված է');
      } else {
        alert(data.error || 'Չհաջողվեց հեռացնել նիշքը');
      }
    } catch (err: any) {
      alert(err.message || 'Սխալ նիշքը հեռացնելիս');
    }
  };

  // Batch delete
  const handleBatchDelete = async () => {
    if (selectedFileIds.size === 0) return;
    if (!confirm(`Վստա՞հ եք, որ ցանկանում եք հեռացնել ընտրված ${selectedFileIds.size} նիշքերը:`)) return;

    const idsToDelete = Array.from(selectedFileIds);
    for (const id of idsToDelete) {
      try {
        await fetch(`/api/admin/media?fileId=${encodeURIComponent(id)}&deletePhysical=true`, {
          method: 'DELETE',
          headers: { Authorization: token || '' }
        });
      } catch (err) {
        console.error('Batch delete error:', err);
      }
    }

    setFiles(prev => prev.filter(f => !selectedFileIds.has(f.id)));
    setSelectedFileIds(new Set());
    showToast('Ընտրված նիշքերը հեռացվեցին');
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

  // Selection toggle
  const toggleSelectFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map(f => f.id)));
    }
  };

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

  // Drag and Drop files onto folder cards/tree items
  const handleDragStart = (fileId: string, e: React.DragEvent) => {
    const toMove = selectedFileIds.has(fileId) ? Array.from(selectedFileIds) : [fileId];
    setDraggedFileIds(toMove);
    e.dataTransfer.setData('text/plain', JSON.stringify(toMove));
    e.dataTransfer.effectAllowed = 'move';
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
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
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
          TOP HEADER: Explorer Address Bar & Navigation Buttons
          ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--panel)',
          border: '1px solid var(--panel-border)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
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
              onChange={e => setSearchQuery(e.target.value)}
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
                onClick={() => setSearchQuery('')}
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
                onClick={() => setViewMode('large-icons')}
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
                onClick={() => setViewMode('medium-icons')}
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
                onClick={() => setViewMode('list')}
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
                onClick={() => setViewMode('details')}
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
                onClick={() => setViewMode('tiles')}
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
              onClick={() => setTypeFilter(tab.id as any)}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              onClick={handleBatchDelete}
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
              🗑️ Ջնջել
            </button>

            <button
              type="button"
              onClick={() => setSelectedFileIds(new Set())}
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

      {/* ══════════════════════════════════════════════════════════════════════════
          MAIN EXPLORER BODY: Left Tree Sidebar + Right File Grid
          ══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '16px',
          alignItems: 'start'
        }}
      >
        {/* LEFT NAVIGATION PANE (Windows Explorer Sidebar) */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--panel-border)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto'
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
              {files.length}
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
        </div>

        {/* RIGHT MAIN AREA (Subfolders and Files) */}
        <div
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
              {/* SUBFOLDERS SECTION OF CURRENT FOLDER (if any) */}
              {currentSubfolders.length > 0 && !searchQuery && (
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
                          onClick={() => setPreviewFile(file)}
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
                          onClick={() => setPreviewFile(file)}
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
                          onClick={() => setPreviewFile(file)}
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
                              onClick={() => setPreviewFile(file)}
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
                                  <button
                                    type="button"
                                    onClick={e => handleDeleteFile(file, e)}
                                    title="Ջնջել"
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
                          onClick={() => setPreviewFile(file)}
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
          onClick={() => setPreviewFile(null)}
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
                  onClick={() => setPreviewFile(null)}
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
                  onClick={() => handleDeleteFile(previewFile)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Ջնջել նիշքը
                </button>
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
    </div>
  );
}
