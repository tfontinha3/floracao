-- ============================================================
-- HARDENING RLS — Fase 1: tirar o poder de destruir
-- ============================================================
-- Corre isto inteiro no SQL Editor do Supabase.
-- É idempotente: podes correr duas vezes sem problema.
--
-- O QUE ISTO FAZ
-- Substitui as policies "for all using (true)" por policies por operação,
-- alinhadas com o que a app realmente faz:
--
--   employees  SELECT                  (a app só lê a lista)
--   flowers    SELECT                  (catálogo só de consulta)
--   clients    SELECT + INSERT         (getOrCreateClientId)
--   orders     SELECT + INSERT         (SELECT é preciso para o Realtime)
--
-- Ninguém — nem a app, nem um atacante com a anon key — passa a poder
-- fazer UPDATE ou DELETE em nada. O catálogo de 109 flores e o apanhado
-- de um dia de pico deixam de poder ser apagados a partir do browser.
--
-- O QUE ISTO **NÃO** FAZ
-- Não impede LER os dados nem INSERIR encomendas falsas. Isso é
-- impossível sem autenticação a sério: a anon key está no bundle JS,
-- à vista de qualquer visitante do site. Fase 2 = Supabase Auth.
-- ============================================================

-- ---------- employees: só leitura ----------
drop policy if exists "allow all - employees" on employees;
drop policy if exists "employees: select" on employees;

create policy "employees: select" on employees
  for select to anon, authenticated
  using (true);

-- ---------- flowers: só leitura ----------
drop policy if exists "allow all - flowers" on flowers;
drop policy if exists "flowers: select" on flowers;

create policy "flowers: select" on flowers
  for select to anon, authenticated
  using (true);

-- ---------- clients: ler e criar, nunca alterar/apagar ----------
drop policy if exists "allow all - clients" on clients;
drop policy if exists "clients: select" on clients;
drop policy if exists "clients: insert" on clients;

create policy "clients: select" on clients
  for select to anon, authenticated
  using (true);

create policy "clients: insert" on clients
  for insert to anon, authenticated
  with check (length(trim(name)) > 0);

-- ---------- orders: ler e criar, nunca alterar/apagar ----------
-- O SELECT é obrigatório: o Realtime (postgres_changes) respeita o RLS,
-- e sem SELECT em orders o apanhado deixa de atualizar sozinho.
drop policy if exists "allow all - orders" on orders;
drop policy if exists "orders: select" on orders;
drop policy if exists "orders: insert" on orders;

create policy "orders: select" on orders
  for select to anon, authenticated
  using (true);

create policy "orders: insert" on orders
  for insert to anon, authenticated
  with check (quantity > 0);

-- ============================================================
-- VIEWS: fazer com que respeitem o RLS
-- ============================================================
-- Armadilha clássica do Supabase: uma view corre com os privilégios de
-- quem a criou (o owner), portanto IGNORA o RLS das tabelas por baixo.
-- Hoje isso não muda nada (anon já pode ler tudo), mas se não se corrigir
-- agora, na fase 2 fecha-se o RLS em `orders` e os dados continuam a sair
-- inteiros por estas duas views — a proteção seria uma ilusão.
--
-- security_invoker faz a view correr com as permissões de quem a consulta.
-- Requer Postgres 15+ (qualquer projeto Supabase atual tem).
alter view apanhado_diario set (security_invoker = on);
alter view apanhado_detalhe set (security_invoker = on);

-- ============================================================
-- VERIFICAÇÃO — corre isto a seguir e confere o resultado
-- ============================================================
-- Esperado: 6 linhas, nenhuma com cmd = UPDATE ou DELETE, e nenhuma
-- policy chamada "allow all - ...".
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
