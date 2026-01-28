-- Create table for recurring maintenance schedules
create table if not exists public.court_maintenance_schedules (
  id uuid default gen_random_uuid() primary key,
  venue_id uuid references public.venues(id) on delete cascade not null,
  court_id uuid references public.courts(id) on delete cascade not null,
  title text not null,
  frequency_days integer not null check (frequency_days > 0),
  last_performed_at date,
  next_due_date date not null,
  is_active boolean default true,
  cost_estimate numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.court_maintenance_schedules enable row level security;

-- Policies
create policy "Users can view their venue maintenance schedules"
  on public.court_maintenance_schedules for select
  using (
    venue_id in (
      select venue_id from public.user_venues where user_id = auth.uid()
    )
  );

create policy "Users can insert their venue maintenance schedules"
  on public.court_maintenance_schedules for insert
  with check (
    venue_id in (
      select venue_id from public.user_venues where user_id = auth.uid()
    )
  );

create policy "Users can update their venue maintenance schedules"
  on public.court_maintenance_schedules for update
  using (
    venue_id in (
      select venue_id from public.user_venues where user_id = auth.uid()
    )
  );

create policy "Users can delete their venue maintenance schedules"
  on public.court_maintenance_schedules for delete
  using (
    venue_id in (
      select venue_id from public.user_venues where user_id = auth.uid()
    )
  );
