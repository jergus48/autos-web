create table if not exists users (
  id serial primary key,
  email text unique not null,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz default now()
);
create table if not exists companies (
  id serial primary key,
  owner_id int references users(id) on delete cascade,
  name text not null,
  email text, phone text, website text,
  logo_url text,
  status text default 'new',
  created_at timestamptz default now()
);
create table if not exists decks (
  id serial primary key,
  company_id int references companies(id) on delete cascade,
  lang text not null,
  research jsonb,
  slides jsonb,
  script jsonb,
  share_token text unique,
  created_at timestamptz default now()
);
create table if not exists usage_log (
  id serial primary key,
  user_id int, company_id int, tokens int default 0,
  created_at timestamptz default now()
);

alter table companies add column if not exists country text;

create or replace function dom(t text) returns text language sql immutable as $$
  select split_part(regexp_replace(lower(coalesce(t,'')),'^https?://(www\.)?',''),'/',1)
$$;

create table if not exists calls (
  id serial primary key,
  company_id int references companies(id) on delete cascade,
  user_id int references users(id) on delete set null,
  outcome text not null,
  note text,
  followup_at date,
  created_at timestamptz default now()
);
create index if not exists calls_company_idx on calls(company_id);
create index if not exists calls_user_idx on calls(user_id);
create index if not exists calls_created_idx on calls(created_at);

create table if not exists settings (
  key text primary key,
  value text
);
create table if not exists meetings (
  id serial primary key,
  company_id int references companies(id) on delete cascade,
  user_id int references users(id) on delete set null,
  event_id text,
  meet_url text,
  meet_code text,
  html_link text,
  attendee_email text,
  start_at timestamptz,
  end_at timestamptz,
  transcript text,
  transcript_state text,
  created_at timestamptz default now()
);
create index if not exists meetings_company_idx on meetings(company_id);
