# Supabase setup — Restaurant Revenue AI SaaS V2

## 1. Create Supabase project
Create a new Supabase project, then open **SQL Editor**.

## 2. Run schema
Copy/paste `supabase/schema.sql` and run it.

This creates:
- plans: Starter, Growth, Premium AI
- profiles
- restaurants
- restaurant_members
- subscriptions
- products
- promotions
- customers
- reservations
- orders
- reports
- support_tickets
- audit_logs
- RLS policies

## 3. Add Vercel environment variables
In Vercel → Project → Settings → Environment Variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PLATFORM_ADMIN_EMAILS=your-email@example.com
NEXT_PUBLIC_APP_URL=https://restaurant-revenue-ai-saas.vercel.app
APP_ENV=production
```

Redeploy after adding the variables.

## 4. Test health
Open:

```text
https://your-domain.vercel.app/health
```

Expected:

```json
{
  "ok": true,
  "supabase": {
    "configured": true,
    "db": "ok"
  }
}
```

## 5. Create first restaurant
Use the SaaS signup form. It creates:

1. Supabase Auth user
2. profile
3. restaurant
4. restaurant_members owner
5. trial subscription
6. restaurant settings

## 6. Create platform admin
You have two options:

Option A: set your email in `PLATFORM_ADMIN_EMAILS`.

Option B: in Supabase SQL Editor, after your account is created:

```sql
update public.profiles
set is_platform_admin = true
where email = 'your-email@example.com';
```

## 7. Production reminders
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Keep PayDunya keys server-side only.
- Review RLS policies before onboarding several restaurants.
- Add backups and monitoring before scaling.
