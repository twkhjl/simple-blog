# Specs 結構

本目錄依責任拆分，避免單一 spec 過胖。

## 目錄

- `overview/`
  - 主產品規格、MVP 範圍、角色、流程、驗收摘要
- `database/`
  - schema、index、constraint、RLS、trigger、seed、migration
- `api/`
  - API 契約、request / response、error code、型別定義
- `planning/`
  - implementation plan、phase、task list、開發順序

## 目前文件

- `overview/Blog 系統開發規格 v1.md`
- `database/database-schema-v1.md`

## 擴充原則

- 主 spec 只放摘要與決策，不重複塞實作細節
- 細節文件只維護一份 source of truth
- 新增同類文件達 2 份以上時，維持放在對應子資料夾

## 公開文件安全原則

- 本目錄文件預設可進版本控制與公開 repo
- 所有網域、帳號、email、API base URL、bucket 相關值一律使用 placeholder
- 不在文件中放任何 secret、token、密碼、真實管理員帳號
