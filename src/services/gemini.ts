const GEMINI_API_KEY = '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function analyzeFoodWithAI(imageBase64: string | null, description: string): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} | null> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) return null;

  const contentParts: any[] = [];

  if (imageBase64) {
    contentParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const prompt = `Analyze this food and provide nutritional info for a standard portion (100g or 1 serving).
Return ONLY a valid JSON object with these fields:
{
  "name": "Food name in Spanish",
  "calories": number (kcal),
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams)
}
${description ? `The food appears to be: ${description}` : ''}
Do NOT include markdown code blocks or any other text. Return ONLY raw JSON.`;

  contentParts.push({ text: prompt });

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: contentParts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    const result = JSON.parse(jsonStr);

    return {
      name: result.name || 'Comida analizada',
      calories: Math.round(result.calories || 200),
      protein: Math.round(result.protein || 15),
      carbs: Math.round(result.carbs || 20),
      fat: Math.round(result.fat || 8),
    };
  } catch {
    return null;
  }
}

// API Key Management
const API_KEY_STORAGE_KEY = '@gemini_api_key_v1';

export async function getGeminiApiKey(): Promise<string> {
  try {
    const { storage } = await import('../services/storage');
    return await storage.getGeminiApiKey?.() || '';
  } catch {
    return '';
  }
}

export async function saveGeminiApiKey(key: string): Promise<void> {
  try {
    const { storage } = await import('../services/storage');
    await storage.saveGeminiApiKey?.(key);
  } catch {}
}
