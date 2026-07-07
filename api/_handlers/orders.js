const { send, handleOptions, readJson, getBearer, required } = require('../_lib/http');
const { isConfigured, select, insert, getUserFromToken, requireMembership } = require('../_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const restaurantId = req.headers['x-restaurant-id'] || (req.query && req.query.restaurant_id) || 'demo-restaurant';
    
    // GET: Fetch orders for dashboard
    if (req.method === 'GET') {
      const token = getBearer(req);
      const user = token ? await getUserFromToken(token) : { demo: true };
      
      if (!isConfigured() || user.demo) {
        return send(res, 200, { ok: true, mode: 'demo', orders: [] });
      }
      
      await requireMembership(user, restaurantId);
      const orders = await select('orders', { restaurant_id: `eq.${restaurantId}`, order: 'created_at.desc' });
      return send(res, 200, { ok: true, mode: 'supabase', orders });
    }

    // POST: Create a new order (Public route from client mini-app)
    if (req.method === 'POST') {
      const body = await readJson(req);
      
      // Basic validation
      const customerName = required(body.customer_name, 'Customer name');
      const customerPhone = required(body.customer_phone, 'Customer phone');
      const items = body.items;
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Order items are required');
      }
      
      const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
      const paymentMethod = body.payment_method || 'wave';
      
      const orderData = {
        restaurant_id: restaurantId,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: items, // JSONB array
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: 'pending',
        order_type: body.order_type || 'delivery'
      };

      let orderRecord = null;

      // Save to Supabase if configured, else simulate
      if (isConfigured() && restaurantId !== 'demo-restaurant') {
        const rows = await insert('orders', orderData);
        orderRecord = rows[0];
      } else {
        orderRecord = { id: `demo-order-${Date.now()}`, created_at: new Date().toISOString(), ...orderData };
      }

      // Generate WhatsApp message and URL
      // We assume the restaurant phone is required. In a real app we'd fetch the restaurant's phone from settings.
      // For now, we will just format the message, and the frontend can handle the wa.me link generation
      // or we return the formatted text.
      const orderNum = orderRecord.id.toString().substring(0, 8);
      const itemsText = items.map(c => `▪️ ${c.name} ×${c.qty} (${c.price * c.qty} FCFA)`).join('\n');
      
      const whatsappMessage = `*🍽️ NOUVELLE COMMANDE #${orderNum}*\n\n*👤 Client:* ${customerName}\n*📞 Tél:* ${customerPhone}\n*💳 Paiement:* ${paymentMethod.toUpperCase()}\n\n*📋 Détails de la commande:*\n${itemsText}\n\n*💰 TOTAL : ${totalAmount} FCFA*`;

      return send(res, 201, { 
        ok: true, 
        mode: isConfigured() && restaurantId !== 'demo-restaurant' ? 'supabase' : 'demo', 
        order: orderRecord,
        whatsapp_message: whatsappMessage
      });
    }

    return send(res, 405, { ok: false, error: 'Method not allowed' });

  } catch (error) {
    return send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
