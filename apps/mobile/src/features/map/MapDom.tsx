'use dom';

import type { DOMProps } from 'expo/dom';
import { getVersion, setWorkerUrl } from 'maplibre-gl';
import { SchemeThemeProvider } from '@/design/theme';
import type { ColorScheme } from '@/design/tokens/colors';
import { MapLibreCanvas, type MapLibreCanvasProps } from './MapLibreCanvas';

const workerSource = `import 'https://cdn.jsdelivr.net/npm/maplibre-gl@${getVersion()}/dist/maplibre-gl-worker.mjs';`;
setWorkerUrl(URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' })));

export type MapDomProps = Omit<MapLibreCanvasProps, 'style'> & {
  scheme: ColorScheme;
  dom?: DOMProps;
};

export default function MapDom({ scheme, dom: _dom, ...props }: MapDomProps) {
  return (
    <SchemeThemeProvider scheme={scheme}>
      <MapLibreCanvas {...props} />
    </SchemeThemeProvider>
  );
}
