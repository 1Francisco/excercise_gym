import { fetchPage, normalizeProduct } from './base.js';

const BASE_URL = 'https://www.chedraui.com.mx';
const CATEGORIES = [
  'carnes',
  'frutas-y-verduras',
  'lacteos',
  'panaderia',
  'despensa',
];

export async function scrape() {
  const products = [];
  const errors = [];

  for (const category of CATEGORIES) {
    try {
      const url = `${BASE_URL}/api/v2/products/search?q=${category}&limit=20`;
      const res = await fetchPage(url);

      if (res.status !== 200) {
        errors.push(`Chedraui ${category}: HTTP ${res.status}`);
        continue;
      }

      const data = res.data;
      const items = data?.products || data?.items || data?.data || [];

      for (const item of items) {
        products.push(normalizeProduct({
          name: item.name || item.displayName || '',
          type: category,
          calories: item.nutrition?.calories || 0,
          fat: item.nutrition?.fat || 0,
          carbs: item.nutrition?.carbs || 0,
          protein: item.nutrition?.protein || 0,
          price: item.price ? { regular_price: item.price, promotion: item.promotionalPrice || null } : null,
          weight_gr: item.weight || null,
        }, 'chedraui-mx'));
      }
    } catch (err) {
      errors.push(`Chedraui ${category}: ${err.message}`);
    }
  }

  return { products, errors };
}
