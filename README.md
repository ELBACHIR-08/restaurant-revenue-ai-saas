# Restaurant Revenue AI SaaS

Prototype SaaS commercialisable pour restaurants : landing page, pricing, creation de compte, onboarding, dashboard directeur, gestion produits, promos, clients, equipe, abonnement et super admin plateforme.

## Deploiement Vercel

1. Dezipper le projet.
2. Uploader tout le contenu du dossier dans le repository GitHub `restaurant-revenue-ai-saas`.
3. Dans Vercel : New Project -> Import Git Repository.
4. Reglages recommandes :
   - Framework Preset : Other / No Framework
   - Build Command : vide
   - Output Directory : vide ou `.`
   - Install Command : laisser par defaut
5. Deployer.

## Tests

- Page principale : `/`
- API de sante : `/health` ou `/api/health`

## Notes

Ce prototype est volontairement frontend-first pour la demonstration commerciale. Les paiements, comptes, menus et donnees sont simules. La version production devra ajouter une base de donnees, une authentification, une integration PSP/wallet et une politique de protection des donnees.
