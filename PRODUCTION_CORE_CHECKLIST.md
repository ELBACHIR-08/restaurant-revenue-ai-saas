# Production Core Checklist

## Ready in this package
- Vercel static frontend + serverless API.
- `/health` and `/api/health` endpoint.
- Supabase-ready REST helper, no dependency required.
- Signup endpoint that creates restaurant + subscription when Supabase env vars are configured.
- Products and promotions endpoints.
- Admin tabs fixed: internal Super Admin navigation no longer scrolls to top.
- Products/promotions persist locally in browser and can sync to Supabase.
- SQL schema for multi-restaurant SaaS core.

## Required before onboarding paying restaurants
1. Create Supabase project.
2. Run `supabase/schema.sql`.
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables.
4. Redeploy without cache.
5. Test `/api/health` and confirm `supabase.configured = true`.
6. Test signup form and verify rows in `restaurants` and `subscriptions`.
7. Add real authentication / invitation flow before giving access to external restaurant teams.
8. Add PayDunya only after subscription statuses and invoice/payment logs are stable.

## Launch mode recommended
Start with an accompanied pilot: 3 to 5 selected restaurants, 30 days free, manual onboarding, then paid conversion.
