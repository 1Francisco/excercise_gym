import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = join(__dirname, '..', 'src', 'constants', 'data', 'food_database.json');

// Deduplicate by name (case-insensitive), keep the first occurrence
export function deduplicateByName(products) {
  const seen = new Set();
  return products.filter(p => {
    const key = p.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Deduplicate against existing DB
export function mergeWithExisting(newProducts) {
  let existing = {};
  try {
    existing = JSON.parse(readFileSync(DB_PATH, 'utf-8'));
  } catch {
    // File doesn't exist yet, start fresh
  }

  const existingMap = new Map();
  for (const key of Object.keys(existing)) {
    const p = existing[key];
    existingMap.set(p.name.toLowerCase().trim(), { key, product: p });
  }

  let nextId = Object.keys(existing).length + 1;

  for (const p of newProducts) {
    const normalizedName = p.name.toLowerCase().trim();
    if (existingMap.has(normalizedName)) continue;

    const key = `product_${String(nextId).padStart(6, '0')}`;
    existingMap.set(normalizedName, { key, product: p });
    existing[key] = p;
    nextId++;
  }

  return existing;
}

export function writeDatabase(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  const count = Object.keys(data).length;
  console.log(`Written ${count} products to food_database.json`);
  return count;
}
