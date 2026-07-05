export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: "Restaurant Revenue AI SaaS",
    version: "1.0.0",
    environment: "vercel-serverless"
  });
}
