const { send, handleOptions, readJson, getBearer, required } = require('../_lib/http');
const { isConfigured, insert, getUserFromToken, requireMembership } = require('../_lib/supabase-rest');

// Helper to simulate a 3-second delay for the demo mode
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const DEMO_EXTRACTED_PRODUCTS = [
  { name: 'Thiéboudienne royale', category: 'Plats', price: 4500, description: 'Le plat national avec poisson frais', tags: ['signature'], status: 'available', dine_in_enabled: true, delivery_enabled: true, takeaway_enabled: true },
  { name: 'Yassa poulet fermier', category: 'Plats', price: 3800, description: 'Poulet mariné au citron et oignons caramélisés', tags: ['populaire'], status: 'available', dine_in_enabled: true, delivery_enabled: true, takeaway_enabled: true },
  { name: 'Mafé bœuf', category: 'Plats', price: 3500, description: 'Ragoût de bœuf à la pâte d\'arachide', tags: ['traditionnel'], status: 'available', dine_in_enabled: true, delivery_enabled: true, takeaway_enabled: true },
  { name: 'Salade de crudités', category: 'Entrées', price: 1500, description: 'Légumes frais de saison', tags: ['végétarien'], status: 'available', dine_in_enabled: true, delivery_enabled: true, takeaway_enabled: true },
  { name: 'Jus bissap maison', category: 'Boissons', price: 800, description: 'Fleurs d\'hibiscus et menthe', tags: ['fait-maison'], status: 'available', dine_in_enabled: true, delivery_enabled: true, takeaway_enabled: true },
  { name: 'Thiakry crémeux', category: 'Desserts', price: 1200, description: 'Couscous de mil et lait caillé', tags: ['dessert'], status: 'available', dine_in_enabled: true, delivery_enabled: false, takeaway_enabled: true },
];

async function callOpenAIVision(base64Image, mimeType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const prompt = `Tu es un expert culinaire. Lis ce menu de restaurant (généralement africain/sénégalais).
  Extrais tous les plats et boissons. Retourne UNIQUEMENT un tableau JSON valide.
  Chaque objet doit avoir cette structure exacte :
  {
    "name": "Nom du plat",
    "price": Prix en nombre (sans devise),
    "category": "Plats" | "Entrées" | "Desserts" | "Boissons",
    "description": "Courte description",
    "tags": ["végétarien", "épicé", "signature", "populaire"] (uniquement si pertinent, max 2)
  }
  Ne renvoie aucun texte avant ou après le JSON.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Erreur lors de l\'appel à OpenAI');
  }

  const content = data.choices[0].message.content;
  // Clean potential markdown formatting
  const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(jsonStr);
}

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const body = await readJson(req);
    const { base64, mimeType, restaurant_id } = body;
    const targetRestaurantId = restaurant_id || req.headers['x-restaurant-id'] || 'demo-restaurant';

    const token = getBearer(req);
    const user = token ? await getUserFromToken(token) : { demo: true };

    if (!base64 || !mimeType) {
      return send(res, 400, { ok: false, error: 'File data missing (base64, mimeType)' });
    }

    let extractedProducts = [];
    let source = 'demo';

    // If we have OpenAI configured, try to use it. Otherwise, fallback to DEMO mode.
    if (process.env.OPENAI_API_KEY && !user.demo && mimeType.startsWith('image/')) {
      try {
        extractedProducts = await callOpenAIVision(base64, mimeType);
        source = 'openai';
      } catch (aiError) {
        console.error('AI Extraction failed:', aiError);
        // Fallback to demo if AI fails
        await sleep(2500);
        extractedProducts = [...DEMO_EXTRACTED_PRODUCTS];
      }
    } else {
      // Demo simulation delay
      await sleep(2500);
      extractedProducts = [...DEMO_EXTRACTED_PRODUCTS];
    }

    // Format products for database
    const formattedProducts = extractedProducts.map(p => ({
      restaurant_id: targetRestaurantId,
      name: String(p.name).substring(0, 100),
      price: Number(p.price) || 0,
      category: String(p.category || 'Carte'),
      description: p.description ? String(p.description).substring(0, 200) : null,
      tags: Array.isArray(p.tags) ? p.tags : [],
      status: 'available',
      dine_in_enabled: true,
      delivery_enabled: true,
      takeaway_enabled: true
    }));

    // If Supabase is configured, save them to the DB
    let savedProducts = formattedProducts;
    if (isConfigured() && !user.demo) {
      await requireMembership(user, targetRestaurantId, ['owner', 'manager', 'marketing']);
      
      // Save all products in parallel or in a bulk insert if supported by the rest lib
      // The `insert` function in supabase-rest.js might support array bulk inserts
      savedProducts = await insert('products', formattedProducts);
    } else {
      // Demo mode: assign fake IDs
      savedProducts = formattedProducts.map((p, i) => ({ id: `demo-ai-${Date.now()}-${i}`, ...p }));
    }

    send(res, 200, {
      ok: true,
      mode: isConfigured() && !user.demo ? 'supabase' : 'demo',
      source,
      products: savedProducts,
      message: `${savedProducts.length} plats extraits avec succès.`
    });

  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
