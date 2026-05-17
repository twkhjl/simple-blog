# Database SQL

這一層對應 `md/specs/database/database-schema-v1.md`。

## 執行順序

1. `schema.sql`
2. `policies.sql`
3. `triggers.sql`
4. `seed.sql`

## 設計說明

- v1 只建立 `profiles`、`posts`、`files`
- RLS 預設開啟，主要業務授權由 Worker 控制
- `handle_auth_user_created()` 放在 `private` schema，避免把 `security definer` function 暴露在 `public`
- `seed.sql` 只保留去識別化 placeholder，不放真實管理員資訊

