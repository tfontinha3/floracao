# Floração — Sistema de Encomendas

App interna para o negócio de distribuição de flores do pai do Tiago. Substitui o processo
manual de apanhar encomendas em papel e somar à mão.

**Ao vivo**: https://tfontinha3.github.io/floracao/
**Repo**: https://github.com/tfontinha3/floracao

## Stack

- Vite + React (JS puro, sem TypeScript)
- Supabase (Postgres + REST + Realtime) como backend
- Deploy automático: GitHub Actions → GitHub Pages, a cada push para `main`

## Estrutura

- `src/App.jsx` — as 3 vistas: **Modo Rápido** (o dono bate o papel), **Registar** (empregados
  registam entregas), **Apanhado** (vista agregada por dia/flor). Também tem o ecrã de PIN
  (`PinGate`) que trava o acesso à app.
- `src/supabaseClient.js` — inicialização do cliente Supabase, lê de `import.meta.env`.
- `src/useOrdersData.js` — todo o acesso a dados vive aqui; a UI nunca fala com o Supabase
  diretamente.
- `schema.sql` — schema completo (tabelas, views, RLS, seed data). Corre-se uma vez no SQL
  Editor do Supabase ao criar um projeto novo.

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
