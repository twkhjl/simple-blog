# Simple Blog

依據 `md/specs` 開發的簡易部落格專案。

## Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

- 使用 `Vue 3 + Vite + Hash Router`
- GitHub Pages 子路徑部署已在 `vite.config.ts` 固定 `base`
- 靜態資源請走 Vite import 或 `import.meta.env.BASE_URL`

## Worker

```bash
cd worker
npm install
copy .dev.vars.example .dev.vars
npm run dev
```

- 使用 `Cloudflare Workers + Hono`
- `npm run check` 會執行 `typecheck + test`

## Database

依序執行：

1. `database/schema.sql`
2. `database/policies.sql`
3. `database/triggers.sql`
4. `database/seed.sql`

Supabase 本地設定檔在 `supabase/config.toml`，已指向上述 SQL 檔。

## Deploy

- Frontend: GitHub Actions -> GitHub Pages
- Worker: Wrangler deploy

### GitHub Actions Variables / Secrets

- `vars.VITE_SUPABASE_URL`
- `secrets.VITE_SUPABASE_ANON_KEY`
- `vars.VITE_API_BASE_URL`
- `secrets.CLOUDFLARE_API_TOKEN`
- `secrets.CLOUDFLARE_ACCOUNT_ID`
- `vars.SUPABASE_URL`
- `secrets.SUPABASE_ANON_KEY`
- `secrets.SUPABASE_SERVICE_ROLE_KEY`
- `vars.PUBLIC_APP_ORIGIN`
- `vars.PUBLIC_APP_BASE_PATH`
- `vars.R2_PUBLIC_BASE_URL`

## Public Repo Notes

- `md/specs` 是公開文件，內容需維持去識別化
- `database/seed.sql` 與 `supabase/config.toml` 只保留 placeholder，不放真實敏感值
