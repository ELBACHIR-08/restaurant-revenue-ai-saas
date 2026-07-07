# Production launch checklist

## Core ready
- [ ] Vercel production domain works
- [ ] `/health` returns `supabase.configured = true`
- [ ] Supabase schema installed
- [ ] RLS enabled on all restaurant-scoped tables
- [ ] First owner account created
- [ ] Trial subscription created automatically
- [ ] Product creation persists after reload
- [ ] Promotion creation persists after reload
- [ ] Report generation works and creates a `reports` row
- [ ] Super Admin tabs do not scroll to top
- [ ] Restaurant tabs do not scroll to top

## Security
- [ ] `SUPABASE_SERVICE_ROLE_KEY` exists only in Vercel env vars
- [ ] Platform admin email configured
- [ ] Restaurant A cannot read Restaurant B data
- [ ] Owner can manage products/promos
- [ ] Manager can manage products/promos
- [ ] Server/kitchen cannot access subscription settings
- [ ] Audit logs planned for sensitive updates

## Commercial pilot
- [ ] 3 pilot restaurants identified
- [ ] onboarding checklist prepared
- [ ] 30-day trial workflow validated
- [ ] pricing page validated: 20k / 30k / 50k XOF
- [ ] legal/privacy notice drafted

## Next sprint
- [ ] PayDunya subscription payment
- [ ] PayDunya IPN webhook
- [ ] WhatsApp confirmation
- [ ] QR code generation per table
- [ ] menu import from PDF/photo/site
