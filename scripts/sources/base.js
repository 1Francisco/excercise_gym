import axios from 'axios';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
};

export async function fetchPage(url) {
  const res = await axios.get(url, {
    headers: HEADERS,
    timeout: 15000,
    validateStatus: () => true, // don't throw on any status
  });
  return res;
}

export function extractJsonLd(html) {
  const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      matches.push(JSON.parse(match[1]));
    } catch { }
  }
  return matches;
}

export function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch { }
  }
  return null;
}

export function extractInitialState(html) {
  const match = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch { }
  }
  return null;
}

export function normalizeProduct(raw, source) {
  return {
    name: raw.name || 'Unknown',
    type: raw.type || 'general',
    nutrition: {
      calories: raw.calories || 0,
      fat: raw.fat || 0,
      carbs: raw.carbs || 0,
      protein: raw.protein || 0,
    },
    price: raw.price || null,
    weight_gr: raw.weight_gr || null,
    source: source || 'unknown',
    last_update: new Date().toISOString(),
  };
}
