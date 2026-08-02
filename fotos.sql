-- ============================================================
-- FOTOS DO CATÁLOGO
-- ============================================================
-- Corre no SQL Editor do Supabase, e faz deploy do frontend a seguir
-- (a ordem é sempre: SQL primeiro, deploy depois).
--
-- UMA FOTO POR FAMÍLIA, herdada por todas as flores dessa família.
-- Não é por variedade de propósito: procurar "Margarida Abelha" no
-- Wikimedia devolve a foto de uma abelha numa margarida, e "Antúrio
-- Terra" devolve um PDF de herbário. Foto errada é pior que nenhuma.
--
-- As imagens estão em public/flores/ e são servidas pelo próprio site.
-- Não se hotlinka o Wikimedia: o upload.wikimedia.org responde 429
-- ("robot policy") a pedidos em volume, e a app do Heitor ficaria à
-- mercê de um host que nos pode cortar a meio de um dia de trabalho.
-- Guarda-se só o nome do ficheiro, não um caminho — assim continua a
-- funcionar se o site sair do subpath /floracao/ (ex.: Cloudflare).
--
-- Licenças CC0 / CC BY / CC BY-SA / domínio público, com a atribuição
-- em image_credit e mostrada no catálogo, que é o que a licença exige.
--
-- Se um dia houver fotos do stock real — melhor opção, porque mostra a
-- flor que ele vende mesmo — é só trocar os ficheiros em public/flores/.
--
-- Idempotente.
-- ============================================================

alter table flowers add column if not exists image_file   text;
alter table flowers add column if not exists image_credit text;

-- Alstroemérias: File:Alstroemeria aurantiaca.jpg
update flowers set image_file = 'alstroemerias.jpg', image_credit = 'JJ Harrison (https://www.jjharrison.com.au/) / CC BY-SA 3.0 / Wikimedia Commons' where family = 'Alstroemérias';

-- Amaryllis: File:Amaryllis -- Hippeastrum 'Kolibri'.jpg
update flowers set image_file = 'amaryllis.jpg', image_credit = 'Jim Evans / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Amaryllis';

-- Antirrhinum: File:Antirrhinum majus San Antonio.jpg
update flowers set image_file = 'antirrhinum.jpg', image_credit = 'Ianaré Sévi / CC BY-SA 3.0 / Wikimedia Commons' where family = 'Antirrhinum';

-- Antúrios: File:Anthurium andraeanum spathe blueing.jpg
update flowers set image_file = 'anturios.jpg', image_credit = 'Hung Ting / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Antúrios';

-- Cravos: File:Pinks (Dianthus Caryophyllus), from the Flowers series for Old Judge Cigarettes MET DP822019.jpg
update flowers set image_file = 'cravos.jpg', image_credit = 'Goodwin &amp; Company / Geo. S. Harris and Sons / CC0 / Wikimedia Commons' where family = 'Cravos';

-- Crisântemos: File:Chrysantheme rot tautropfen -20191024-RM-102058.jpg
update flowers set image_file = 'crisantemos.jpg', image_credit = 'Ermell / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Crisântemos';

-- Decorativos: File:Ornamental pineapple flower Ananas comosus Padang Indonesia 2026.jpg
update flowers set image_file = 'decorativos.jpg', image_credit = 'Undeka 11 / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Decorativos';

-- Delphinium: File:Delphinium elatum-20200616-RM-080831.jpg
update flowers set image_file = 'delphinium.jpg', image_credit = 'Ermell / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Delphinium';

-- Enchimento: File:Gypsophila paniculata.jpg
update flowers set image_file = 'enchimento.jpg', image_credit = 'PiPi / Public domain / Wikimedia Commons' where family = 'Enchimento';

-- Estrelícias: File:Strelitzia reginae MHNT.BOT.2009.13.52.jpg
update flowers set image_file = 'estrelicias.jpg', image_credit = 'Roger Culos / CC BY-SA 3.0 / Wikimedia Commons' where family = 'Estrelícias';

-- Folhagens/Verdes: File:Silver dollar Eucalyptus.jpg
update flowers set image_file = 'folhagens-verdes.jpg', image_credit = 'Calipso03 / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Folhagens/Verdes';

-- Frésias: File:Freesia February 2013-1.jpg
update flowers set image_file = 'fresias.jpg', image_credit = 'Alvesgaspar / CC BY-SA 3.0 / Wikimedia Commons' where family = 'Frésias';

-- Gerberas: File:Gerbera jamesonii flower.jpg
update flowers set image_file = 'gerberas.jpg', image_credit = 'Marisankar Mk / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Gerberas';

-- Girassóis: File:Sonnenblume Helianthus 2.JPG
update flowers set image_file = 'girassois.jpg', image_credit = 'böhringer friedrich / CC BY-SA 2.5 / Wikimedia Commons' where family = 'Girassóis';

-- Gladíolos: File:Gladiolus (36412631742).jpg
update flowers set image_file = 'gladiolos.jpg', image_credit = 'James Johnstone from Ecclefechan, Scotland / CC BY 2.0 / Wikimedia Commons' where family = 'Gladíolos';

-- Hortênsias: File:(MHNT) Hydrangea macrophylla - inflorescence.jpg
update flowers set image_file = 'hortensias.jpg', image_credit = 'Didier Descouens / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Hortênsias';

-- Jarros: File:Zantedeschia aethiopica con fiori.jpg
update flowers set image_file = 'jarros.jpg', image_credit = 'Anna.Massini / CC BY 4.0 / Wikimedia Commons' where family = 'Jarros';

-- Lilium: File:Lilium LxO hybrid 'Triumphator'.jpg
update flowers set image_file = 'lilium.jpg', image_credit = 'Jim Evans / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Lilium';

-- Lisianthus: File:Eustoma grandiflorum purple 02.jpg
update flowers set image_file = 'lisianthus.jpg', image_credit = 'desconhecido / CC BY-SA 2.0 / Wikimedia Commons' where family = 'Lisianthus';

-- Margaridas/Ásteres: File:Leucanthemum vulgare 'Filigran' Flower 2200px.jpg
update flowers set image_file = 'margaridas-asteres.jpg', image_credit = 'Photo by and (c)2008 Derek Ramsey (Ram-Man).  Co-attribution must be given to the Chanticl / CC BY-SA 3.0 / Wikimedia Commons' where family = 'Margaridas/Ásteres';

-- Orquídeas: File:Phalaenopsis Cultivar White 01.jpg
update flowers set image_file = 'orquideas.jpg', image_credit = 'Uoaei1 / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Orquídeas';

-- Peónias: File:Paeonia lactiflora 'Bowl of Beauty'-2459.jpg
update flowers set image_file = 'peonias.jpg', image_credit = 'Julie Anne Workman / CC BY-SA 3.0 / Wikimedia Commons' where family = 'Peónias';

-- Proteáceas: File:Protéa royale à Stellenbosch (Afrique du Sud).jpg
update flowers set image_file = 'proteaceas.jpg', image_credit = '©  Pierre André / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Proteáceas';

-- Ranúnculos: File:Ranunculus asiaticus 00041.jpg
update flowers set image_file = 'ranunculos.jpg', image_credit = 'Nevit Dilmen (talk) / CC BY-SA 3.0 / Wikimedia Commons' where family = 'Ranúnculos';

-- Rosas: File:Red rose with black background.jpg
update flowers set image_file = 'rosas.jpg', image_credit = 'Laitche / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Rosas';

-- Tulipas: File:Tulipe des jardins (Tulipa gesneriana).jpg
update flowers set image_file = 'tulipas.jpg', image_credit = 'JackyM59 / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Tulipas';

-- Vivaz: File:Limonium sinuatum RF.jpg
update flowers set image_file = 'vivaz.jpg', image_credit = 'Robert Flogaus-Faust / CC BY 4.0 / Wikimedia Commons' where family = 'Vivaz';

-- Íris: File:Iris × germanica flower.jpg
update flowers set image_file = 'iris.jpg', image_credit = 'Hüseyin Cahid Doğan / CC BY-SA 4.0 / Wikimedia Commons' where family = 'Íris';

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- (a) Flores sem foto — esperado: 0 linhas.
select name, family from flowers where active and image_file is null order by family, name;

-- (b) Cobertura por família — esperado: 28 linhas, todas com ficheiro.
select family, count(*) as flores, max(image_file) as ficheiro
from flowers where active group by family order by family;
