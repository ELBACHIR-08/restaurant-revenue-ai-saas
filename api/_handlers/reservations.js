const { send, handleOptions, readJson, getBearer, required } = require('../_lib/http');
const { isConfigured, select, insert, update, getUserFromToken, requireMembership } = require('../_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const restaurantId = req.headers['x-restaurant-id'] || (req.query && req.query.restaurant_id) || 'demo-restaurant';
    
    // GET: Fetch reservations for dashboard
    if (req.method === 'GET') {
      const token = getBearer(req);
      const user = token ? await getUserFromToken(token) : { demo: true };
      
      if (!isConfigured() || user.demo) {
        return send(res, 200, { ok: true, mode: 'demo', reservations: [] });
      }
      
      await requireMembership(user, restaurantId);
      const reservations = await select('reservations', { restaurant_id: `eq.${restaurantId}`, order: 'created_at.desc' });
      return send(res, 200, { ok: true, mode: 'supabase', reservations });
    }

    // POST: Create a new reservation (Public route from client mini-app)
    if (req.method === 'POST') {
      const body = await readJson(req);
      
      const customerName = required(body.customer_name, 'Customer name');
      const customerPhone = required(body.customer_phone, 'Customer phone');
      const partySize = required(body.party_size, 'Party size');
      const reservationDate = required(body.reservation_date, 'Reservation date');
      const reservationTime = required(body.reservation_time, 'Reservation time');
      const occasion = body.occasion || '';
      
      const notes = `Nom: ${customerName}\nTél: ${customerPhone}\nOccasion: ${occasion}`;
      
      const resData = {
        restaurant_id: restaurantId,
        party_size: Number(partySize),
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        status: 'pending',
        notes: notes
      };

      let resRecord = null;

      // Save to Supabase if configured, else simulate
      if (isConfigured() && restaurantId !== 'demo-restaurant') {
        const rows = await insert('reservations', resData);
        resRecord = rows[0];
      } else {
        resRecord = { id: `demo-res-${Date.now()}`, created_at: new Date().toISOString(), ...resData };
      }

      return send(res, 201, { 
        ok: true, 
        mode: isConfigured() && restaurantId !== 'demo-restaurant' ? 'supabase' : 'demo', 
        reservation: resRecord
      });
    }

    // PATCH: Update reservation status (dashboard)
    if (req.method === 'PATCH') {
      const token = getBearer(req);
      const user = token ? await getUserFromToken(token) : { demo: true };
      if (!isConfigured() || user.demo) return send(res, 200, { ok: true, mode: 'demo' });
      
      await requireMembership(user, restaurantId);
      
      const body = await readJson(req);
      const id = required(body.id, 'Reservation ID');
      const status = required(body.status, 'Status'); // 'approved', 'rejected', 'pending'
      
      const rows = await update('reservations', { id: `eq.${id}`, restaurant_id: `eq.${restaurantId}` }, { status });
      return send(res, 200, { ok: true, reservation: rows[0] });
    }

    return send(res, 405, { ok: false, error: 'Method not allowed' });

  } catch (error) {
    return send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
