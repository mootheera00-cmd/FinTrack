-- =============================================================
-- FinTrack – Add Recurring Expenses (รายจ่ายประจำ)
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- =============================================================

-- Create table for Recurring Expenses
create table if not exists public.recurring_expenses (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  description   text not null,
  amount        numeric(12, 2) not null check (amount > 0),
  category      transaction_category not null default 'other_expense',
  due_day       smallint not null check (due_day between 1 and 31),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for querying active recurring expenses per user
create index if not exists idx_recurring_expenses_user_active on public.recurring_expenses(user_id, is_active);

-- Automatic updated_at trigger
create or replace trigger trg_recurring_expenses_updated_at
  before update on public.recurring_expenses
  for each row execute procedure public.handle_updated_at();

-- Enable RLS
alter table public.recurring_expenses enable row level security;

-- Owner-only CRUD policy
create policy "recurring_expenses: owner access" on public.recurring_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
