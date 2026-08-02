# Floração — Sistema de Encomendas

App interna para o negócio de distribuição de flores do pai do Tiago. Substitui o processo
manual de apanhar encomendas em papel e somar à mão.

**Ao vivo**: https://tfontinha3.github.io/floracao/
**Repo**: https://github.com/tfontinha3/floracao

## Stack

- Vite + React (JS puro, sem TypeScript)
- Supabase (Postgres + REST + Realtime) como backend
- Deploy automático: GitHub Actions → GitHub Pages, a cada push para `main`
- PWA instalável (`vite-plugin-pwa`) — dá para instalar no ecrã principal do telemóvel a partir
  do Chrome, sem loja de apps

## Estrutura

- `src/App.jsx` — as 3 vistas: **Modo Rápido** (o dono bate o papel, sem pedir nome de cliente —
  fica associado a um cliente placeholder "Sem cliente" na BD), **Flores** (catálogo só de
  consulta, agrupado por família), **Apanhado** (vista agregada por dia/flor). Também tem o ecrã
  de PIN (`PinGate`) que trava o acesso à app.
  A data de entrega no Modo Rápido escolhe-se num calendário mensal (`DeliveryCalendar`) — qualquer
  dia a partir de hoje, sem limite de meses à frente. Um `setInterval` de 60s no componente `App`
  força um re-render quando o dia civil muda, para a app se atualizar sozinha mesmo que fique
  aberta de um dia para o outro no telemóvel (sem precisar de recarregar).
- `src/supabaseClient.js` — inicialização do cliente Supabase, lê de `import.meta.env`.
- `src/useOrdersData.js` — todo o acesso a dados vive aqui; a UI nunca fala com o Supabase
  diretamente.
- `schema.sql` — schema completo (tabelas, views, RLS, seed data). Corre-se uma vez no SQL
  Editor do Supabase ao criar um projeto novo. Catálogo de **109 flores** (só flor de corte),
  organizadas em 25 famílias (Rosas, Cravos, Crisântemos, Gerberas, Tulipas, Lírios, Orquídeas,
  Hortênsias, Alstroemérias, Girassóis, Antúrios, Peónias, Frésias, Margaridas/Ásteres, Íris,
  Estrelícias, Enchimento, Ranúnculos, Folhagens/Verdes, Vivaz, Gladíolos, Antirrhinum, Lisianthus,
  Proteáceas, Decorativos). A coluna `family` na tabela `flowers` aparece no dropdown de pesquisa
  da app. O catálogo foi expandido a partir da folha de apanhado em papel usada antes da app.
- `public/manifest.json` + `public/icons/` — manifest da PWA e os ícones (192, 512, maskable-512).
  `vite.config.js` regista o `vite-plugin-pwa` com `manifest: false` (o manifest é este ficheiro
  estático, não gerado pelo plugin) e `registerType: 'autoUpdate'`.

## Correr localmente

```bash
npm install
cp .env.example .env.local   # preenche com os valores reais (pede ao Tiago ou vê o Supabase dashboard)
npm run dev
```

Variáveis necessárias em `.env.local` (nunca commitadas — vão para GitHub Actions secrets em produção):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_PIN` — código de acesso do ecrã de PIN

## Deploy

Automático: qualquer push para `main` dispara `.github/workflows/deploy.yml`, que faz build e
publica em GitHub Pages. As três variáveis acima têm de estar configuradas em
**Settings → Secrets and variables → Actions** do repositório.

Requer `gh` CLI autenticado para gerir secrets a partir da linha de comandos:
```bash
gh secret set VITE_SUPABASE_URL --body "..."
```
Usa sempre `--body` (nunca pipe/stdin) — descobrimos que passar o valor por pipe no PowerShell
corrompe o secret (acrescenta um BOM invisível que parte os headers HTTP no browser).

## Coisas a saber (aprendidas a construir isto)

- **GitHub Pages tem cache de ~10 min no `index.html`**. Depois de um deploy novo, se o browser
  mostrar a versão antiga, o problema é quase sempre cache — testa com um query string diferente
  (`?v=2`) ou um hard refresh, antes de assumir que o deploy falhou.
- **RLS está aberto** (`using (true)`) em todas as tabelas — não há login de utilizadores, só o
  PIN à entrada da app (proteção fraca, só trava a UI casual, não a API diretamente). Se algum dia
  os dados ficarem mais sensíveis, vale a pena migrar para Supabase Auth a sério.
- **Supabase free tier pausa ao fim de 7 dias sem pedidos** — não é um problema aqui porque a app
  é usada todos os dias, mas vale lembrar se ficar muito tempo sem uso.
- O dono do negócio (`is_owner: true` na tabela `employees`) é o **Heitor**; o nome não está
  hardcoded no código, vem sempre da base de dados.
- `gh auth login --with-token` falhava sempre com "Bad credentials" nesta máquina mesmo com
  tokens válidos (confirmado por chamada direta à API do GitHub) — contornado autenticando via
  variável de ambiente `GH_TOKEN` em vez de `gh auth login`.
- **Cuidado com `.ps1` e acentos**: um ficheiro de script gravado sem BOM UTF-8 é lido pelo
  Windows PowerShell 5.1 no codepage local, corrompendo qualquer literal acentuado dentro do
  próprio ficheiro (ex.: "Antúrio" virava "AntÃºrio"). Comandos inline (`-Command`, não `-File`)
  não têm este problema. Para dados com acentos, usa sempre comando inline ou lê de um JSON.
- **Service worker da PWA fica preso em versões antigas**: depois de um deploy novo, um
  telemóvel/browser que já tinha visitado o site antes pode continuar a mostrar a versão anterior
  indefinidamente, porque o service worker antigo continua a servir o cache dele. Não basta
  recarregar — é preciso limpar dados do site (Chrome → Definições do site → Limpar e repor) ou,
  em DevTools, `navigator.serviceWorker.getRegistrations()` + `unregister()` e `caches.delete()`.
  Isto só afeta quem já visitou antes de um deploy; visitas novas (ex.: o telemóvel do Heitor) não
  têm este problema.
