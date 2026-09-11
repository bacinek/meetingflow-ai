create extension if not exists pgcrypto;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  client_name text,
  meeting_topic text,
  summary text not null,
  key_information text[] not null default '{}',
  client_requirements text[] not null default '{}',
  decisions text[] not null default '{}',
  next_meeting text,
  follow_up_subject text,
  follow_up_body text,
  uncertainties text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  task text not null,
  responsible_person text,
  deadline_label text,
  deadline_date date,
  created_at timestamptz not null default now()
);

create index if not exists action_items_meeting_id_idx
  on public.action_items (meeting_id);

create index if not exists meetings_created_at_idx
  on public.meetings (created_at desc);

alter table public.meetings enable row level security;
alter table public.action_items enable row level security;
