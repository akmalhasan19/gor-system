-- Create api_keys table
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  key_hash text not null unique,
  name text not null,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_used_at timestamp with time zone
);

-- Secure api_keys table: Only admins can view/manage, but system functions might need to read it.
-- Actually for this PWA, we might just checking it via code with Service Role (Admin) or just a direct query if we have the rights.
-- Since this is for external access using a secret key, we usually verify it server-side.

-- Enable RLS
alter table public.api_keys enable row level security;

-- Create policy for admins (assuming we have an admins table or checking logic, 
-- but for now let's just allow service_role to do everything)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where policyname = 'Allow service_role full access' 
    and tablename = 'api_keys'
  ) then
    create policy "Allow service_role full access" on public.api_keys
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- Functions to help manage keys if needed (optional)
