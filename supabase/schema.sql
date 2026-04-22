create table if not exists tickets (
  id text primary key,
  ticket_number text,
  subject text,
  status text,
  problem text,
  department_id text,
  contact_id text,
  channel text,
  priority text,
  created_time timestamptz,
  modified_time timestamptz,
  closed_time timestamptz,
  close_hours numeric,
  raw jsonb,
  synced_at timestamptz default now()
);

create index if not exists tickets_created_time_idx on tickets (created_time);
create index if not exists tickets_status_idx on tickets (status);
create index if not exists tickets_problem_idx on tickets (problem);
create index if not exists tickets_closed_time_idx on tickets (closed_time);

create table if not exists sync_state (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
