-- ============================================
-- ESQUEMA: Sistema de Encomendas de Flores
-- Corre isto inteiro no SQL Editor do Supabase
-- ============================================

create extension if not exists "pgcrypto";

create table employees (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_owner boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  phone text,
  notes text,
  created_at timestamptz default now()
);

create table flowers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text default 'molho',
  active boolean default true
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) not null,
  client_id uuid references clients(id) not null,
  flower_id uuid references flowers(id) not null,
  quantity numeric not null check (quantity > 0),
  delivery_date date not null,
  notes text,
  created_at timestamptz default now()
);

create index idx_orders_delivery_date on orders(delivery_date);
create index idx_orders_flower on orders(flower_id);
create index idx_orders_client on orders(client_id);
create index idx_orders_created_at on orders(created_at desc);

-- ============================================
-- VIEWS: agregações prontas a usar pela app
-- ============================================
create view apanhado_diario as
select
  o.delivery_date,
  f.id as flower_id,
  f.name as flower_name,
  f.unit,
  sum(o.quantity) as total_quantity,
  count(distinct o.client_id) as num_clientes,
  count(*) as num_encomendas
from orders o
join flowers f on f.id = o.flower_id
group by o.delivery_date, f.id, f.name, f.unit
order by o.delivery_date, total_quantity desc;

create view apanhado_detalhe as
select
  o.id,
  o.delivery_date,
  f.id as flower_id,
  f.name as flower_name,
  c.name as client_name,
  e.name as employee_name,
  o.quantity,
  o.notes,
  o.created_at
from orders o
join flowers f on f.id = o.flower_id
join clients c on c.id = o.client_id
join employees e on e.id = o.employee_id
order by o.created_at desc;

-- ============================================
-- ROW LEVEL SECURITY
-- Ativa RLS mas com policy aberta para já (app interna,
-- sem contas de utilizador ainda). Aperta-se mais tarde.
-- ============================================
alter table employees enable row level security;
alter table clients enable row level security;
alter table flowers enable row level security;
alter table orders enable row level security;

create policy "allow all - employees" on employees for all using (true) with check (true);
create policy "allow all - clients" on clients for all using (true) with check (true);
create policy "allow all - flowers" on flowers for all using (true) with check (true);
create policy "allow all - orders" on orders for all using (true) with check (true);

-- ============================================
-- SEED DATA — ajusta os nomes reais antes de correr
-- ============================================
insert into employees (name, is_owner) values
  ('Pai', true),
  ('Ana', false),
  ('Bruno', false),
  ('Carla', false),
  ('Miguel', false);

insert into flowers (name, unit) values
  ('Rosa Vermelha', 'molho'), ('Rosa Branca', 'molho'), ('Rosa Amarela', 'molho'), ('Rosa Cor-de-Rosa', 'molho'),
  ('Cravo Vermelho', 'molho'), ('Cravo Branco', 'molho'), ('Cravo Misto', 'molho'),
  ('Tulipa Amarela', 'molho'), ('Tulipa Vermelha', 'molho'), ('Tulipa Rosa', 'molho'),
  ('Lírio Branco', 'molho'), ('Lírio Tigre', 'molho'), ('Lírio Casablanca', 'molho'),
  ('Girassol', 'molho'), ('Crisântemo Branco', 'molho'), ('Crisântemo Amarelo', 'molho'),
  ('Gérbera Mista', 'molho'), ('Gérbera Vermelha', 'molho'), ('Orquídea Branca', 'molho'), ('Orquídea Roxa', 'molho'),
  ('Hortênsia Azul', 'molho'), ('Hortênsia Branca', 'molho'), ('Margarida', 'molho'), ('Íris Roxa', 'molho'),
  ('Antúrio Vermelho', 'molho'), ('Peônia Rosa', 'molho'), ('Estrelícia', 'molho'), ('Freesia Branca', 'molho');

-- ============================================
-- FUTURO (fase 2): Fornecedores
-- ============================================
-- create table suppliers (
--   id uuid primary key default gen_random_uuid(),
--   name text not null,
--   contact text
-- );
-- create table supplier_flowers (
--   supplier_id uuid references suppliers(id),
--   flower_id uuid references flowers(id),
--   lead_time_days int,
--   delivery_days text[],
--   primary key (supplier_id, flower_id)
-- );
