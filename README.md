# Restaurant Revenue AI SaaS - API 405 Fix V6

Correctif pour erreur `Réponse API non JSON (405)`.

Points importants :
- Le dossier API doit etre exactement `api` en minuscules et a la racine du repo.
- Ne pas le renommer en `API`. Vercel attend le dossier `/api` en minuscules.
- Les routes admin sont aplatées pour eviter les doublons visuels : `api/admin-restaurants.js`, `api/admin-summary.js`, `api/admin-subscriptions.js`.
- Le fallback vers `index.html` exclut maintenant `/api/*` pour ne jamais intercepter un POST API.

Tests apres deploy :
- `/api/health`
- `/api/config`
- `/api/login` en GET doit retourner une reponse JSON `method_hint`.
- Connexion via le formulaire doit appeler POST `/api/login`.

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
