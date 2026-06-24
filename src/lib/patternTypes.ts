export type LineOverride = {
  isLinked: boolean;
  thickness: number;
  isDashed: boolean;
  dashLength: number;
  dashGap: number;
  dashLength2?: number;
  dashGap2?: number;
  dashOffset?: number;
  color: string;
  isRounded: boolean;
};

export type Layer = {
  id: string;
  name: string;
  lineCount: number;
  gap: number;
  thickness: number;
  angle: number; // degrees
  isDashed: boolean;
  dashLength: number;
  dashGap: number;
  dashLength2?: number;
  dashGap2?: number;
  dashOffset?: number;
  color: string;
  isRounded: boolean;
  xOffset?: number;
  yOffset?: number;
  overrides: Record<number, LineOverride>;
};

export type RandomizerConstraints = {
  allowDashed: boolean;
  allowRounded: boolean;
  allowSolid: boolean;
  minLayers: number;
  maxLayers: number;
  minThickness: number;
  maxThickness: number;
  minGap: number;
  maxGap: number;
  angleMode: 'discrete' | 'range';
  selectedAngles: number[];
  minAngle: number;
  maxAngle: number;
  palette: 'all' | 'brand' | 'colorful' | 'monochrome' | 'warm' | 'cool';
};
