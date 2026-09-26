"use client";

import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { BlockSchema } from '@/types/builder';

interface CanvasDragDropEngineProps {
  blocks: BlockSchema[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onReorderBlocks: (reorderedBlocks: BlockSchema[]) => void;
  onDeleteBlock?: (id: string) => void;
  onDuplicateBlock?: (id: string) => void;
}

export default function CanvasDragDropEngine({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onReorderBlocks,
  onDeleteBlock,
  onDuplicateBlock
}: CanvasDragDropEngineProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderBlocks(items);
  };

  return (
    <div style={{ width: '100%', minHeight: '100%', position: 'relative' }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="builder-canvas-blocks">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                backgroundColor: snapshot.isDraggingOver ? 'rgba(20, 184, 166, 0.05)' : 'transparent',
                transition: 'background-color 0.2s ease',
                borderRadius: '8px'
              }}
            >
              {blocks.map((block, index) => {
                const isSelected = selectedBlockId === block.id;

                return (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBlock(block.id);
                        }}
                        style={{
                          ...dragProvided.draggableProps.style,
                          position: 'relative',
                          border: isSelected
                            ? '2px solid #14b8a6'
                            : dragSnapshot.isDragging
                            ? '2px dashed #0d9488'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: isSelected
                            ? '0 0 0 3px rgba(20, 184, 166, 0.25)'
                            : dragSnapshot.isDragging
                            ? '0 12px 28px rgba(0,0,0,0.5)'
                            : 'none',
                          borderRadius: '8px',
                          backgroundColor: dragSnapshot.isDragging ? '#062622' : 'rgba(255, 255, 255, 0.02)',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer'
                        }}
                      >
                        {/* Drag Handle & Control Bar */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 12px',
                            backgroundColor: isSelected ? '#083f39' : 'rgba(0, 0, 0, 0.3)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            borderTopLeftRadius: '7px',
                            borderTopRightRadius: '7px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              {...dragProvided.dragHandleProps}
                              style={{
                                cursor: 'grab',
                                color: '#14b8a6',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '2px 4px'
                              }}
                              title="Քաշեք բլոկը տեղաշարժելու համար"
                            >
                              ⣿
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                              {block.name || block.type.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#94a3b8',
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '4px'
                              }}
                            >
                              {block.type}
                            </span>
                          </div>

                          {/* Quick Toolbar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {onDuplicateBlock && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateBlock(block.id);
                                }}
                                title="Կրկնօրինակել բլոկը"
                                style={toolbarBtnStyle}
                              >
                                ⧉
                              </button>
                            )}
                            {onDeleteBlock && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteBlock(block.id);
                                }}
                                title="Հեռացնել բլոկը"
                                style={{ ...toolbarBtnStyle, color: '#ef4444' }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Block Content Representation & Styles Preview */}
                        <div
                          style={{
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: block.styles?.alignItems || 'center',
                            justifyContent: block.styles?.justifyContent || 'center',
                            gap: `${block.styles?.gap?.value || 16}px`
                          }}
                        >
                          <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>
                            {block.settings?.title || block.settings?.line1 || `Բլոկի Պարունակություն (${block.type})`}
                          </div>
                          {block.settings?.quote && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', maxWidth: '80%' }}>
                              {block.settings.quote}
                            </div>
                          )}
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            Padding: {String(block.styles?.padding?.top || 0)}px {String(block.styles?.padding?.right || 0)}px | Margin: {String(block.styles?.margin?.bottom || 0)}px
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#cbd5e1',
  cursor: 'pointer',
  padding: '3px 6px',
  borderRadius: '4px',
  fontSize: '12px'
};
