IMPORTANT - DEPLOIEMENT VERCEL

1. Le dossier doit s'appeler exactement api en minuscules.
   Correct : api/login.js
   Incorrect : API/login.js

2. Les fichiers API doivent etre a la racine du repo GitHub :
   index.html
   vercel.json
   package.json
   api/
     ping.js
     health.js
     login.js
     products.js
     promotions.js
     restaurants.js
     admin-summary.js
     admin-restaurants.js
     admin-subscriptions.js
     reports-generate.js

3. Apres deploiement, tester dans cet ordre :
   https://restaurant-revenue-ai-saas.vercel.app/api/ping
   https://restaurant-revenue-ai-saas.vercel.app/api/routes
   https://restaurant-revenue-ai-saas.vercel.app/api/health

4. Si /api/ping retourne 404, Vercel ne voit pas le dossier api.
   Dans ce cas : verifier GitHub root, supprimer tout dossier API majuscule, redeployer sans cache.
