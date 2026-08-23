/**
 * ===========================================================================
 * verify_icons.mjs — are the vendored icons the real ones?
 * ===========================================================================
 *   node scripts/verify_icons.mjs
 *
 * Every icon in _components/icons.tsx is a path copied out of
 * @phosphor-icons/core. Copied paths can arrive TRUNCATED — only the first
 * subpath, missing the inner boundaries that cut a shape's counters — and a
 * truncated path is still valid SVG. It starts with M, ends with Z, and
 * renders happily as a solid blob. Star, gear and user-circle all shipped that
 * way once, and no amount of reading the file would have shown it.
 *
 * So this does not read the file for plausibility. It fetches each icon from
 * unpkg and compares the path data byte for byte. Anything that differs is
 * either truncated, hand-edited, or from a different weight.
 *
 * The mapping comes from the doc comment above each component — the
 * "(Phosphor `Trophy`, regular)" line — so a new icon is checked automatically
 * as long as it is documented like its neighbours.
 *
 * Needs network. Exits non-zero on any mismatch.
 * ===========================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '2.1.1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src', 'app', '(arena)', '_components', 'icons.tsx');

const source = fs.readFileSync(SRC, 'utf8');

/** `UsersThree` -> `users-three`, the asset name in the package */
const assetName = (phosphor) =>
  phosphor.replace(/(?<!^)(?=[A-Z])/g, '-').toLowerCase();

const documented = [
  ...source.matchAll(/\(Phosphor `(\w+)`, regular\)\s*\*\/\s*export function (\w+)\(/g),
].map(([, phosphor, component]) => ({ phosphor, component }));

const names = [...source.matchAll(/export function (\w+)\(/g)].map((m) => m[1]);
const paths = [...source.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
if (names.length !== paths.length) {
  console.error(`icons.tsx has ${names.length} components but ${paths.length} paths`);
  process.exit(1);
}
const vendored = new Map(names.map((n, i) => [n, paths[i]]));

const undocumented = names.filter(
  (n) => !documented.some((d) => d.component === n)
);
if (undocumented.length) {
  console.error(`  not documented, so not checkable: ${undocumented.join(', ')}`);
}

let ok = 0;
const bad = [];

for (const { phosphor, component } of documented) {
  const asset = assetName(phosphor);
  const url = `https://unpkg.com/@phosphor-icons/core@${VERSION}/assets/regular/${asset}.svg`;
  let upstream;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    upstream = /<path d="([^"]+)"/.exec(await res.text())?.[1];
  } catch (err) {
    bad.push([component, asset, `could not fetch: ${err.message}`]);
    continue;
  }
  const mine = vendored.get(component);
  if (mine === upstream) {
    ok++;
  } else {
    bad.push([
      component,
      asset,
      `vendored ${mine?.length ?? 0} chars, upstream ${upstream?.length ?? 0}` +
        (mine && upstream && upstream.startsWith(mine) ? ' — TRUNCATED' : ''),
    ]);
  }
}

console.log(`\n  identical to @phosphor-icons/core@${VERSION} regular: ${ok}/${documented.length}`);
for (const [component, asset, why] of bad) {
  console.log(`  MISMATCH  ${component} (${asset}): ${why}`);
}
if (bad.length || undocumented.length) process.exit(1);
console.log('  every icon is the real one.\n');
