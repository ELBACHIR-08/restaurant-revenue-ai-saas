-- Restaurant Revenue AI - Production Core V2 Supabase schema
-- Run this in Supabase SQL Editor, then add env vars in Vercel.

create extension if not exists "pgcrypto";

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  price_monthly_xof integer not null,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.plans (code, name, price_monthly_xof, features)
values
  ('starter', 'Starter', 20000, '["Menu digital", "QR code", "Réservations simples", "Dashboard basique"]'),
  ('growth', 'Growth', 30000, '["Réservations avec acompte", "Commande livraison", "Promotions", "CRM", "Paiements wallet ready"]'),
  ('premium_ai', 'Premium AI', 50000, '["Sommelier IA", "Assistant serveur", "Mémoire client", "Analytics IA", "Support prioritaire"]')
on conflict (code) do update set name = excluded.name, price_monthly_xof = excluded.price_monthly_xof, features = excluded.features;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  phone text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  city text,
  district text,
  type text,
  owner_name text,
  owner_email text,
  owner_phone text,
  status text not null default 'trial' check (status in ('trial','active','suspended','cancelled')),
  modules text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','server','kitchen','marketing','accountant')),
  status text not null default 'active' check (status in ('active','invited','disabled')),
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table if not exists public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  onboarding_status text not null default 'started',
  menu_source text,
  modules text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  plan_id uuid references public.plans(id),
  status text not null check (status in ('trial_active','trial_expired','active','past_due','suspended','cancelled')),
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  payment_provider text,
  last_payment_at timestamptz,
  next_billing_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price integer not null check (price >= 0),
  status text not null default 'available' check (status in ('available','hidden','sold_out')),
  image_url text,
  dine_in_enabled boolean not null default true,
  delivery_enabled boolean not null default false,
  takeaway_enabled boolean not null default true,
  preparation_time integer,
  tags text[] not null default '{}',
  allergens text[] not null default '{}',
  margin_estimate numeric,
  upsell_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  channel text not null default 'chatbot',
  discount_type text not null default 'gift',
  value integer not null default 0,
  status text not null default 'active' check (status in ('draft','active','paused','expired')),
  starts_at timestamptz,
  ends_at timestamptz,
  rule_summary text,
  trigger_context text,
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
  preferences jsonb not null default '{}'::jsonb,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.customers(id),
  occasion text,
  party_size integer,
  reservation_date date,
  reservation_time time,
  status text not null default 'pending',
  deposit_amount integer not null default 0,
  contact_method text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.customers(id),
  order_type text not null check (order_type in ('delivery','takeaway','dine_in')),
  status text not null default 'pending',
  subtotal integer not null default 0,
  delivery_fee integer not null default 0,
  total integer not null default 0,
  address text,
  zone text,
  payment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  name text not null,
  quantity integer not null default 1,
  unit_price integer not null default 0,
  total_price integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id),
  subscription_id uuid references public.subscriptions(id),
  order_id uuid references public.orders(id),
  reservation_id uuid references public.reservations(id),
  provider text,
  provider_reference text,
  payment_type text not null default 'subscription',
  amount integer not null,
  currency text not null default 'XOF',
  status text not null default 'pending',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  label text not null,
  qr_type text not null default 'table',
  table_number text,
  url text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.customers(id),
  channel text not null default 'site',
  intent text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_by uuid references auth.users(id),
  title text not null,
  report_type text not null default 'performance_ai',
  metrics jsonb not null default '{}'::jsonb,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  title text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id),
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_members_user on public.restaurant_members(user_id);
create index if not exists idx_products_restaurant on public.products(restaurant_id);
create index if not exists idx_promotions_restaurant on public.promotions(restaurant_id);
create index if not exists idx_customers_restaurant on public.customers(restaurant_id);
create index if not exists idx_orders_restaurant on public.orders(restaurant_id);
create index if not exists idx_reservations_restaurant on public.reservations(restaurant_id);
create index if not exists idx_reports_restaurant on public.reports(restaurant_id);

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.customers enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.qr_codes enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reports enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_platform_admin(uid uuid)
returns boolean language sql stable security definer as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.is_platform_admin = true)
$$;

create or replace function public.is_restaurant_member(resto uuid, uid uuid)
returns boolean language sql stable security definer as $$
  select exists(select 1 from public.restaurant_members m where m.restaurant_id = resto and m.user_id = uid and m.status = 'active')
$$;

create or replace function public.restaurant_role(resto uuid, uid uuid)
returns text language sql stable security definer as $$
  select role from public.restaurant_members m where m.restaurant_id = resto and m.user_id = uid and m.status = 'active' limit 1
$$;

-- Read own profile; platform admin can read all
create policy "profiles_read" on public.profiles for select using (auth.uid() = id or public.is_platform_admin(auth.uid()));
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Restaurant access
create policy "restaurants_member_read" on public.restaurants for select using (public.is_restaurant_member(id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "restaurants_member_update" on public.restaurants for update using (public.restaurant_role(id, auth.uid()) in ('owner','manager') or public.is_platform_admin(auth.uid()));

create policy "members_read" on public.restaurant_members for select using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "members_manage_owner" on public.restaurant_members for all using (public.restaurant_role(restaurant_id, auth.uid()) = 'owner' or public.is_platform_admin(auth.uid())) with check (public.restaurant_role(restaurant_id, auth.uid()) = 'owner' or public.is_platform_admin(auth.uid()));

-- Generic restaurant-scoped policies
create policy "settings_member" on public.restaurant_settings for all using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "subscriptions_member_read" on public.subscriptions for select using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "products_member" on public.products for all using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "promotions_member" on public.promotions for all using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "customers_member" on public.customers for all using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "reservations_member" on public.reservations for all using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "orders_member" on public.orders for all using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "payments_member" on public.payments for select using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "qrcodes_member" on public.qr_codes for all using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "chat_sessions_member" on public.chat_sessions for all using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "reports_member" on public.reports for all using (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "support_member" on public.support_tickets for all using (restaurant_id is null or public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())) with check (restaurant_id is null or public.is_restaurant_member(restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid()));
create policy "audit_read_admin" on public.audit_logs for select using (public.is_platform_admin(auth.uid()) or public.is_restaurant_member(restaurant_id, auth.uid()));

-- Order items inherit order visibility
create policy "order_items_member" on public.order_items for all using (
  exists(select 1 from public.orders o where o.id = order_id and (public.is_restaurant_member(o.restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())))
) with check (
  exists(select 1 from public.orders o where o.id = order_id and (public.is_restaurant_member(o.restaurant_id, auth.uid()) or public.is_platform_admin(auth.uid())))
);

-- Plans are public readable to authenticated users
create policy "plans_read" on public.plans for select using (true);
