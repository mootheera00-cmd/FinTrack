-- =============================================================
-- FinTrack v2 Migration
-- New tables: income, expenses, installments_v2, shared_expenses
-- Run in Supabase SQL Editor
-- =============================================================

-- ─── income ──────────────────────────────────────────────────
create table if not exists public.income (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  amount     numeric(12, 2) not null check (amount > 0),
  month_key  text not null,  -- format: YYYY-MM
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_income_user_month on public.income(user_id, month_key);

create trigger trg_income_updated_at
  before update on public.income
  for each row execute procedure public.handle_updated_at();

alter table public.income enable row level security;

create policy "income: owner access" on public.income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─── expenses ─────────────────────────────────────────────────
create table if not exists public.expenses (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  amount       numeric(12, 2) not null check (amount > 0),
  month_key    text not null,  -- format: YYYY-MM
  is_recurring boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_expenses_user_month on public.expenses(user_id, month_key);

create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.handle_updated_at();

alter table public.expenses enable row level security;

create policy "expenses: owner access" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─── installments_v2 (no credit card dependency) ──────────────
create table if not exists public.installments_v2 (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  description    text not null,
  total_price    numeric(12, 2) not null check (total_price > 0),
  total_months   int not null check (total_months >= 1),
  monthly_amount numeric(12, 2) not null check (monthly_amount > 0),
  start_month    text not null,  -- format: YYYY-MM
  paid_months    int not null default 0 check (paid_months >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint paid_not_exceed_total_v2 check (paid_months <= total_months)
);

create index if not exists idx_installments_v2_user on public.installments_v2(user_id);

create trigger trg_installments_v2_updated_at
  before update on public.installments_v2
  for each row execute procedure public.handle_updated_at();

alter table public.installments_v2 enable row level security;

create policy "installments_v2: owner access" on public.installments_v2
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─── shared_expenses ──────────────────────────────────────────
create table if not exists public.shared_expenses (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  description         text not null,
  total_amount        numeric(12, 2) not null check (total_amount > 0),
  split_count         int not null default 2 check (split_count >= 2),
  my_share            numeric(12, 2) not null check (my_share > 0),
  month_key           text not null,  -- format: YYYY-MM
  include_in_expenses boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_shared_expenses_user_month on public.shared_expenses(user_id, month_key);

create trigger trg_shared_expenses_updated_at
  before update on public.shared_expenses
  for each row execute procedure public.handle_updated_at();

alter table public.shared_expenses enable row level security;

create policy "shared_expenses: owner access" on public.shared_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
