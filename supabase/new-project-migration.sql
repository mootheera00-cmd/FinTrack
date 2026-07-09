-- =============================================================
-- FinTrack – Full Schema for "Money mootheera - Plan"
-- Project ID: pdadgaevvnluqjxjrxpp
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- =============================================================

-- ─── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Tables ───────────────────────────────────────────────────

-- 1. Profiles
create table if not exists public.profiles (
  id            uuid primary key,
  display_name  text,
  avatar_url    text,
  currency      text not null default 'THB',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Income (รายรับ)
create table if not exists public.income (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  amount     numeric(12, 2) not null check (amount > 0),
  month_key  text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Expenses (รายจ่าย)
create table if not exists public.expenses (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  amount       numeric(12, 2) not null check (amount > 0),
  month_key    text not null,
  is_recurring boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 4. Installments v2 (ผ่อนชำระ)
create table if not exists public.installments_v2 (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  description    text not null,
  total_price    numeric(12, 2) not null check (total_price > 0),
  total_months   int not null check (total_months >= 1),
  monthly_amount numeric(12, 2) not null check (monthly_amount > 0),
  start_month    text not null,
  paid_months    int not null default 0 check (paid_months >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint paid_not_exceed_total_v2 check (paid_months <= total_months)
);

-- 5. Shared Expenses (ซื้อร่วม)
create table if not exists public.shared_expenses (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  description         text not null,
  total_amount        numeric(12, 2) not null check (total_amount > 0),
  split_count         int not null default 2 check (split_count >= 2),
  my_share            numeric(12, 2) not null check (my_share > 0),
  month_key           text not null,
  include_in_expenses boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_income_user_month       on public.income(user_id, month_key);
create index if not exists idx_expenses_user_month      on public.expenses(user_id, month_key);
create index if not exists idx_installments_v2_user     on public.installments_v2(user_id);
create index if not exists idx_shared_expenses_user_month on public.shared_expenses(user_id, month_key);

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

create trigger trg_income_updated_at
  before update on public.income
  for each row execute procedure public.handle_updated_at();

create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.handle_updated_at();

create trigger trg_installments_v2_updated_at
  before update on public.installments_v2
  for each row execute procedure public.handle_updated_at();

create trigger trg_shared_expenses_updated_at
  before update on public.shared_expenses
  for each row execute procedure public.handle_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.income           enable row level security;
alter table public.expenses         enable row level security;
alter table public.installments_v2  enable row level security;
alter table public.shared_expenses  enable row level security;

-- Owner-only policies (bypass with SECURITY DEFINER functions)
create policy "owner_all" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "owner_all" on public.income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_all" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_all" on public.installments_v2
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_all" on public.shared_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- RPC Functions (SECURITY DEFINER — bypass RLS for local UUID)
-- =============================================================

-- ─── Profile ──────────────────────────────────────────────────
create or replace function public.get_or_create_profile(p_id uuid)
returns setof public.profiles
language plpgsql security definer
as $$
begin
  -- If profile doesn't exist, create it
  if not exists (select 1 from public.profiles where id = p_id) then
    insert into public.profiles (id) values (p_id);
  end if;
  return query select * from public.profiles where id = p_id;
end;
$$;

-- ─── Income ───────────────────────────────────────────────────
create or replace function public.get_incomes(p_user_id uuid)
returns setof public.income
language plpgsql security definer
as $$
begin
  return query select * from public.income where user_id = p_user_id order by created_at desc;
end;
$$;

create or replace function public.create_income(
  p_user_id uuid,
  p_name text,
  p_amount numeric,
  p_month_key text
)
returns setof public.income
language plpgsql security definer
as $$
declare
  v_id uuid;
begin
  insert into public.income (user_id, name, amount, month_key)
  values (p_user_id, p_name, p_amount, p_month_key)
  returning id into v_id;
  return query select * from public.income where id = v_id;
end;
$$;

create or replace function public.update_income(
  p_id uuid,
  p_user_id uuid,
  p_name text default null,
  p_amount numeric default null,
  p_month_key text default null
)
returns setof public.income
language plpgsql security definer
as $$
begin
  update public.income set
    name       = coalesce(p_name, name),
    amount     = coalesce(p_amount, amount),
    month_key  = coalesce(p_month_key, month_key)
  where id = p_id and user_id = p_user_id;
  return query select * from public.income where id = p_id;
end;
$$;

create or replace function public.delete_income(
  p_id uuid,
  p_user_id uuid
)
returns void
language plpgsql security definer
as $$
begin
  delete from public.income where id = p_id and user_id = p_user_id;
end;
$$;

-- ─── Expenses ─────────────────────────────────────────────────
create or replace function public.get_expenses(p_user_id uuid)
returns setof public.expenses
language plpgsql security definer
as $$
begin
  return query select * from public.expenses where user_id = p_user_id order by created_at desc;
end;
$$;

create or replace function public.create_expense(
  p_user_id uuid,
  p_name text,
  p_amount numeric,
  p_month_key text,
  p_is_recurring boolean default false
)
returns setof public.expenses
language plpgsql security definer
as $$
declare
  v_id uuid;
begin
  insert into public.expenses (user_id, name, amount, month_key, is_recurring)
  values (p_user_id, p_name, p_amount, p_month_key, p_is_recurring)
  returning id into v_id;
  return query select * from public.expenses where id = v_id;
end;
$$;

create or replace function public.update_expense(
  p_id uuid,
  p_user_id uuid,
  p_name text default null,
  p_amount numeric default null,
  p_month_key text default null,
  p_is_recurring boolean default null
)
returns setof public.expenses
language plpgsql security definer
as $$
begin
  update public.expenses set
    name         = coalesce(p_name, name),
    amount       = coalesce(p_amount, amount),
    month_key    = coalesce(p_month_key, month_key),
    is_recurring = coalesce(p_is_recurring, is_recurring)
  where id = p_id and user_id = p_user_id;
  return query select * from public.expenses where id = p_id;
end;
$$;

create or replace function public.delete_expense(
  p_id uuid,
  p_user_id uuid
)
returns void
language plpgsql security definer
as $$
begin
  delete from public.expenses where id = p_id and user_id = p_user_id;
end;
$$;

create or replace function public.toggle_expense_recurring(
  p_id uuid,
  p_user_id uuid,
  p_is_recurring boolean
)
returns void
language plpgsql security definer
as $$
begin
  update public.expenses set is_recurring = p_is_recurring
  where id = p_id and user_id = p_user_id;
end;
$$;

-- ─── Installments v2 ──────────────────────────────────────────
create or replace function public.get_installments(p_user_id uuid)
returns setof public.installments_v2
language plpgsql security definer
as $$
begin
  return query select * from public.installments_v2 where user_id = p_user_id order by created_at desc;
end;
$$;

create or replace function public.create_installment(
  p_user_id uuid,
  p_description text,
  p_total_price numeric,
  p_total_months int,
  p_monthly_amount numeric,
  p_start_month text
)
returns setof public.installments_v2
language plpgsql security definer
as $$
declare
  v_id uuid;
begin
  insert into public.installments_v2 (user_id, description, total_price, total_months, monthly_amount, start_month)
  values (p_user_id, p_description, p_total_price, p_total_months, p_monthly_amount, p_start_month)
  returning id into v_id;
  return query select * from public.installments_v2 where id = v_id;
end;
$$;

create or replace function public.update_installment(
  p_id uuid,
  p_user_id uuid,
  p_description text default null,
  p_total_price numeric default null,
  p_total_months int default null,
  p_monthly_amount numeric default null,
  p_start_month text default null
)
returns setof public.installments_v2
language plpgsql security definer
as $$
begin
  update public.installments_v2 set
    description    = coalesce(p_description, description),
    total_price    = coalesce(p_total_price, total_price),
    total_months   = coalesce(p_total_months, total_months),
    monthly_amount = coalesce(p_monthly_amount, monthly_amount),
    start_month    = coalesce(p_start_month, start_month)
  where id = p_id and user_id = p_user_id;
  return query select * from public.installments_v2 where id = p_id;
end;
$$;

create or replace function public.delete_installment(
  p_id uuid,
  p_user_id uuid
)
returns void
language plpgsql security definer
as $$
begin
  delete from public.installments_v2 where id = p_id and user_id = p_user_id;
end;
$$;

create or replace function public.mark_installment_paid(
  p_id uuid,
  p_user_id uuid
)
returns void
language plpgsql security definer
as $$
begin
  update public.installments_v2
  set paid_months = paid_months + 1
  where id = p_id and user_id = p_user_id
    and paid_months < total_months;
end;
$$;

-- ─── Shared Expenses ──────────────────────────────────────────
create or replace function public.get_shared_expenses(p_user_id uuid)
returns setof public.shared_expenses
language plpgsql security definer
as $$
begin
  return query select * from public.shared_expenses where user_id = p_user_id order by created_at desc;
end;
$$;

create or replace function public.create_shared_expense(
  p_user_id uuid,
  p_description text,
  p_total_amount numeric,
  p_split_count int,
  p_my_share numeric,
  p_month_key text
)
returns setof public.shared_expenses
language plpgsql security definer
as $$
declare
  v_id uuid;
begin
  insert into public.shared_expenses (user_id, description, total_amount, split_count, my_share, month_key)
  values (p_user_id, p_description, p_total_amount, p_split_count, p_my_share, p_month_key)
  returning id into v_id;
  return query select * from public.shared_expenses where id = v_id;
end;
$$;

create or replace function public.update_shared_expense(
  p_id uuid,
  p_user_id uuid,
  p_description text default null,
  p_total_amount numeric default null,
  p_split_count int default null,
  p_my_share numeric default null,
  p_month_key text default null,
  p_include_in_expenses boolean default null
)
returns setof public.shared_expenses
language plpgsql security definer
as $$
begin
  update public.shared_expenses set
    description         = coalesce(p_description, description),
    total_amount        = coalesce(p_total_amount, total_amount),
    split_count         = coalesce(p_split_count, split_count),
    my_share            = coalesce(p_my_share, my_share),
    month_key           = coalesce(p_month_key, month_key),
    include_in_expenses = coalesce(p_include_in_expenses, include_in_expenses)
  where id = p_id and user_id = p_user_id;
  return query select * from public.shared_expenses where id = p_id;
end;
$$;

create or replace function public.delete_shared_expense(
  p_id uuid,
  p_user_id uuid
)
returns void
language plpgsql security definer
as $$
begin
  delete from public.shared_expenses where id = p_id and user_id = p_user_id;
end;
$$;

create or replace function public.toggle_shared_include(
  p_id uuid,
  p_user_id uuid,
  p_include boolean
)
returns void
language plpgsql security definer
as $$
begin
  update public.shared_expenses set include_in_expenses = p_include
  where id = p_id and user_id = p_user_id;
end;
$$;
