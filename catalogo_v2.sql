-- ============================================================
-- CATÁLOGO v2 — a língua do Heitor
-- ============================================================
-- Corre isto INTEIRO no SQL Editor do Supabase, e SÓ DEPOIS faz o deploy
-- do frontend. A ordem importa: a app nova lê a coluna `aliases`, que é
-- criada aqui. Se fizeres deploy primeiro, a app parte para toda a gente.
--
-- Origem: folha "MADRINHAS 2025" do Heitor, transcrita em
--   tasks/floracao/transcricao-folha-papel.md
--
-- TRÊS MUDANÇAS
--   1. A unidade do negócio passa a ser a CAIXA, em tudo.
--   2. O catálogo passa a usar os nomes que o Heitor e os clientes usam.
--      Os nomes técnicos ficam como alias, para a pesquisa os encontrar.
--   3. Entram 9 flores que faltavam.
--
-- Idempotente: podes correr duas vezes.
-- ============================================================


-- ============================================================
-- 1. TUDO EM CAIXAS
-- ============================================================
alter table flowers alter column unit set default 'caixa';
update flowers set unit = 'caixa' where unit is distinct from 'caixa';


-- ============================================================
-- 2. ALIASES + NOMES DELE
-- ============================================================
alter table flowers add column if not exists aliases text[] not null default '{}';

-- Índice para a pesquisa por alias não degradar à medida que o catálogo cresce.
create index if not exists idx_flowers_aliases on flowers using gin (aliases);

-- ---------- renomear para o nome dele, guardando o técnico como alias ----------
-- Nota: `name` é unique, por isso cada update só pega se o nome antigo ainda
-- lá estiver — o que torna o script seguro de repetir.
update flowers set name = 'Estoma',       aliases = array['Lisianthus']              where name = 'Lisianthus';
update flowers set name = 'Arálea',       aliases = array['Arália']                  where name = 'Arália';
update flowers set name = 'Triferne',     aliases = array['Trifene']                 where name = 'Trifene';
update flowers set name = 'Anthirrinium', aliases = array['Antirrhinum']             where name = 'Antirrhinum';
update flowers set name = 'Feto Blue',    aliases = array['Feto Azul']               where name = 'Feto Azul';
update flowers set name = 'Leucadendro',  aliases = array['Leucadendron']            where name = 'Leucadendron';
update flowers set name = 'Snakgrass',    aliases = array['Snakegrass']              where name = 'Snakegrass';
update flowers set name = 'Roebellini',   aliases = array['Folha de Roebellini']     where name = 'Folha de Roebellini';
update flowers set name = 'Monstera',     aliases = array['Folha de Monstera']       where name = 'Folha de Monstera';
update flowers set name = 'Bambú',        aliases = array['Bambu']                   where name = 'Bambu';

-- ---------- Lírios → Lilium ----------
-- No papel ele escreve LILIUM, nunca "lírio". Muda-se o nome e a família,
-- e o nome antigo fica pesquisável.
update flowers
   set name = replace(name, 'Lírio', 'Lilium'),
       family = 'Lilium',
       aliases = array[name]
 where name like 'Lírio%';

-- ---------- aliases extra, sem renomear ----------
-- Nomes por que também lhes chamam, mas que não substituem o nome principal.
update flowers set aliases = aliases || array['Boca-de-leão']  where name = 'Anthirrinium';
update flowers set aliases = aliases || array['Cardo']         where name = 'Eryngium';
update flowers set aliases = aliases || array['Campainhas']    where name = 'Moluccella';
update flowers set aliases = aliases || array['Gipsófila']     where name like 'Gypsophila%';
update flowers set aliases = aliases || array['Estrelitzia']   where name = 'Estrelícia';


-- ============================================================
-- 3. FLORES QUE FALTAVAM
-- ============================================================
-- Só o que foi lido da folha com confiança alta. Ficaram de fora, à espera
-- de confirmação do Heitor: "Wax bordia", "Passeia", "Brelios", "Esquentos",
-- "Dancearia", "Espadas", "Fita d'água", "Lasso".
insert into flowers (name, unit, family, aliases) values
  ('Moluccella',            'caixa', 'Enchimento', array['Campainhas']),
  ('Eryngium',              'caixa', 'Enchimento', array['Cardo']),
  ('Delphinium',            'caixa', 'Delphinium', '{}'),
  ('Amaryllis',             'caixa', 'Amaryllis',  array['Hippeastrum']),
  ('Orquídea Phalaenopsis', 'caixa', 'Orquídeas',  array['Phalaenopsis'])
on conflict (name) do nothing;

-- Variedades de rosa: ele regista pelo nome comercial, não pela cor.
insert into flowers (name, unit, family, aliases) values
  ('Rosa Tiffany',     'caixa', 'Rosas', array['Tiffany']),
  ('Rosa Deep Purple', 'caixa', 'Rosas', array['Deep Purple']),
  ('Rosa Paloma',      'caixa', 'Rosas', array['Paloma']),
  ('Rosa Esperance',   'caixa', 'Rosas', array['Esperance'])
on conflict (name) do nothing;


-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- (a) Nenhuma flor deve ficar fora de 'caixa' — esperado: 0 linhas.
select name, unit from flowers where unit is distinct from 'caixa';

-- (b) Os nomes dele, com o técnico ao lado — esperado: 10 linhas + os Lilium.
select name, family, aliases
from flowers
where aliases <> '{}'
order by family, name;

-- (c) Total do catálogo — esperado: 118 (109 + 9).
select count(*) as total_flores from flowers where active;
