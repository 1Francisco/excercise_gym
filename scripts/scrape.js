#!/usr/bin/env node

/**
 * Scrape products from Mexican supermarket sources and update the food database.
 *
 * Usage:
 *   node scripts/scrape.js                          # run all sources
 *   node scripts/scrape.js --source walmart-mx       # run specific source
 *   node scripts/scrape.js --dry-run                 # preview without writing
 */

import { mergeWithExisting, writeDatabase } from './normalize.js';
import { scrape as scrapeWalmart } from './sources/walmart-mx.js';
import { scrape as scrapeChedraui } from './sources/chedraui-mx.js';
import { scrape as scrapeSoriana } from './sources/soriana-mx.js';
import { scrape as scrapeOpenFoodFacts } from './sources/openfoodfacts-mx.js';

const SOURCES = {
  'walmart-mx': { name: 'Walmart México', fn: scrapeWalmart },
  'chedraui-mx': { name: 'Chedraui', fn: scrapeChedraui },
  'soriana-mx': { name: 'Soriana', fn: scrapeSoriana },
  'openfoodfacts-mx': { name: 'Open Food Facts MX', fn: scrapeOpenFoodFacts },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf('--source');
  const dryRun = args.includes('--dry-run');

  let sourcesToRun = null;
  if (sourceIndex !== -1 && args[sourceIndex + 1]) {
    sourcesToRun = [args[sourceIndex + 1]];
  }

  return { sourcesToRun, dryRun };
}

async function main() {
  const { sourcesToRun, dryRun } = parseArgs();

  const sources = sourcesToRun
    ? sourcesToRun.filter(s => SOURCES[s]).map(s => ({ key: s, ...SOURCES[s] }))
    : Object.entries(SOURCES).map(([key, val]) => ({ key, ...val }));

  if (sources.length === 0) {
    console.error('No valid sources to run. Available:', Object.keys(SOURCES).join(', '));
    process.exit(1);
  }

  let allProducts = [];
  let allErrors = [];

  for (const source of sources) {
    console.log(`\n--- Scraping ${source.name} ---`);
    try {
      const result = await source.fn();
      allProducts = allProducts.concat(result.products);
      if (result.errors.length > 0) {
        allErrors = allErrors.concat(result.errors.map(e => `[${source.name}] ${e}`));
        for (const err of result.errors) {
          console.warn(`  ⚠ ${err}`);
        }
      }
      console.log(`  ✓ ${result.products.length} products found`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      allErrors.push(`[${source.name}] ${err.message}`);
    }
  }

  console.log(`\n========== SUMMARY ==========`);
  console.log(`Total products scraped: ${allProducts.length}`);
  console.log(`Total errors: ${allErrors.length}`);

  if (allErrors.length > 0) {
    console.log('\nErrors:');
    for (const err of allErrors.slice(0, 10)) {
      console.log(`  - ${err}`);
    }
    if (allErrors.length > 10) {
      console.log(`  ... and ${allErrors.length - 10} more`);
    }
  }

  if (allProducts.length === 0) {
    console.log('\nNo products to merge. Exiting.');
    return;
  }

  const merged = mergeWithExisting(allProducts);

  if (dryRun) {
    console.log(`\n[Dry run] Would write ${Object.keys(merged).length} products to food_database.json`);
  } else {
    const count = writeDatabase(merged);
    console.log(`\n✓ Database updated successfully!`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
