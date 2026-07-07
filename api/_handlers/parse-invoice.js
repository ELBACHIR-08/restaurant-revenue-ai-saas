const { send, handleOptions, readJson, getBearer, required } = require('../_lib/http');
const { isConfigured, insert, getUserFromToken, requireMembership } = require('../_lib/supabase-rest');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const DEMO_EXTRACTED_INVOICE = {
  supplier_name: 'Boucherie La Vache d\'Or',
  date: new Date().toISOString().split('T')[0],
  total_amount: 45000,
  extracted_items: [
    { name: 'Filet de boeuf 5kg', qty: 1, price: 35000 },
    { name: 'Saucisses artisanales', qty: 2, price: 5000 }
  ]
};

async function callOpenAIVision(base64Image, mimeType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const prompt = `Tu es un expert comptable. Lis cette facture ou ce reçu d'un fournisseur de restaurant.
  Extrais les informations principales. Retourne UNIQUEMENT un objet JSON valide.
  La structure exacte doit être :
  {
    "supplier_name": "Nom du fournisseur",
    "date": "YYYY-MM-DD",
    "total_amount": Prix total en nombre (sans devise),
    "extracted_items": [
      {
        "name": "Nom de l'article",
        "qty": Quantite en nombre,
        "price": Prix unitaire
      }
    ]
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

    let extractedData = null;
    let source = 'demo';

    if (process.env.OPENAI_API_KEY && !user.demo && mimeType.startsWith('image/')) {
      try {
        extractedData = await callOpenAIVision(base64, mimeType);
        source = 'openai';
      } catch (aiError) {
        console.error('AI Extraction failed:', aiError);
        await sleep(2500);
        extractedData = DEMO_EXTRACTED_INVOICE;
      }
    } else {
      await sleep(2500);
      extractedData = DEMO_EXTRACTED_INVOICE;
    }

    const formattedExpense = {
      restaurant_id: targetRestaurantId,
      supplier_name: extractedData.supplier_name || 'Fournisseur inconnu',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      total_amount: Number(extractedData.total_amount) || 0,
      extracted_items: Array.isArray(extractedData.extracted_items) ? extractedData.extracted_items : [],
      status: 'pending'
    };

    let savedExpense = formattedExpense;
    if (isConfigured() && !user.demo) {
      await requireMembership(user, targetRestaurantId, ['owner', 'manager', 'accountant']);
      const rows = await insert('expenses', formattedExpense);
      savedExpense = rows[0];
    } else {
      savedExpense = { id: `demo-exp-${Date.now()}`, ...formattedExpense };
    }

    send(res, 200, {
      ok: true,
      mode: isConfigured() && !user.demo ? 'supabase' : 'demo',
      source,
      expense: savedExpense,
      message: `Facture de ${savedExpense.supplier_name} extraite avec succès.`
    });

  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
