import axios from 'axios';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', 'src', 'constants', 'data', 'food_database.json');
const INCREMENTAL_PATH = join(__dirname, '..', '..', 'src', 'constants', 'data', 'food_database.json');

const API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

// Track which foods we already have to avoid unnecessary API calls
function getScrapedFoods() {
  try {
    if (!existsSync(DB_PATH)) return new Set();
    const data = JSON.parse(readFileSync(DB_PATH, 'utf-8'));
    const scraped = new Set();
    for (const key of Object.keys(data)) {
      if (data[key].source === 'openfoodfacts') {
        // Extract the original food name from the product name or use a normalized key
        // For simplicity, track by normalized product name
      }
    }
    return scraped;
  } catch {
    return new Set();
  }
}

// Incrementally save products as we go
function saveIncrementally(newProducts) {
  try {
    let existing = {};
    if (existsSync(DB_PATH)) {
      existing = JSON.parse(readFileSync(DB_PATH, 'utf-8'));
    }

    const existingNames = new Set();
    for (const key of Object.keys(existing)) {
      existingNames.add(existing[key].name.toLowerCase().trim());
    }

    const toAdd = [];
    for (const p of newProducts) {
      const normalizedName = p.name.toLowerCase().trim();
      if (!existingNames.has(normalizedName)) {
        toAdd.push(p);
        existingNames.add(normalizedName);
      }
    }

    if (toAdd.length === 0) return 0;

    const maxId = Object.keys(existing).reduce((max, k) => {
      const num = parseInt(k.replace('product_', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    let id = maxId;
    for (const p of toAdd) {
      id++;
      existing[`product_${String(id).padStart(6, '0')}`] = p;
    }

    writeFileSync(DB_PATH, JSON.stringify(existing, null, 2), 'utf-8');
    return toAdd.length;
  } catch (err) {
    console.error('Save error:', err.message);
    return 0;
  }
}

const MEXICAN_FOODS = [
  // Tortillas y masas
  'tortilla maiz', 'tortilla harina', 'masa maiz', 'tostada', 'tlacoyo',
  'memela', 'huarache', 'gordita maiz', 'sope maiz',

  // Frijoles
  'frijoles', 'frijoles refritos', 'frijol negro', 'frijol bayo',
  'frijol flor de mayo', 'frijol peruano', 'frijol pinto',
  'frijoles charros', 'frijol puero',

  // Arroz y granos
  'arroz', 'arroz blanco', 'arroz rojo', 'arroz con leche',
  'amaranto', 'chia',

  // Chiles
  'chile jalapeño', 'chile serrano', 'chile poblano', 'chile habanero',
  'chile de arbol', 'chile guajillo', 'chile ancho', 'chile mulato',
  'chile chipotle', 'chile pasilla', 'chile cascabel',

  // Aguacate y derivados
  'aguacate', 'guacamole',

  // Quesos mexicanos
  'queso oaxaca', 'queso panela', 'queso cotija', 'queso fresco',
  'queso asadero', 'queso chihuahua', 'queso manchego',
  'requeson', 'crema mexicana',

  // Carnes de res
  'bistec res', 'arrachera', 'diezmillo', 'falda res',
  'molida res', 'higado encebollado', 'lengua res', 'sesos',

  // Carnes de cerdo
  'carnitas', 'pastor', 'cochinita pibil', 'suadero', 'longaniza',
  'chorizo', 'chicharron cerdo', 'cuerito', 'tocino',

  // Pollo y pavo
  'pollo', 'pechuga pollo', 'pierna pollo', 'milanesa pollo',
  'pierna pavo', 'pavo',

  // Pescados y mariscos
  'huachinango', 'mojarra', 'tilapia', 'salmon', 'atun',
  'camaron', 'pulpo', 'ceviche', 'aguachile', 'pescado veracruzana',

  // Sopas y caldos
  'sopa fideo', 'sopa lentejas', 'caldo res', 'caldo pollo',
  'consome pollo', 'pozole', 'menudo', 'birria', 'sopa tortilla',

  // Guisados
  'tinga pollo', 'mole verde', 'mole poblano', 'adobo',
  'pipian', 'rajas poblanas', 'picadillo', 'chilaquiles',
  'enchilada', 'enfrijolada', 'chiles rellenos',

  // Antojitos
  'quesadilla', 'pambazo', 'sincronizada', 'taco dorado',
  'flauta', 'tostada', 'sope', 'tamal', 'tamal oaxaqueno',
  'tamal elote', 'chalupa', 'gordita chicharron',

  // Pan dulce
  'concha pan', 'cuerno pan', 'oreja pan', 'beso pan',
  'polvoron', 'empanada', 'garibaldi', 'alamar pan',
  'puerquito pan', 'pan muerto', 'ladrillo pan', 'pan de huevo',
  'rebanada pan', 'pan frances',

  // Postres
  'flan', 'cajeta', 'dulce leche', 'alegria amaranto',
  'bunuelo', 'capirotada', 'cocada', 'jericalla',
  'chongos zamoranos', 'gelatina', 'arroz con leche',
  'churro', 'nieve garrafa', 'paleta hielo',

  // Bebidas
  'horchata', 'jamaica', 'tamarindo', 'pulque', 'tepache',
  'atole', 'champurrado', 'jugo naranja', 'agua mineral',
  'refresco cola', 'cafe', 'chocolate abuelita',

  // Frutas
  'mango', 'papaya', 'guayaba', 'zapote', 'mamey', 'tuna',
  'pitaya', 'jicama', 'tejocote', 'xoconostle',
  'ciruela mexicana', 'capulin', 'naranja', 'limon', 'toronja',
  'platano', 'manzana', 'sandia', 'melon', 'coco',

  // Verduras y quelites
  'nopal', 'nopales', 'huitlacoche', 'flor calabaza', 'elote',
  'esquites', 'quelites', 'verdolagas', 'chaya', 'hoja santa',
  'berro', 'jitomate', 'cebolla', 'cilantro', 'epazote',
  'calabaza', 'chayote', 'camote', 'papa',

  // Salsas y condimentos
  'salsa verde', 'salsa roja', 'salsa taquera', 'salsa arbol',
  'salsa borracha', 'salsa huichol', 'salsa macha',
  'mole', 'adobo', 'consome', 'sal rosita',
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchWithRetry(params, retries = 3) {
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(`${API_URL}?${params}`, {
        headers: { 'User-Agent': 'ExercisesGymScraper/1.0 (Mexico)' },
        timeout: 20000,
      });
      if (res.status === 200) return res.data;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        const wait = 2000 * Math.pow(2, i) + Math.random() * 1000;
        await sleep(wait);
      }
    }
  }
  throw lastError;
}

export async function scrape() {
  const products = [];
  const errors = [];

  for (let i = 0; i < MEXICAN_FOODS.length; i++) {
    const food = MEXICAN_FOODS[i];
    const delay = 2500 + Math.random() * 1000;

    if (i > 0) await sleep(delay);

    try {
      const params = new URLSearchParams({
        search_terms: food,
        json: 'true',
        page_size: '15',
        lang: 'es',
      });

      const data = await searchWithRetry(params);
      if (!data?.products?.length) {
        process.stdout.write(`  - ${food}: sin resultados\n`);
        continue;
      }

      const batch = [];
      for (const p of data.products) {
        const nutriments = p.nutriments || {};
        const name = p.product_name || food;
        if (!name || name === food) continue;

        batch.push({
          name,
          type: (p.categories || '').split(',')[0]?.trim() || food,
          nutrition: {
            calories: Math.round(nutriments['energy-kcal_100g'] || 0),
            fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
            carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
            protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
          },
          price: null,
          weight_gr: null,
          source: 'openfoodfacts',
          last_update: new Date().toISOString(),
        });
      }

      if (batch.length > 0) {
        const saved = saveIncrementally(batch);
        products.push(...batch);
        process.stdout.write(`  ✓ ${food} (+${saved} nuevos, ${products.length} total)\n`);
      }
    } catch (err) {
      errors.push(`OpenFoodFacts ${food}: ${err.message}`);
      process.stdout.write(`  ✗ ${food}: ${err.message}\n`);
    }
  }

  return { products, errors };
}
