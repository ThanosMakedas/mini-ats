-- CV upload and AI assessment of candidates.

-- A candidate's CV is stored at cvs/<customer_id>/<candidate_id>.pdf. The path is derived, never stored,
-- so a customer cannot point a candidate at another customer's file.
alter table public.candidates
  add column cv_filename text,
  add column cv_uploaded_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf']);

-- Customers reach only files in their own folder. Admins reach all.
create policy "Customers manage own CV files, admins all" on storage.objects
  for all to authenticated
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
  with check (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Results from the assess-cv edge function. Only the function (service role) writes them,
-- so a score always comes from the AI and cannot be edited by hand.
create table public.cv_assessments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  summary text not null,
  strengths text[] not null default '{}',
  gaps text[] not null default '{}',
  model text not null,
  created_at timestamptz not null default now()
);

create index cv_assessments_candidate_id_idx on public.cv_assessments (candidate_id, created_at desc);
create index cv_assessments_customer_id_idx on public.cv_assessments (customer_id);

grant select on public.cv_assessments to authenticated;
grant all on public.cv_assessments to service_role;

alter table public.cv_assessments enable row level security;

create policy "Customers read own assessments, admins all" on public.cv_assessments
  for select to authenticated
  using (customer_id = auth.uid() or public.is_admin());
