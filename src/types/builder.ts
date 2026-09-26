/**
 * HDesign Visual Page Builder - Core Type Definitions & JSON Schema
 */

export type SpacingUnit = 'px' | 'rem' | '%' | 'auto';
export type DimensionUnit = 'px' | 'rem' | '%' | 'vw' | 'vh' | 'auto';

export interface BoxSpacing {
  top: number | string;
  right: number | string;
  bottom: number | string;
  left: number | string;
  unit: SpacingUnit;
  isLinked?: boolean;
}

export interface DimensionValue {
  type: 'auto' | 'full' | 'custom';
  value: number | string;
  unit: DimensionUnit;
}

export interface BlockStyles {
  // Spacing & Box Model
  padding: BoxSpacing;
  margin: BoxSpacing;
  gap: {
    value: number | string;
    unit: SpacingUnit;
  };

  // Dimensions
  width: DimensionValue;
  minWidth?: string;
  maxWidth?: string;
  height: DimensionValue;
  minHeight?: string;
  maxHeight?: string;

  // Alignment & Layout
  display: 'flex' | 'grid' | 'block';
  flexDirection: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse';
  gridTemplateColumns?: string;

  // Visuals & Custom
  backgroundColor?: string;
  borderRadius?: number | string;
  borderWidth?: number;
  borderColor?: string;
  boxShadow?: string;
  opacity?: number;
  zIndex?: number;
  customCss?: string;
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  isVisible: boolean;
  order: number;
  target?: '_self' | '_blank';
  badge?: string;
  children?: NavigationItem[];
}

export interface BlockSchema {
  id: string;
  type: string;
  name: string;
  hidden?: boolean;
  styles: BlockStyles;
  settings: Record<string, any>;
  children?: BlockSchema[];
}

export interface PageDataSchema {
  id?: string;
  slug: string;
  title: string;
  isPublished: boolean;
  navigation: NavigationItem[];
  blocks: BlockSchema[];
  themeSettings?: Record<string, any>;
  meta?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface BoundingRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export type EditorBridgeMessage =
  | { type: 'EDITOR_BRIDGE_READY'; pathname?: string }
  | { type: 'SELECT_BLOCK'; blockId: string | null; blockType?: string }
  | { type: 'HOVER_BLOCK'; blockId: string | null }
  | { type: 'BLOCK_CLICKED'; blockId: string; bounds?: BoundingRect }
  | { type: 'UPDATE_BLOCK_STYLES'; blockId: string; styles: Partial<BlockStyles>; rawCss?: string }
  | { type: 'BLOCK_BOUNDS_CHANGED'; blockId: string; bounds: BoundingRect }
  | { type: 'NAVIGATE_PAGE'; url: string }
  | { type: 'REINIT_ANIMATIONS' };
