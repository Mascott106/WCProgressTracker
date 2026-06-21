#!/usr/bin/env node
/** Wrap a PNG buffer in a single-image ICO container (Vista+ PNG-in-ICO). */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pngPath = path.join(root, "src/app/icon.png");
const icoPath = path.join(root, "src/app/favicon.ico");

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

writeFileSync(icoPath, Buffer.concat([dir, entry, png]));
console.log(`Wrote ${icoPath} (${width}x${height})`);
