/**
 * build-single.mjs
 * Folds the production build into one self-contained HTML file. Handy for
 * dropping the game into a CMS, an iframe, or an offline kiosk.
 * Run `npm run build` first, then `npm run build:single`.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'dist-single');

const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const assets = await readdir(path.join(dist, 'assets'));

const jsFile = assets.find((name) => name.endsWith('.js'));
const cssFile = assets.find((name) => name.endsWith('.css'));
if (!jsFile) throw new Error('No JS bundle in dist/assets — run `npm run build` first.');

const js = await readFile(path.join(dist, 'assets', jsFile), 'utf8');
let output = html.replace(
  new RegExp(`<script[^>]*src="[^"]*${jsFile}"[^>]*></script>`),
  () => `<script type="module">\n${js}\n</script>`
);

if (cssFile) {
  const css = await readFile(path.join(dist, 'assets', cssFile), 'utf8');
  output = output.replace(
    new RegExp(`<link[^>]*href="[^"]*${cssFile}"[^>]*>`),
    () => `<style>${css}</style>`
  );
}

await mkdir(outDir, { recursive: true });
const target = path.join(outDir, 'stickman-runner.html');
await writeFile(target, output, 'utf8');
console.log(`Single file written: ${path.relative(root, target)} (${(output.length / 1024).toFixed(1)} kB)`);
