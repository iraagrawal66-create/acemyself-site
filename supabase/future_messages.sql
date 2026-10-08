-- Dear Future Me: run once in Supabase -> SQL Editor.
create table if not exists public.future_messages (
  id            uuid primary key default gen_random_uuid(),
  message       text not null check (char_length(btrim(message)) between 1 and 5000),
  email         text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at    timestamptz not null default now(),
  delivery_date date not null,
  status        text not null default 'scheduled' check (status in ('scheduled','sent','failed'))
);

-- For the future sender job: quickly find what is due.
create index if not exists future_messages_due_idx on public.future_messages (status, delivery_date);

alter table public.future_messages enable row level security;

-- Visitors (publishable/anon key) may ONLY insert. No select/update/delete grants or policies exist.
revoke all on public.future_messages from anon, authenticated;
grant insert on public.future_messages to anon;

drop policy if exists "anon can leave a future message" on public.future_messages;
create policy "anon can leave a future message"
  on public.future_messages for insert to anon
  with check (
    status = 'scheduled'
    and delivery_date between (current_date + interval '5 months') and (current_date + interval '7 months')
  );

-- Later (not now): a server-side scheduled job using the service-role key (kept on the server, never in the site)
-- reads rows where status = 'scheduled' and delivery_date <= current_date, sends them, then sets status = 'sent'.
