# Restaurant Revenue AI SaaS - Flat API V5

Version corrigee pour upload simple : les routes admin ont ete aplaties afin d'eviter les conflits visuels de fichiers ayant le meme nom.

## Routes principales

- `/api/health`
- `/api/login`
- `/api/signup`
- `/api/auth-me`
- `/api/restaurants`
- `/api/products`
- `/api/promotions`
- `/api/reports-generate`
- `/api/admin-summary`
- `/api/admin-restaurants`
- `/api/admin-subscriptions`

## Deploiement

1. Dezipper dans un dossier propre.
2. Uploader tout le contenu du dossier dans GitHub.
3. Accepter les remplacements.
4. Commit changes.
5. Vercel redeploie automatiquement.

## Variables Vercel

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLATFORM_ADMIN_EMAILS`
- `NEXT_PUBLIC_APP_URL`
- `APP_ENV`
