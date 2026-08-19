import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("node_modules/@electric-sql/pglite/dist");
const target = resolve(".output/server/_libs");
const assets = ["pglite.data", "pglite.wasm", "initdb.wasm"];

mkdirSync(target, { recursive: true });
for (const asset of assets) {
  const from = resolve(source, asset);
  if (!existsSync(from)) throw new Error(`Missing PGLite runtime asset: ${from}`);
  copyFileSync(from, resolve(target, asset));
}

console.log(`[preview] copied ${assets.length} PGLite runtime assets`);
