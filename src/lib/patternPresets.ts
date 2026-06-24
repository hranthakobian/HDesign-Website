import { Layer, RandomizerConstraints } from './patternTypes';

export type Preset = {
  id: string;
  name: string;
  layers: Layer[];
};

export const defaultPresets: Preset[] = [
  {
    id: 'vertical-lines',
    name: 'Vertical Stripes',
    layers: [
      {
        id: 'layer-1',
        name: 'Stripes',
        lineCount: 15,
        gap: 30,
        thickness: 10,
        angle: 0,
        isDashed: false,
        dashLength: 10,
        dashGap: 5,
        color: '#00C49F',
        isRounded: false,
        overrides: {}
      }
    ]
  },
  {
    id: 'diamond-grid',
    name: 'Diamond Grid',
    layers: [
      {
        id: 'layer-1',
        name: 'Diagonal 1',
        lineCount: 21,
        gap: 40,
        thickness: 2,
        angle: 45,
        isDashed: false,
        dashLength: 10,
        dashGap: 5,
        color: '#8884d8',
        isRounded: false,
        overrides: {}
      },
      {
        id: 'layer-2',
        name: 'Diagonal 2',
        lineCount: 21,
        gap: 40,
        thickness: 2,
        angle: -45,
        isDashed: false,
        dashLength: 10,
        dashGap: 5,
        color: '#8884d8',
        isRounded: false,
        overrides: {}
      }
    ]
  },
  {
    id: 'tech-circuit',
    name: 'Tech Circuit',
    layers: [
      {
        id: 'layer-1',
        name: 'Main Traces',
        lineCount: 11,
        gap: 30,
        thickness: 4,
        angle: 0,
        isDashed: false,
        dashLength: 20,
        dashGap: 10,
        color: '#FFBB28',
        isRounded: true,
        overrides: {
          '-2': { isLinked: false, thickness: 8, isDashed: true, dashLength: 15, dashGap: 15, color: '#FFBB28', isRounded: true },
          '2': { isLinked: false, thickness: 8, isDashed: true, dashLength: 15, dashGap: 15, color: '#FFBB28', isRounded: true }
        }
      },
      {
        id: 'layer-2',
        name: 'Cross Links',
        lineCount: 5,
        gap: 60,
        thickness: 2,
        angle: 90,
        isDashed: true,
        dashLength: 5,
        dashGap: 25,
        color: '#FFBB28',
        isRounded: true,
        overrides: {}
      }
    ]
  },
  {
    id: 'logo-pills',
    name: 'Logo Style Pills',
    layers: [
      {
        id: 'layer-1',
        name: 'Vertical Pills',
        lineCount: 4,
        gap: 24,
        thickness: 12,
        angle: 0,
        isDashed: true,
        dashLength: 40,
        dashGap: 100,
        color: '#ffffff',
        isRounded: true,
        overrides: {
          '-1': { isLinked: false, thickness: 12, isDashed: true, dashLength: 35, dashGap: 100, color: '#ffffff', isRounded: true },
          '0': { isLinked: false, thickness: 12, isDashed: true, dashLength: 38, dashGap: 100, color: '#ffffff', isRounded: true },
          '1': { isLinked: false, thickness: 12, isDashed: true, dashLength: 35, dashGap: 100, color: '#ffffff', isRounded: true },
          '2': { isLinked: false, thickness: 12, isDashed: true, dashLength: 35, dashGap: 100, color: '#ffffff', isRounded: true }
        }
      }
    ]
  }
];

export const generateHarmonicRandom = (constraints?: RandomizerConstraints | null): Preset => {
  const config = constraints || {
    allowDashed: true,
    allowRounded: true,
    allowSolid: true,
    minLayers: 1,
    maxLayers: 3,
    minThickness: 1,
    maxThickness: 8,
    minGap: 10,
    maxGap: 50,
    angleMode: 'discrete' as const,
    selectedAngles: [0, 45, -45, 90, 30, 60, -30, -60],
    minAngle: -180,
    maxAngle: 180,
    palette: 'all' as const
  };

  const allAngles = config.selectedAngles.length > 0 ? config.selectedAngles : [0, 90];
  
  const colorsMap = {
    brand: ['#00C49F', '#FFBB28', '#ffffff', '#1a1a1a'],
    colorful: ['#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b', '#3b82f6', '#ec4899'],
    monochrome: ['#ffffff', '#aaaaaa', '#666666', '#333333', '#222222'],
    warm: ['#FF8042', '#FFBB28', '#ff6b6b', '#ec4899', '#f59e0b'],
    cool: ['#00C49F', '#8884d8', '#3b82f6', '#06b6d4', '#10b981'],
    all: ['#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b', '#ffffff', '#333333', '#3b82f6', '#ec4899', '#06b6d4', '#10b981']
  };
  
  const colors = colorsMap[config.palette] || colorsMap.all;
  
  const minLayers = Math.max(1, config.minLayers);
  const maxLayers = Math.max(minLayers, config.maxLayers);
  const layerCount = minLayers === maxLayers ? minLayers : Math.floor(Math.random() * (maxLayers - minLayers + 1)) + minLayers;
  
  const layers: Layer[] = [];
  const isHarmonicAngles = Math.random() > 0.5;

  let baseAngle = 0;
  if (config.angleMode === 'range') {
    const minA = config.minAngle;
    const maxA = config.maxAngle;
    baseAngle = minA === maxA ? minA : Math.floor(Math.random() * (maxA - minA + 1)) + minA;
  } else {
    baseAngle = allAngles[Math.floor(Math.random() * allAngles.length)];
  }

  for (let i = 0; i < layerCount; i++) {
    let angle = 0;
    if (config.angleMode === 'range') {
      const minA = config.minAngle;
      const maxA = config.maxAngle;
      if (minA === maxA) {
        angle = minA;
      } else {
        const candidate = baseAngle + (i * 90);
        const normalized = ((candidate + 180) % 360 + 360) % 360 - 180;
        if (normalized >= minA && normalized <= maxA) {
          angle = normalized;
        } else {
          angle = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
        }
      }
    } else {
      const candidate = baseAngle + (i * 90);
      const normalized = ((candidate + 180) % 360 + 360) % 360 - 180;
      if (isHarmonicAngles && allAngles.includes(normalized)) {
        angle = normalized;
      } else {
        angle = allAngles[Math.floor(Math.random() * allAngles.length)];
      }
    }
      
    const minThick = Math.max(1, config.minThickness);
    const maxThick = Math.max(minThick, config.maxThickness);
    const thickness = minThick === maxThick ? minThick : Math.floor(Math.random() * (maxThick - minThick + 1)) + minThick;
    
    const minGapVal = Math.max(5, config.minGap);
    const maxGapVal = Math.max(minGapVal, config.maxGap);
    const gap = minGapVal === maxGapVal ? minGapVal : Math.floor(Math.random() * (maxGapVal - minGapVal + 1)) + minGapVal;
    
    let isDashed = false;
    if (config.allowDashed && config.allowSolid) {
      isDashed = Math.random() > 0.5;
    } else if (config.allowDashed) {
      isDashed = true;
    } else {
      isDashed = false;
    }
    
    const isRounded = config.allowRounded ? Math.random() > 0.5 : false;

    layers.push({
      id: `layer-${Date.now()}-${i}`,
      name: `Harmonic ${i + 1}`,
      lineCount: Math.floor(Math.random() * 20) + 5,
      gap,
      thickness,
      angle,
      isDashed,
      dashLength: Math.floor(Math.random() * 30) + 5,
      dashGap: Math.floor(Math.random() * 20) + 5,
      dashLength2: isDashed && Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 5 : 0,
      dashGap2: isDashed && Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 5 : 0,
      dashOffset: isDashed && Math.random() > 0.5 ? Math.floor(Math.random() * 50) : 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      isRounded,
      overrides: {}
    });
  }

  return {
    id: `random-${Date.now()}`,
    name: 'Random Harmonic',
    layers
  };
};
