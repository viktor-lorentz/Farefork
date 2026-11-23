export const SKYLINE_WIDTH = 800;
export const SKYLINE_HEIGHT = 180;

export type LayerName = 'far' | 'mid' | 'near';

type LayerSpec = {
  seed: number;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  maxGap: number;
  windowSize: number | null;
};

const layerSpecs: Record<LayerName, LayerSpec> = {
  far: {
    seed: 11,
    minHeight: 72,
    maxHeight: 150,
    minWidth: 18,
    maxWidth: 40,
    maxGap: 4,
    windowSize: null,
  },
  mid: {
    seed: 29,
    minHeight: 46,
    maxHeight: 112,
    minWidth: 22,
    maxWidth: 46,
    maxGap: 8,
    windowSize: 2,
  },
  near: {
    seed: 53,
    minHeight: 22,
    maxHeight: 78,
    minWidth: 28,
    maxWidth: 58,
    maxGap: 10,
    windowSize: 3,
  },
};

type Window = { x: number; y: number; size: number; chance: number; flicker: boolean };

export type LayerGeometry = {
  silhouette: string;
  windows: readonly Window[];
};

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(next: () => number, min: number, max: number): number {
  return Math.round(min + next() * (max - min));
}

function rect(x: number, y: number, width: number, height: number): string {
  return `M${x} ${y}h${width}v${height}h${-width}Z`;
}

function building(next: () => number, x: number, width: number, height: number): string {
  const top = SKYLINE_HEIGHT - height;
  const base = rect(x, top, width, height);
  const kind = next();
  if (kind < 0.22) {
    const inset = Math.max(3, Math.round(width * 0.22));
    const lift = between(next, 6, Math.max(8, Math.round(height * 0.18)));
    return base + rect(x + inset, top - lift, width - inset * 2, lift);
  }
  if (kind < 0.36) {
    const mast = between(next, 8, 18);
    return base + rect(x + Math.round(width / 2) - 1, top - mast, 2, mast);
  }
  if (kind < 0.5) {
    const rise = Math.round(width * 0.35);
    return `${base}M${x} ${top}L${x + width} ${top - rise}L${x + width} ${top}Z`;
  }
  return base;
}

function windowsFor(
  next: () => number,
  x: number,
  width: number,
  height: number,
  size: number,
): Window[] {
  const pitchX = size * 2;
  const pitchY = size * 2.6;
  const columns = Math.floor((width - size * 2) / pitchX);
  const rows = Math.floor((height - size * 3) / pitchY);
  const top = SKYLINE_HEIGHT - height + size * 2;
  const left = x + (width - (columns * pitchX - size)) / 2;
  const result: Window[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      result.push({
        x: Math.round((left + column * pitchX) * 10) / 10,
        y: Math.round((top + row * pitchY) * 10) / 10,
        size,
        chance: next(),
        flicker: next() < 0.06,
      });
    }
  }
  return result;
}

export function layerGeometry(name: LayerName): LayerGeometry {
  const spec = layerSpecs[name];
  const next = random(spec.seed);
  let silhouette = '';
  const windows: Window[] = [];
  let x = -between(next, 0, 12);
  while (x < SKYLINE_WIDTH) {
    const width = between(next, spec.minWidth, spec.maxWidth);
    const height = between(next, spec.minHeight, spec.maxHeight);
    silhouette += building(next, x, width, height);
    if (spec.windowSize !== null) {
      windows.push(...windowsFor(next, x, width, height, spec.windowSize));
    }
    x += width + between(next, 0, spec.maxGap);
  }
  return { silhouette, windows };
}

export function litWindowPaths(
  windows: readonly Window[],
  litRatio: number,
): { steady: string; flicker: string } {
  let steady = '';
  let flicker = '';
  for (const window of windows) {
    if (window.chance >= litRatio) {
      continue;
    }
    const path = rect(window.x, window.y, window.size, window.size * 1.3);
    if (window.flicker) {
      flicker += path;
    } else {
      steady += path;
    }
  }
  return { steady, flicker };
}

export function starPath(count: number): string {
  const next = random(97);
  let path = '';
  for (let index = 0; index < count; index += 1) {
    const x = Math.round(next() * SKYLINE_WIDTH);
    const y = Math.round(next() * SKYLINE_HEIGHT * 0.45);
    const size = next() < 0.2 ? 1.6 : 1;
    path += rect(x, y, size, size);
  }
  return path;
}
