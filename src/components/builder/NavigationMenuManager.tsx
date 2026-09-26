"use client";

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { NavigationItem } from '@/types/builder';

interface NavigationMenuManagerProps {
  items: NavigationItem[];
  onChange: (updatedItems: NavigationItem[]) => void;
}

export default function NavigationMenuManager({
  items,
  onChange
}: NavigationMenuManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPath, setNewPath] = useState('/');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Toggle isVisible
  const toggleVisibility = (id: string) => {
    const updateRecursive = (list: NavigationItem[]): NavigationItem[] => {
      return list.map((item) => {
        if (item.id === id) {
          return { ...item, isVisible: !item.isVisible };
        }
        if (item.children && item.children.length > 0) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };

    onChange(updateRecursive(items));
  };

  // Turn item into child of preceding item (Indent / Nest)
  const indentItem = (index: number) => {
    if (index === 0) return; // Cannot indent first top-level item
    const newItems = [...items];
    const targetItem = newItems[index];
    const parentItem = { ...newItems[index - 1] };

    // Remove from top level
    newItems.splice(index, 1);

    // Add to parent's children
    const existingChildren = parentItem.children ? [...parentItem.children] : [];
    parentItem.children = [...existingChildren, targetItem];
    newItems[index - 1] = parentItem;

    onChange(newItems);
  };

  // Promote child item back to top level (Outdent / Un-nest)
  const outdentChild = (parentId: string, childId: string) => {
    const newItems = [...items];
    const parentIndex = newItems.findIndex((i) => i.id === parentId);
    if (parentIndex === -1) return;

    const parent = { ...newItems[parentIndex] };
    if (!parent.children) return;

    const childIndex = parent.children.findIndex((c) => c.id === childId);
    if (childIndex === -1) return;

    const [child] = parent.children.splice(childIndex, 1);
    if (parent.children.length === 0) {
      delete parent.children;
    }

    newItems[parentIndex] = parent;
    // Insert immediately below parent
    newItems.splice(parentIndex + 1, 0, child);

    onChange(newItems);
  };

  // Reorder top-level items on Drag & Drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Update order numbers
    const updated = reordered.map((item, idx) => ({ ...item, order: idx + 1 }));
    onChange(updated);
  };

  // Delete item
  const deleteItem = (id: string) => {
    const filterRecursive = (list: NavigationItem[]): NavigationItem[] => {
      return list
        .filter((i) => i.id !== id)
        .map((i) => ({
          ...i,
          children: i.children ? filterRecursive(i.children) : undefined
        }));
    };
    onChange(filterRecursive(items));
  };

  // Add new item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: NavigationItem = {
      id: `nav-${Date.now()}`,
      title: newTitle.trim(),
      path: newPath.trim() || '/',
      isVisible: true,
      order: items.length + 1
    };

    onChange([...items, newItem]);
    setNewTitle('');
    setNewPath('/');
    setIsAddingNew(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        color: '#e2e8f0',
        fontSize: '13px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: '#14b8a6', fontSize: '14px' }}>
            Մենյուի Կառավարում (Navigation Tree)
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Դասավորեք և ստեղծեք ենթացանկեր (Submenu)
          </div>
        </div>

        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          style={{
            backgroundColor: '#083f39',
            border: '1px solid #14b8a6',
            color: '#14b8a6',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {isAddingNew ? 'Փակել' : '+ Նոր Հղում'}
        </button>
      </div>

      {/* Add New Item Form */}
      {isAddingNew && (
        <form
          onSubmit={handleAddItem}
          style={{
            backgroundColor: 'rgba(8, 63, 57, 0.25)',
            border: '1px dashed #14b8a6',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#99f6e4' }}>
            Ավելացնել նոր կետ մենյուի մեջ
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input
              type="text"
              placeholder="Անվանում (օր.՝ Ծառայություններ)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Հղում (օր.՝ /services)"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: '#14b8a6',
              color: '#051311',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Ավելացնել
          </button>
        </form>
      )}

      {/* Drag & Drop Reorderable List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="navigation-items-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      style={{
                        ...dragProvided.draggableProps.style,
                        backgroundColor: snapshot.isDragging ? '#0f3833' : 'rgba(255, 255, 255, 0.04)',
                        border: snapshot.isDragging
                          ? '1px solid #14b8a6'
                          : item.isVisible
                          ? '1px solid rgba(255, 255, 255, 0.08)'
                          : '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        opacity: item.isVisible ? 1 : 0.65,
                        transition: 'border 0.2s, opacity 0.2s'
                      }}
                    >
                      {/* Top Item Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Drag Handle */}
                          <div
                            {...dragProvided.dragHandleProps}
                            style={{ cursor: 'grab', color: '#64748b', fontSize: '14px', userSelect: 'none' }}
                            title="Քաշեք տեղափոխելու համար"
                          >
                            ⠿
                          </div>

                          <span style={{ fontWeight: 600, color: item.isVisible ? '#ffffff' : '#94a3b8' }}>
                            {item.title}
                          </span>

                          <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                            {item.path}
                          </span>

                          {item.children && item.children.length > 0 && (
                            <span
                              style={{
                                backgroundColor: 'rgba(20, 184, 166, 0.2)',
                                color: '#14b8a6',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '10px'
                              }}
                            >
                              {item.children.length} ենթակետ
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Nesting Indent Button (Make Submenu of preceding) */}
                          {index > 0 && (
                            <button
                              onClick={() => indentItem(index)}
                              title="Դարձնել նախորդի ենթացանկ (Indent ➔)"
                              style={actionBtnStyle}
                            >
                              ➔ Ենթացանկ
                            </button>
                          )}

                          {/* Eye Visibility Toggle */}
                          <button
                            onClick={() => toggleVisibility(item.id)}
                            title={item.isVisible ? 'Թաքցնել մենյուից' : 'Ցուցադրել մենյուում'}
                            style={{
                              ...actionBtnStyle,
                              color: item.isVisible ? '#14b8a6' : '#f87171'
                            }}
                          >
                            {item.isVisible ? '👁 Տեսանելի' : '👁‍🗨 Թաքցված'}
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => deleteItem(item.id)}
                            title="Հեռացնել"
                            style={{ ...actionBtnStyle, color: '#ef4444' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Nested Children (Submenu Items) */}
                      {item.children && item.children.length > 0 && (
                        <div
                          style={{
                            marginLeft: '24px',
                            paddingLeft: '12px',
                            borderLeft: '2px dashed rgba(20, 184, 166, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            marginTop: '4px'
                          }}
                        >
                          {item.children.map((child) => (
                            <div
                              key={child.id}
                              style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#14b8a6' }}>↳</span>
                                <span style={{ fontWeight: 500, color: child.isVisible ? '#e2e8f0' : '#64748b' }}>
                                  {child.title}
                                </span>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>{child.path}</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {/* Outdent to top level */}
                                <button
                                  onClick={() => outdentChild(item.id, child.id)}
                                  title="Հանել ենթացանկից (Outdent ⬅)"
                                  style={actionBtnStyle}
                                >
                                  ⬅ Դուրս
                                </button>
                                {/* Eye Toggle */}
                                <button
                                  onClick={() => toggleVisibility(child.id)}
                                  style={{
                                    ...actionBtnStyle,
                                    color: child.isVisible ? '#14b8a6' : '#f87171'
                                  }}
                                >
                                  {child.isVisible ? '👁' : '👁‍🗨'}
                                </button>
                                {/* Delete Child */}
                                <button
                                  onClick={() => deleteItem(child.id)}
                                  style={{ ...actionBtnStyle, color: '#ef4444' }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  color: '#cbd5e1',
  padding: '3px 7px',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px'
};

const inputStyle: React.CSSProperties = {
  height: '32px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '12px',
  padding: '0 8px',
  outline: 'none'
};
