import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'apps/mobile/package.json'));

let source;
try {
  source = join(
    dirname(require.resolve('maplibre-gl/package.json')),
    'dist/maplibre-gl-worker.mjs',
  );
} catch {
  console.warn('maplibre-gl is not installed yet; skipping map worker copy');
  process.exit(0);
}

if (!existsSync(source)) {
  console.warn(`Map worker not found at ${source}`);
  process.exit(0);
}

const targetDir = join(root, 'apps/mobile/public');
mkdirSync(targetDir, { recursive: true });
copyFileSync(source, join(targetDir, 'maplibre-gl-worker.mjs'));
