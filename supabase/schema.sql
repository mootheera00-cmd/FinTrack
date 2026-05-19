-- =============================================================
-- FinTrack – Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- =============================================================

-- ─── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── ENUM Types ───────────────────────────────────────────────
create type transaction_type as enum ('income', 'expense');

create type transaction_category as enum (
  'salary', 'freelance', 'investment', 'other_income',
  'food', 'transport', 'shopping', 'entertainment',
  'utilities', 'health', 'education', 'travel', 'other_expense'
);

-- ─── Tables ───────────────────────────────────────────────────

-- 1. Profiles (extends auth.users 1-to-1)
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  currency      text not null default 'THB',
  monthly_income numeric(12, 2) not null default 0,
  liquid_cash    numeric(12, 2) not null default 0,   -- manually tracked current cash
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Transactions (income & expenses)
create table public.transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        transaction_type not null,
  category    transaction_category not null,
  amount      numeric(12, 2) not null check (amount > 0),
  note        text,
  txn_date    date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. Credit Cards
create table public.credit_cards (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  card_name       text not null,                    -- e.g. "KBank Platinum"
  bank            text,
  last_four       char(4),                          -- last 4 digits (optional)
  statement_day   smallint not null check (statement_day between 1 and 31),  -- day of month
  due_day         smallint not null check (due_day between 1 and 31),        -- payment due day
  credit_limit    numeric(12, 2),
  color           text not null default '#3b82f6',  -- hex for card UI tint
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4. Installments (per-card recurring charges)
create table public.installments (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  credit_card_id   uuid not null references public.credit_cards(id) on delete cascade,
  description      text not null,              -- e.g. "Laptop purchase"
  total_amount     numeric(12, 2) not null check (total_amount > 0),
  monthly_amount   numeric(12, 2) not null check (monthly_amount > 0),
  total_months     smallint not null check (total_months >= 1),
  paid_months      smallint not null default 0 check (paid_months >= 0),
  start_date       date not null,              -- first billing date
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint paid_not_exceed_total check (paid_months <= total_months)
);

-- ─── Indexes ──────────────────────────────────────────────────
create index idx_transactions_user_date  on public.transactions(user_id, txn_date desc);
create index idx_transactions_user_type  on public.transactions(user_id, type);
create index idx_installments_card       on public.installments(credit_card_id);
create index idx_installments_user_active on public.installments(user_id, is_active);

-- ─── Automatic updated_at trigger ────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute procedure public.handle_updated_at();

create trigger trg_credit_cards_updated_at
  before update on public.credit_cards
  for each row execute procedure public.handle_updated_at();

create trigger trg_installments_updated_at
  before update on public.installments
  for each row execute procedure public.handle_updated_at();

-- ─── Auto-create profile on sign-up ──────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────
-- Enable RLS on every table
alter table public.profiles     enable row level security;
alter table public.transactions enable row level security;
alter table public.credit_cards enable row level security;
alter table public.installments enable row level security;

-- profiles: users can only see/edit their own row
create policy "profiles: own row only" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- transactions: full CRUD on own rows
create policy "transactions: owner access" on public.transactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- credit_cards: full CRUD on own rows
create policy "credit_cards: owner access" on public.credit_cards
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- installments: full CRUD on own rows
create policy "installments: owner access" on public.installments
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Useful Views ─────────────────────────────────────────────

-- Monthly summary per user (income vs. expense)
create or replace view public.monthly_summary as
select
  user_id,
  date_trunc('month', txn_date)::date as month,
  type,
  sum(amount) as total
from public.transactions
group by user_id, month, type;

-- Active installments with remaining months and card info
create or replace view public.active_installments_view as
select
  i.id,
  i.user_id,
  i.description,
  i.monthly_amount,
  i.total_months,
  i.paid_months,
  (i.total_months - i.paid_months) as remaining_months,
  i.start_date,
  c.card_name,
  c.statement_day,
  c.due_day,
  c.color as card_color
from public.installments i
join public.credit_cards c on c.id = i.credit_card_id
where i.is_active = true
  and i.paid_months < i.total_months;

-- Per-card upcoming bill (installments due in next billing cycle)
create or replace view public.upcoming_card_bills as
select
  c.id as card_id,
  c.user_id,
  c.card_name,
  c.statement_day,
  c.due_day,
  c.color,
  coalesce(sum(i.monthly_amount), 0) as total_installment_due
from public.credit_cards c
left join public.installments i
  on i.credit_card_id = c.id
  and i.is_active = true
  and i.paid_months < i.total_months
where c.is_active = true
group by c.id, c.user_id, c.card_name, c.statement_day, c.due_day, c.color;
