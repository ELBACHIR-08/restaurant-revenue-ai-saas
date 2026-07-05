export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = req.body || {};
  res.status(200).json({
    ok: true,
    message: "Compte restaurant demo cree avec succes",
    trialDays: 30,
    restaurant: body.restaurantName || "Restaurant demo",
    plan: body.plan || "growth"
  });
}
