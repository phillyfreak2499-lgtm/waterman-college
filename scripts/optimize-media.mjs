#!/usr/bin/env node
/**
 * One-off image optimizer for public/media.
 *
 * The site ships a few images far larger than their display size — most
 * notably the header/footer logos (rendered at ~20px but stored at 90–150KB)
 * and the hero/lesson photos (~300–700KB JPEGs). This script resizes the logos
 * and recompresses the photos IN PLACE, keeping a result only when it is
 * actually smaller, so it is safe to re-run.
 *
 *   npm install --save-dev sharp
 *   node scripts/optimize-media.mjs           # optimize
 *   node scripts/optimize-media.mjs --dry-run # report only, write nothing
 *
 * References to the files do not change (same names/paths), so no code edits
 * are needed. Review the diff, then commit the smaller images.
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("This script needs sharp. Install it first:\n  npm install --save-dev sharp");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const MEDIA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "media");

// Logos are shown at ~16–20px; 96px tall is crisp on 4–5x screens and tiny.
const LOGO_MAX_HEIGHT = { "waterman-logo.png": 96, "waterman-logo-light.png": 96, "seal.png": 96 };
// Never touch PWA/browser icons — their pixel dimensions are load-bearing.
const SKIP = new Set(["icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "favicon.svg"]);

const JPEG_MAX_WIDTH = 1600; // hero gets a little more headroom below
const HERO_MAX_WIDTH = 1920;
const JPEG_QUALITY = 80;
const kb = (n) => `${Math.round(n / 1024)}KB`;

async function optimize(name) {
  const file = join(MEDIA_DIR, name);
  const ext = extname(name).toLowerCase();
  const before = (await stat(file)).size;
  const input = await readFile(file);
  const img = sharp(input, { failOn: "none" });
  const meta = await img.metadata();
  let pipeline = null;

  if (LOGO_MAX_HEIGHT[name] !== undefined) {
    pipeline = sharp(input)
      .resize({ height: LOGO_MAX_HEIGHT[name], withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true });
  } else if (ext === ".jpg" || ext === ".jpeg") {
    const maxW = name.startsWith("campus-") ? HERO_MAX_WIDTH : JPEG_MAX_WIDTH;
    pipeline = sharp(input)
      .resize({ width: Math.min(meta.width ?? maxW, maxW), withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true });
  } else if (ext === ".png") {
    pipeline = sharp(input)
      .resize({ width: Math.min(meta.width ?? 1200, 1200), withoutEnlargement: true })
      .png({ compressionLevel: 9 });
  } else {
    return null; // svg/webp/etc — leave as-is
  }

  const out = await pipeline.toBuffer();
  if (out.length >= before) return { name, before, after: before, saved: 0 };
  if (!DRY_RUN) await writeFile(file, out);
  return { name, before, after: out.length, saved: before - out.length };
}

const names = (await readdir(MEDIA_DIR)).filter((n) => /\.(jpe?g|png)$/i.test(n) && !SKIP.has(n));
let total = 0;
console.log(`${DRY_RUN ? "[dry-run] " : ""}Optimizing ${names.length} images in public/media …\n`);
for (const name of names.sort()) {
  try {
    const r = await optimize(name);
    if (!r) continue;
    total += r.saved;
    const tag = r.saved > 0 ? `${kb(r.before)} -> ${kb(r.after)}  (-${kb(r.saved)})` : `${kb(r.before)} (already lean)`;
    console.log(`  ${name.padEnd(28)} ${tag}`);
  } catch (err) {
    console.warn(`  ${name.padEnd(28)} skipped: ${err.message}`);
  }
}
console.log(`\n${DRY_RUN ? "Would save" : "Saved"} ${kb(total)} total.`);
