import { access, mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = join(repoRoot, 'apps', 'mobile', 'assets', 'fonts');
const sourceUrl = 'https://api.fontshare.com/v2/fonts/download/satoshi';
const fontFiles = [
  'Satoshi-Regular.otf',
  'Satoshi-Medium.otf',
  'Satoshi-Bold.otf',
  'Satoshi-Black.otf',
];
const licenseFile = 'FFL.txt';
const force = process.argv.includes('--force');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fontsPresent() {
  const checks = await Promise.all(fontFiles.map((file) => exists(join(targetDir, file))));
  return checks.every(Boolean);
}

function isWanted(entryName) {
  const name = basename(entryName);
  return (
    (entryName.includes('/OTF/') && fontFiles.includes(name)) ||
    (entryName.includes('/License/') && name === licenseFile)
  );
}

async function download() {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Fontshare responded with HTTP ${response.status}`);
  }
  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()), {
    filter: (entry) => isWanted(entry.name),
  });
  await mkdir(targetDir, { recursive: true });
  const written = [];
  for (const [entryName, data] of Object.entries(archive)) {
    const name = basename(entryName);
    await writeFile(join(targetDir, name), data);
    written.push(name);
  }
  const missing = fontFiles.filter((file) => !written.includes(file));
  if (missing.length > 0) {
    throw new Error(`Archive did not contain ${missing.join(', ')}`);
  }
}

async function main() {
  if (process.env.CI || process.env.SKIP_FONT_DOWNLOAD === '1') {
    return;
  }
  if (!force && (await fontsPresent())) {
    return;
  }
  await download();
  console.log(`Satoshi downloaded from Fontshare into ${targetDir}`);
}

main().catch((error) => {
  console.warn(`Could not download the Satoshi font: ${error.message}`);
  console.warn(
    'Download it from https://www.fontshare.com/fonts/satoshi and copy Satoshi-Regular/Medium/Bold/Black.otf into apps/mobile/assets/fonts, or run `npm run fonts` when you are online.',
  );
});
