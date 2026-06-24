import React, { forwardRef } from 'react';
import { Layer } from '@/lib/patternTypes';

interface PatternRendererProps {
  layers: Layer[];
  width: number;
  height: number;
  selectedLayerId?: string;
  selectedLineIndex?: number | null;
  onLineClick?: (layerId: string, lineIndex: number) => void;
  style?: React.CSSProperties;
}

const PatternRenderer = forwardRef<SVGSVGElement, PatternRendererProps>(
  (
    {
      layers,
      width,
      height,
      selectedLayerId,
      selectedLineIndex,
      onLineClick,
      style
    },
    ref
  ) => {
    return (
      <svg 
        ref={ref}
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        style={{ background: 'transparent', ...style }}
      >
      {layers.map(layer => {
        const elements = [];
        const cx = width / 2 + (layer.xOffset ?? 0);
        const cy = height / 2 + (layer.yOffset ?? 0);
        const maxRadius = Math.sqrt((width / 2) * (width / 2) + (height / 2) * (height / 2)) * 1.5; // extend maxRadius slightly to cover offsets without cutting off
        const theta = (layer.angle * Math.PI) / 180;
        
        const startIdx = -Math.floor((layer.lineCount - 1) / 2);
        const endIdx = startIdx + layer.lineCount;

        for (let i = startIdx; i < endIdx; i++) {
          const override = layer.overrides[i];
          const isLinked = override ? override.isLinked : true;
          
          const thickness = isLinked ? layer.thickness : override!.thickness;
          const isDashed = isLinked ? layer.isDashed : override!.isDashed;
          const dashLength = isLinked ? layer.dashLength : override!.dashLength;
          const dashGap = isLinked ? layer.dashGap : override!.dashGap;
          const dashLength2 = isLinked ? (layer.dashLength2 ?? 0) : (override!.dashLength2 ?? 0);
          const dashGap2 = isLinked ? (layer.dashGap2 ?? 0) : (override!.dashGap2 ?? 0);
          const dashOffset = isLinked ? (layer.dashOffset ?? 0) : (override!.dashOffset ?? 0);
          const color = isLinked ? layer.color : override!.color;
          const isRounded = isLinked ? layer.isRounded : override!.isRounded;

          // Normal vector
          const nx = Math.cos(theta + Math.PI / 2);
          const ny = Math.sin(theta + Math.PI / 2);

          // Center point of this line
          const px = cx + i * layer.gap * nx;
          const py = cy + i * layer.gap * ny;

          // Extend line outward from px, py
          const dx = Math.cos(theta) * maxRadius;
          const dy = Math.sin(theta) * maxRadius;

          const isSelected = selectedLayerId === layer.id && selectedLineIndex === i;
          
          let strokeDasharray = undefined;
          if (isDashed) {
            if (dashLength2 > 0 || dashGap2 > 0) {
              strokeDasharray = `${dashLength} ${dashGap} ${dashLength2} ${dashGap2}`;
            } else {
              strokeDasharray = `${dashLength} ${dashGap}`;
            }
          }
          const strokeLinecap = isRounded ? "round" : "butt";

          elements.push(
            <g key={`${layer.id}-${i}`}>
              {/* Invisible wider line for easier clicking */}
              <line 
                x1={px - dx} y1={py - dy} 
                x2={px + dx} y2={py + dy} 
                stroke="transparent" 
                strokeWidth={Math.max(thickness + 10, 20)}
                style={{ cursor: onLineClick ? 'pointer' : 'default' }}
                onClick={() => onLineClick?.(layer.id, i)}
              />
              <line 
                x1={px - dx} y1={py - dy} 
                x2={px + dx} y2={py + dy} 
                stroke={color} 
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={dashOffset || undefined}
                strokeLinecap={strokeLinecap}
                style={{ cursor: onLineClick ? 'pointer' : 'default', transition: 'stroke 0.2s, stroke-width 0.2s' }}
                onClick={() => onLineClick?.(layer.id, i)}
              />
              {isSelected && (
                <line 
                  x1={px - dx} y1={py - dy} 
                  x2={px + dx} y2={py + dy} 
                  stroke="#ffffff" 
                  strokeWidth={thickness + 2}
                  strokeOpacity={0.5}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={dashOffset || undefined}
                  strokeLinecap={strokeLinecap}
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </g>
          );
        }
        return elements;
      })}
      </svg>
    );
  }
);

PatternRenderer.displayName = 'PatternRenderer';

export default PatternRenderer;
