create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.grant_admin_on_signup()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if lower(new.email) = 'admin@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.grant_admin_on_signup();
insert into public.user_roles(user_id, role) select id, 'admin' from auth.users where lower(email)='admin@gmail.com' on conflict do nothing;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  poster_url text,
  starts_at timestamptz not null,
  venue text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'usd',
  capacity integer not null default 100 check (capacity >= 0),
  tickets_sold integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "Public reads published events" on public.events for select to anon, authenticated using (published = true);
create policy "Admins read all events" on public.events for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins insert events" on public.events for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "Admins update events" on public.events for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins delete events" on public.events for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  stripe_session_id text not null unique,
  buyer_name text,
  buyer_email text,
  quantity integer not null,
  amount_cents integer not null,
  currency text not null,
  ticket_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  created_at timestamptz not null default now()
);
grant select on public.tickets to authenticated;
grant all on public.tickets to service_role;
alter table public.tickets enable row level security;
create policy "Admins read tickets" on public.tickets for select to authenticated using (public.has_role(auth.uid(),'admin'));