#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "..", "locales");

function collectLeafPaths(obj, prefix = "") {
  const paths = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("_")) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      paths.push(path);
    } else if (typeof value === "object" && value !== null) {
      if ("normal" in value && "nerd" in value) {
        paths.push(path);
      } else if ("one" in value || "other" in value) {
        paths.push(path);
      } else {
        paths.push(...collectLeafPaths(value, path));
      }
    }
  }
  return paths.sort();
}

function loadJson(name) {
  const raw = readFileSync(join(localesDir, name), "utf8");
  return JSON.parse(raw);
}

function getAtPath(obj, path) {
  let current = obj;
  for (const segment of path.split(".")) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function isEmptyString(value) {
  return typeof value === "string" && value.trim() === "";
}

function checkEmptyStrings(obj, prefix = "") {
  const errors = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("_")) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      if (isEmptyString(value)) errors.push(`${path} is empty`);
    } else if (typeof value === "object" && value !== null) {
      errors.push(...checkEmptyStrings(value, path));
    }
  }
  return errors;
}

const en = loadJson("en.json");
const enPaths = collectLeafPaths(en);
const localeFiles = readdirSync(localesDir).filter(
  (f) => f.endsWith(".json") && f !== "en.json",
);

let failed = false;

for (const file of localeFiles) {
  const locale = file.replace(".json", "");
  const data = loadJson(file);
  const missing = enPaths.filter((p) => getAtPath(data, p) === undefined);
  const extra = collectLeafPaths(data).filter((p) => getAtPath(en, p) === undefined);
  const empty = checkEmptyStrings(data);

  if (missing.length) {
    failed = true;
    console.error(`\n${locale}: missing ${missing.length} key(s):`);
    missing.forEach((p) => console.error(`  - ${p}`));
  }
  if (extra.length) {
    console.warn(`\n${locale}: ${extra.length} extra key(s) not in en.json:`);
    extra.forEach((p) => console.warn(`  - ${p}`));
  }
  if (empty.length) {
    failed = true;
    console.error(`\n${locale}: empty string(s):`);
    empty.forEach((p) => console.error(`  - ${p}`));
  }
}

if (failed) {
  console.error("\ni18n:check failed");
  process.exit(1);
}

console.log(
  `i18n:check passed (${enPaths.length} keys × ${localeFiles.length + 1} locales)`,
);
