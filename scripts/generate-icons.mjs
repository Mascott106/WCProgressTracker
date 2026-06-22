#!/usr/bin/env node
/** Render src/app/icon.svg (Twemoji-style soccer ball) to PNG/ICO for Next.js metadata. */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "src/app");
const svgPath = path.join(appDir, "icon.svg");
const iconPngPath = path.join(appDir, "icon.png");
const applePngPath = path.join(appDir, "apple-icon.png");
const icoPath = path.join(appDir, "favicon.ico");

function renderSvg(width, outputPath) {
  execFileSync(
    "npx",
    ["--yes", "@resvg/resvg-js-cli", "--fit-width", String(width), svgPath, outputPath],
    { cwd: root, stdio: "inherit" },
  );
}

function writeIcoFromPng(pngPath, outputPath) {
  const png = readFileSync(pngPath);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const w = width >= 256 ? 0 : width;
  const h = height >= 256 ? 0 : height;

  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = w;
  entry[1] = h;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);

  writeFileSync(outputPath, Buffer.concat([dir, entry, png]));
  console.log(`Wrote ${outputPath} (${width}x${height})`);
}

renderSvg(32, iconPngPath);
renderSvg(180, applePngPath);
writeIcoFromPng(iconPngPath, icoPath);
