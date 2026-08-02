-- ============================================================
-- CATÁLOGO v3 — o que o Heitor confirmou da folha
-- ============================================================
-- Corre no SQL Editor do Supabase. **Não precisa de deploy**: só mexe em
-- dados, não no schema. A app apanha as flores novas no próximo arranque.
--
-- Origem: leitura da folha corrigida pelo Tiago a 2026-08-02.
-- Transcrição atualizada em tasks/floracao/transcricao-folha-papel.md
--
-- Idempotente: podes correr duas vezes.
-- ============================================================


-- ============================================================
-- 1. GRAFIAS DELE (o nome botânico passa a alias)
-- ============================================================
-- Ele escreve Delphinea, Eryngea, Molucela — e a regra é que o nome dele
-- é o nome. Na v2 tinham entrado com a grafia botânica; corrige-se aqui.
update flowers set name = 'Delphinea', aliases = array['Delphinium']             where name = 'Delphinium';
update flowers set name = 'Eryngea',   aliases = array['Eryngium', 'Cardo']      where name = 'Eryngium';
update flowers set name = 'Molucela',  aliases = array['Moluccella', 'Campainhas'] where name = 'Moluccella';

-- Peónia em português de Portugal (estava com a grafia brasileira "Peônia").
update flowers
   set name = replace(name, 'Peônia', 'Peónia'),
       aliases = aliases || array[name, 'Paeonia']
 where name like 'Peônia%';


-- ============================================================
-- 2. VARIEDADES E CORES QUE FALTAVAM
-- ============================================================

-- ---------- Rosas: ele regista pelo nome, não pela cor ----------
insert into flowers (name, unit, family, aliases) values
  ('Rosa Twilight', 'caixa', 'Rosas', array['Twilight']),
  ('Rosa Fucsia',   'caixa', 'Rosas', array['Fucsia', 'Fúcsia']),
  ('Rosa Fruteto',  'caixa', 'Rosas', array['Fruteto']),
  ('Rosa Fogo',     'caixa', 'Rosas', array['Fogo'])
on conflict (name) do nothing;

-- ---------- Margaridas ----------
insert into flowers (name, unit, family, aliases) values
  ('Margarida Abelha', 'caixa', 'Margaridas/Ásteres', array['Abelha']),
  ('Margarida Fogo',   'caixa', 'Margaridas/Ásteres', '{}'),
  ('Margarida Bordô',  'caixa', 'Margaridas/Ásteres', array['Margarida Bordo'])
on conflict (name) do nothing;

-- ---------- Antúrios: variedades pelo nome comercial ----------
-- "Essência" corrige a minha leitura anterior ("esmeralda") e
-- "Terra" corrige "Torea".
insert into flowers (name, unit, family, aliases) values
  ('Antúrio Terra',    'caixa', 'Antúrios', array['Terra']),
  ('Antúrio Essência', 'caixa', 'Antúrios', array['Essencia', 'Essência']),
  ('Antúrio Prévia',   'caixa', 'Antúrios', array['Previa', 'Prévia']),
  ('Antúrio Azul',     'caixa', 'Antúrios', '{}')
on conflict (name) do nothing;

-- ---------- Folhagens e restantes ----------
insert into flowers (name, unit, family, aliases) values
  ('Arálea Matiz',       'caixa', 'Folhagens/Verdes', array['Matiz']),
  ('Fita d''Água',       'caixa', 'Folhagens/Verdes', array['Fita de Agua', 'Fita de Água']),
  ('Espadas',            'caixa', 'Folhagens/Verdes', '{}'),
  ('Jarro',              'caixa', 'Jarros',           array['Zantedeschia', 'Copo-de-leite']),
  ('Orquídea Champanhe', 'caixa', 'Orquídeas',        array['Champanhe'])
on conflict (name) do nothing;


-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- (a) As 16 entradas novas — esperado: 16 linhas.
select name, family from flowers
where name in (
  'Rosa Twilight','Rosa Fucsia','Rosa Fruteto','Rosa Fogo',
  'Margarida Abelha','Margarida Fogo','Margarida Bordô',
  'Antúrio Terra','Antúrio Essência','Antúrio Prévia','Antúrio Azul',
  'Arálea Matiz','Fita d''Água','Espadas','Jarro','Orquídea Champanhe'
) order by family, name;

-- (b) As grafias dele — esperado: Delphinea, Eryngea, Molucela, 3x Peónia.
select name, aliases from flowers
where name in ('Delphinea','Eryngea','Molucela') or name like 'Peónia%'
order by name;

-- (c) Total do catálogo — esperado: 134 (118 + 16).
select count(*) as total_flores from flowers where active;
