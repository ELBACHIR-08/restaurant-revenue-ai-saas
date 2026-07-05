# Restaurant Revenue AI SaaS - Production Core V1

Production Core for the SaaS platform: Vercel frontend + serverless API + Supabase-ready persistence.

## What changed in this version

- Super Admin tabs fixed: clicking `Vue globale`, `Restaurants`, `Plans`, `Onboarding`, `Support`, or `Analytics` no longer scrolls the page to the top.
- App tabs also keep context instead of forcing a top scroll.
- UI state is preserved in localStorage.
- Product and promotion changes persist locally and can sync to Supabase.
- New API endpoints:
  - `/api/health`
  - `/api/signup`
  - `/api/restaurants`
  - `/api/products`
  - `/api/promotions`
  - `/api/admin-summary`
- Supabase SQL schema included under `supabase/schema.sql`.
- `.env.example` included for Vercel environment variables.

## Deploy on Vercel

Upload the full folder contents to GitHub, then let Vercel redeploy.

Vercel settings:

```text
Framework Preset: Other / No Framework
Build Command: empty
Output Directory: empty or .
Install Command: default
Root Directory: ./
```

## Test

```text
https://YOUR_DOMAIN.vercel.app/health
https://YOUR_DOMAIN.vercel.app/api/products
https://YOUR_DOMAIN.vercel.app/api/promotions
```

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Add these variables in Vercel:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

4. Redeploy.
5. Open `/api/health` and confirm `supabase.configured = true`.

## PayDunya

PayDunya keys are not included yet. Add them only after the Supabase core is stable:

```text
PAYDUNYA_MASTER_KEY
PAYDUNYA_PRIVATE_KEY
PAYDUNYA_PUBLIC_KEY
PAYDUNYA_TOKEN
PAYDUNYA_MODE
```

## Launch recommendation

This is ready for a controlled pilot. For fully autonomous SaaS scale, the next step is real auth/invitations, RBAC enforcement, PayDunya billing, and monitoring.
