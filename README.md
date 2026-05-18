# Simple Blog

此 repo 包含前端、Worker、資料庫腳本與公開規格文件；`md/specs` 為公開資料，範例內容需維持去識別化。

## Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

- 使用 `Vue 3 + Vite + Hash Router`
- GitHub Pages 部署需配合 [frontend/vite.config.ts](/D:/codes/simple-blog/frontend/vite.config.ts) 的 `base` 設定
- 前端組裝 API URL 時需考慮 Vite 的 `import.meta.env.BASE_URL`

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

初始化腳本：

1. `database/schema.sql`
2. `database/policies.sql`
3. `database/triggers.sql`
4. `database/seed.sql`

Supabase 本地設定集中在 `supabase/config.toml`，資料庫 schema 與 seed 由 SQL 檔維護。

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

- `md/specs` 只放可公開分享內容。範例帳號、文章 slug、作者名稱請統一使用去識別化 placeholder，例如 `member@demo.invalid`、`launch-checklist`、`Editorial Account`
- `database/seed.sql` 與 `supabase/config.toml` 只保留示意設定，不可放真實帳號、正式網域或可追溯個資
