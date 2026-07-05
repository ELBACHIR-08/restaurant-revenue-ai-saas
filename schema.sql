-- Restaurant Revenue AI - Production Core schema
-- Run in Supabase SQL editor, then set Vercel env vars:
-- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  city text,
  district text,
  type text,
  phone text,
  email text,
  website text,
  status text not null default 'trial_active',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  code text primary key,
  name text not null,
  monthly_price_xof integer not null,
  description text,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.plans (code, name, monthly_price_xof, description, features)
values
  ('starter','Starter',20000,'Menu digital, QR code, réservations simples','["Menu digital","QR code","Réservations simples","Dashboard basique"]'),
  ('growth','Growth',30000,'Réservations, commandes, livraison, paiement wallet, CRM','["Réservations avec acompte","Livraison","À emporter","Paiement wallet","CRM"]'),
  ('premium_ai','Premium AI',50000,'IA upsell, sommelier, assistant serveur et analytics avancés','["Sommelier IA","Upsell intelligent","Assistant serveur","Mémoire client","Analytics IA"]')
on conflict (code) do update set
  name = excluded.name,
  monthly_price_xof = excluded.monthly_price_xof,
  description = excluded.description,
  features = excluded.features;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  plan_code text not null references public.plans(code),
  status text not null default 'trial_active',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_started_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text,
  full_name text,
  platform_role text not null default 'restaurant_user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  category text,
  price integer not null default 0,
  photo_url text,
  delivery_enabled boolean not null default true,
  takeaway_enabled boolean not null default true,
  dine_in_enabled boolean not null default true,
  margin_rate numeric,
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  trigger_rule text,
  benefit text,
  channel text not null default 'all',
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  channel text,
  consent_marketing boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  occasion text,
  guest_count integer not null default 1,
  reservation_at timestamptz,
  deposit_amount integer not null default 0,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  order_type text not null default 'delivery',
  delivery_zone text,
  delivery_address text,
  subtotal integer not null default 0,
  delivery_fee integer not null default 0,
  total integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1,
  unit_price integer not null default 0,
  total integer not null default 0
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  provider text,
  provider_reference text,
  amount integer not null default 0,
  currency text not null default 'XOF',
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  actor_type text,
  actor_id uuid,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.restaurants enable row level security;
alter table public.subscriptions enable row level security;
alter table public.app_users enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.customers enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

-- V1 uses Vercel serverless API with SUPABASE_SERVICE_ROLE_KEY.
-- Add authenticated policies when Supabase Auth is enabled for restaurant users.
