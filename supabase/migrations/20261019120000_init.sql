-- Mini-ATS initial schema: profiles, jobs, candidates and row level security.

create type public.user_role as enum ('admin', 'customer');
create type public.job_status as enum ('open', 'closed');
create type public.candidate_stage as enum ('new', 'screening', 'interview', 'offer', 'hired', 'rejected');

-- One row per auth user. A customer account represents one company.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'customer',
  full_name text not null default '',
  company_name text,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  location text not null default '',
  status public.job_status not null default 'open',
  created_at timestamptz not null default now(),
  -- Lets candidates reference (id, customer_id) so a candidate can never point at another customer's job.
  unique (id, customer_id)
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null,
  full_name text not null check (length(trim(full_name)) > 0),
  email text not null default '',
  phone text not null default '',
  linkedin_url text not null default '',
  notes text not null default '',
  stage public.candidate_stage not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (job_id, customer_id) references public.jobs (id, customer_id) on delete cascade
);

create index jobs_customer_id_idx on public.jobs (customer_id);
create index candidates_customer_id_idx on public.candidates (customer_id);
create index candidates_job_id_idx on public.candidates (job_id);

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger candidates_set_updated_at
  before update on public.candidates
  for each row execute function public.set_updated_at();

-- Creates the profile when an auth user is created. The role comes from app_metadata,
-- which only the service role can set, so a user can never make themselves admin.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, role, full_name, company_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'customer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;

-- Profiles are created by the trigger and edited by admins only.
create policy "Read own profile or any as admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Admins update profiles" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Customers own their jobs and candidates. Admins can act on behalf of any customer.
create policy "Customers manage own jobs, admins all" on public.jobs
  for all to authenticated
  using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

create policy "Customers manage own candidates, admins all" on public.candidates
  for all to authenticated
  using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());
