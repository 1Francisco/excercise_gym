import { fetchPage, extractJsonLd, normalizeProduct } from './base.js';

const BASE_URL = 'https://www.walmart.com.mx';
const CATEGORIES = [
  'carnes-aves-y-pescados',
  'frutas-y-verduras',
  'lacteos-y-huevos',
  'panaderia-y-tortillas',
  'abarrotes',
  'bebidas',
  'cuidado-personal',
];

export async function scrape() {
  const products = [];
  const errors = [];

  for (const category of CATEGORIES) {
    try {
      const url = `${BASE_URL}/api/product/search?category=${category}&page=1&pageSize=20`;
      const res = await fetchPage(url);

      if (res.status !== 200) {
        errors.push(`Walmart MX ${category}: HTTP ${res.status}`);
        continue;
      }

      const data = res.data;
      const items = data?.products || data?.items || data?.results || [];

      for (const item of items) {
        products.push(normalizeProduct({
          name: item.name || item.displayName || '',
          type: category,
          calories: item.nutrition?.calories || 0,
          fat: item.nutrition?.fat || 0,
          carbs: item.nutrition?.carbs || 0,
          protein: item.nutrition?.protein || 0,
          price: item.price ? { regular_price: item.price, promotion: null } : null,
          weight_gr: item.weight || null,
        }, 'walmart-mx'));
      }
    } catch (err) {
      errors.push(`Walmart MX ${category}: ${err.message}`);
    }
  }

  return { products, errors };
}
