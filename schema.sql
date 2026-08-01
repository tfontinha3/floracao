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
  family text,
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
  ('Heitor', true),
  ('Márico', false),
  ('Rafael', false),
  ('Alzira', false);

-- Catálogo de flor de corte, organizado por família (só flor de corte — o negócio não vende
-- plantas de vaso nem de jardim, seguindo a divisão que a própria Royal FloraHolland/VBN usa
-- no primeiro nível de classificação da indústria).
insert into flowers (name, unit, family) values
  -- Rosas
  ('Rosa Vermelha', 'molho', 'Rosas'), ('Rosa Branca', 'molho', 'Rosas'), ('Rosa Amarela', 'molho', 'Rosas'),
  ('Rosa Cor-de-Rosa', 'molho', 'Rosas'), ('Rosa Laranja', 'molho', 'Rosas'), ('Rosa Bordô', 'molho', 'Rosas'),
  ('Rosa Lilás', 'molho', 'Rosas'), ('Rosa Salmão', 'molho', 'Rosas'), ('Rosa Bicolor', 'molho', 'Rosas'),
  ('Mini Rosa', 'molho', 'Rosas'),
  -- Cravos
  ('Cravo Vermelho', 'molho', 'Cravos'), ('Cravo Branco', 'molho', 'Cravos'), ('Cravo Misto', 'molho', 'Cravos'),
  ('Cravo Rosa', 'molho', 'Cravos'), ('Cravo Amarelo', 'molho', 'Cravos'), ('Mini Cravo', 'molho', 'Cravos'),
  -- Crisântemos
  ('Crisântemo Branco', 'molho', 'Crisântemos'), ('Crisântemo Amarelo', 'molho', 'Crisântemos'),
  ('Crisântemo Bronze', 'molho', 'Crisântemos'), ('Crisântemo Lilás', 'molho', 'Crisântemos'),
  ('Crisântemo Pompom Misto', 'molho', 'Crisântemos'), ('Spray Crisântemo', 'molho', 'Crisântemos'),
  -- Gérberas
  ('Gérbera Mista', 'molho', 'Gérberas'), ('Gérbera Vermelha', 'molho', 'Gérberas'), ('Gérbera Amarela', 'molho', 'Gérberas'),
  ('Gérbera Laranja', 'molho', 'Gérberas'), ('Gérbera Rosa', 'molho', 'Gérberas'), ('Gérbera Branca', 'molho', 'Gérberas'),
  ('Mini Gérbera', 'molho', 'Gérberas'),
  -- Tulipas
  ('Tulipa Amarela', 'molho', 'Tulipas'), ('Tulipa Vermelha', 'molho', 'Tulipas'), ('Tulipa Rosa', 'molho', 'Tulipas'),
  ('Tulipa Branca', 'molho', 'Tulipas'), ('Tulipa Roxa', 'molho', 'Tulipas'), ('Tulipa Papagaio', 'molho', 'Tulipas'),
  -- Lírios
  ('Lírio Branco', 'molho', 'Lírios'), ('Lírio Tigre', 'molho', 'Lírios'), ('Lírio Casablanca', 'molho', 'Lírios'),
  ('Lírio Oriental', 'molho', 'Lírios'), ('Lírio Asiático', 'molho', 'Lírios'), ('Lírio LA Híbrido', 'molho', 'Lírios'),
  -- Orquídeas
  ('Orquídea Branca', 'molho', 'Orquídeas'), ('Orquídea Roxa', 'molho', 'Orquídeas'),
  ('Orquídea Cymbidium', 'molho', 'Orquídeas'), ('Orquídea Dendrobium', 'molho', 'Orquídeas'),
  -- Hortênsias
  ('Hortênsia Azul', 'molho', 'Hortênsias'), ('Hortênsia Branca', 'molho', 'Hortênsias'),
  ('Hortênsia Rosa', 'molho', 'Hortênsias'), ('Hortênsia Verde Antique', 'molho', 'Hortênsias'),
  -- Alstroemérias
  ('Alstroemeria Rosa', 'molho', 'Alstroemérias'), ('Alstroemeria Branca', 'molho', 'Alstroemérias'),
  ('Alstroemeria Laranja', 'molho', 'Alstroemérias'), ('Alstroemeria Amarela', 'molho', 'Alstroemérias'),
  ('Alstroemeria Roxa', 'molho', 'Alstroemérias'),
  -- Girassóis
  ('Girassol', 'molho', 'Girassóis'), ('Girassol Mini', 'molho', 'Girassóis'),
  -- Antúrios
  ('Antúrio Vermelho', 'molho', 'Antúrios'), ('Antúrio Branco', 'molho', 'Antúrios'),
  ('Antúrio Rosa', 'molho', 'Antúrios'), ('Antúrio Verde', 'molho', 'Antúrios'),
  -- Peónias
  ('Peônia Rosa', 'molho', 'Peónias'), ('Peônia Branca', 'molho', 'Peónias'), ('Peônia Vermelha', 'molho', 'Peónias'),
  -- Frésias
  ('Freesia Branca', 'molho', 'Frésias'), ('Freesia Amarela', 'molho', 'Frésias'), ('Freesia Roxa', 'molho', 'Frésias'),
  -- Margaridas/Ásteres
  ('Margarida', 'molho', 'Margaridas/Ásteres'), ('Áster Roxo', 'molho', 'Margaridas/Ásteres'),
  ('Áster Misto', 'molho', 'Margaridas/Ásteres'),
  -- Íris
  ('Íris Roxa', 'molho', 'Íris'), ('Íris Branca', 'molho', 'Íris'), ('Íris Azul', 'molho', 'Íris'),
  -- Estrelícias
  ('Estrelícia', 'molho', 'Estrelícias'),
  -- Enchimento
  ('Gypsophila Branca', 'molho', 'Enchimento'), ('Gypsophila Rosa', 'molho', 'Enchimento'),
  ('Statice Roxo', 'molho', 'Enchimento'), ('Statice Misto', 'molho', 'Enchimento'), ('Limonium', 'molho', 'Enchimento'),
  -- Ranúnculos
  ('Ranúnculo Vermelho', 'molho', 'Ranúnculos'), ('Ranúnculo Rosa', 'molho', 'Ranúnculos'),
  ('Ranúnculo Branco', 'molho', 'Ranúnculos'), ('Ranúnculo Misto', 'molho', 'Ranúnculos'),
  -- Folhagens/Verdes
  ('Feto', 'molho', 'Folhagens/Verdes'), ('Eucalipto', 'molho', 'Folhagens/Verdes'), ('Salal', 'molho', 'Folhagens/Verdes'),
  ('Aspidistra', 'molho', 'Folhagens/Verdes'), ('Samambaia', 'molho', 'Folhagens/Verdes'), ('Ruscus', 'molho', 'Folhagens/Verdes'),
  ('Folha de Monstera', 'molho', 'Folhagens/Verdes'), ('Folha de Palmeira', 'molho', 'Folhagens/Verdes'), ('Avenca', 'molho', 'Folhagens/Verdes');

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
