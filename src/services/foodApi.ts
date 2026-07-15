import foodDatabaseRaw from '../constants/data/food_database.json';
import mexicanFoodsRaw from '../constants/data/mexican_foods.json';

interface ProductSchema {
  name: string;
  type?: string;
  nutrition: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  };
  price?: {
    regular_price: number;
    promotion: number | null;
  };
  weight_gr?: number;
}

// Convert raw database objects to typed arrays
const LOCAL_PRODUCTS = Object.values(foodDatabaseRaw) as ProductSchema[];
const MEXICAN_PRODUCTS = mexicanFoodsRaw as ProductSchema[];

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

export type { ProductSchema };

export function searchLocalDB(query: string): ProductSchema | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  let bestMatch: ProductSchema | null = null;
  const allProducts = [...MEXICAN_PRODUCTS, ...LOCAL_PRODUCTS];

  for (const item of allProducts) {
    const nameLower = item.name.toLowerCase();
    if (nameLower === q) {
      bestMatch = item;
      break;
    }
    if (nameLower.includes(q) && (!bestMatch || nameLower.length < bestMatch.name.length)) {
      bestMatch = item;
    }
  }

  return bestMatch;
}

export async function searchByBarcode(barcode: string): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
} | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      headers: { 'User-Agent': 'ExercisesGymApp/1.0 (Mexico)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments || {};
    return {
      name: p.product_name || `Producto ${barcode}`,
      calories: Math.round(n['energy-kcal_100g'] || 0),
      protein: Math.round(n.proteins_100g || 0),
      carbs: Math.round(n.carbohydrates_100g || 0),
      fat: Math.round(n.fat_100g || 0),
      image: p.image_url || undefined,
    };
  } catch {
    return null;
  }
}

export async function searchOpenFoodFacts(query: string): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
} | null> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      json: 'true',
      page_size: '3',
      lang: 'es',
    });

    const res = await fetch(`${OPEN_FOOD_FACTS_URL}?${params}`, {
      headers: {
        'User-Agent': 'ExercisesGymApp/1.0 (Mexico)',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.products || data.products.length === 0) return null;

    // Pick the best match (prefer Spanish name, prefer first result)
    const product = data.products[0];
    const nutriments = product.nutriments || {};

    return {
      name: product.product_name || query,
      calories: Math.round(nutriments['energy-kcal_100g'] || 0),
      protein: Math.round(nutriments.proteins_100g || 0),
      carbs: Math.round(nutriments.carbohydrates_100g || 0),
      fat: Math.round(nutriments.fat_100g || 0),
      image: product.image_url || undefined,
    };
  } catch {
    return null;
  }
}
