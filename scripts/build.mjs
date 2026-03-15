import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..");
const distDir = join(rootDir, "dist");

const filesToCopy = [
  "index.html",
  "collection.html",
  "styles.css",
  "collection.css",
  "app.js",
  "collection.js",
  "collectibles-data.js",
  "utils.js",
  "sync-config.js",
  "sync.js",
  "iap.js",
  "pwa-register.js",
  "sw.js",
  "version.js",
  "manifest.webmanifest",
  "icons"
];

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const entry of filesToCopy) {
  await cp(join(rootDir, entry), join(distDir, entry), { recursive: true });
}

console.log(`Production build generated in ${distDir}`);
