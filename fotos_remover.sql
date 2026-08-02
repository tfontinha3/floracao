-- ============================================================
-- REMOVER as colunas das fotos do catálogo
-- ============================================================
-- ⚠️ CORRE ISTO **DEPOIS** DO DEPLOY, nunca antes.
--
-- A ordem é ao contrário do costume. Ao ACRESCENTAR uma coluna, o SQL vai
-- primeiro (senão a app pede algo que não existe). Ao REMOVER, o deploy vai
-- primeiro: enquanto houver um telemóvel a correr a versão antiga da app,
-- ela ainda pede image_file ao Supabase, e sem a coluna recebe um erro que
-- lhe tapa o ecrã todo.
--
-- Se tiveres dúvidas, não corras. As colunas vazias não incomodam ninguém —
-- isto é só arrumação.
--
-- Contexto: as fotos foram adicionadas e retiradas a 2026-08-02. Uma foto
-- genérica da família aparecia à frente de variedades específicas (uma rosa
-- vermelha qualquer na "Rosa Tiffany"), e isso podia confundir o Heitor em
-- vez de o ajudar.
-- ============================================================

alter table flowers drop column if exists image_file;
alter table flowers drop column if exists image_credit;

-- Verificação: nenhuma das duas deve aparecer.
select column_name
from information_schema.columns
where table_name = 'flowers'
order by ordinal_position;
