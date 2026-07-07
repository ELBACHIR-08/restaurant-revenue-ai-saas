# Restaurant Revenue AI SaaS — Production Core V2 Supabase Connected

This version turns the SaaS demo into a production-oriented core.

## Included

- Vercel-ready static app + serverless APIs
- Supabase Auth-oriented signup/login flow
- Restaurant owner account creation
- 30-day trial subscription creation
- Products CRUD API
- Promotions CRUD API
- Report generation API
- Super Admin APIs
- Supabase SQL schema with RLS policies
- Kitchen/restaurant premium UI
- Super Admin tabs fixed: no scroll-to-top on tab click
- Fallback demo mode if Supabase is not configured

## Files

```text
index.html
package.json
vercel.json
api/
  health.js
  config.js
  signup.js
  login.js
  restaurants.js
  products.js
  promotions.js
  auth/me.js
  admin/summary.js
  admin/restaurants.js
  admin/subscriptions.js
  reports/generate.js
  _lib/http.js
  _lib/supabase-rest.js
supabase/schema.sql
docs/SUPABASE_SETUP.md
docs/PRODUCTION_LAUNCH_CHECKLIST.md
.env.example
```

## Deploy

Upload all files to the GitHub repository, then redeploy on Vercel.

## Test

```text
/health
/api/config
/api/products
/api/promotions
/api/admin/summary
```

If Supabase env vars are not added, the app runs in demo fallback mode.
If Supabase env vars are added and `schema.sql` has been executed, data persists in Supabase.

## Production mode

1. Create Supabase project.
2. Run `supabase/schema.sql`.
3. Add Vercel env vars from `.env.example`.
4. Redeploy.
5. Use signup to create the first restaurant.
6. Add the founder email to `PLATFORM_ADMIN_EMAILS` or set `profiles.is_platform_admin = true`.
7. Validate product/promo persistence.
8. Start pilot onboarding.

PayDunya and WhatsApp are intentionally left for the next sprint.
