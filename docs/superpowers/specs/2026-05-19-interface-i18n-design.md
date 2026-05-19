# 前後台介面多語系設計

## 背景

目前前台與後台介面文案大多直接寫死在 Vue 元件內，尚未建立多語系架構。這使得新增第二語言時，必須逐頁修改字串，缺少統一的語系切換、fallback、標題更新與測試策略。

本次需求只涵蓋「介面文案」多語系，不包含文章內容、資料庫 schema、API 回傳資料結構或路由 path 多語化。

## 目標

- 前台與後台介面支援多語系
- 預設語系為繁體中文 `zh-TW`
- 第二語系先支援英文 `en`
- 提供語言切換 UI
- 切換語系後即時更新介面文案
- 切換語系後同步更新 `document.title`
- 切換語系後同步更新 `html lang`
- 將語系選擇持久化到 `localStorage`

## 非目標

- 不支援文章內容多語
- 不變更 API 路由與頁面路由 path
- 不翻譯後端原始錯誤字串
- 不調整資料庫 schema
- 不處理 SEO 進階需求，例如 `hreflang`、多語 sitemap、canonical 分語系版本

## 範圍

本次納入：

- 前台 layout、header、footer、menu
- 後台 layout、header、sidebar/menu
- public/auth/admin 頁面靜態文案
- editor placeholder 與按鈕文案
- 前端自行產生的成功／失敗／提示訊息
- `index.html` 的 `lang`
- route 切換時的 `document.title`

本次不納入：

- 文章標題、摘要、內文的多語內容管理
- 後端回傳的原始 error message 翻譯
- 路由網址多語化，例如 `/login` 改成 `/登入`

## 現況摘要

- 目前專案尚未導入 i18n 套件
- `frontend/index.html` 已固定寫成 `lang="zh-Hant"`，但不會隨語系切換更新
- `frontend/src/layouts`、`frontend/src/pages`、`frontend/src/components/editor/RichTextEditor.vue` 內有大量硬編碼英文字串
- 前端成功／失敗訊息散落於 auth、profile、admin post 編輯等頁面

## 技術方案

### 方案選擇

採用 `vue-i18n` 作為正式多語系方案。

理由：

- 與 Vue 3 整合成熟
- 可集中處理 fallback、locale 切換與字典管理
- 後續若新增第三語言，擴充成本低
- 比自製字典更容易維護與測試

### 目錄結構

建議新增：

- `frontend/src/i18n/index.ts`
- `frontend/src/i18n/locales/zh-TW.ts`
- `frontend/src/i18n/locales/en.ts`
- `frontend/src/i18n/useLocale.ts`

責任分工：

- `index.ts`：初始化 `vue-i18n`、註冊 messages、設定 fallback
- `locales/*.ts`：各語系字典
- `useLocale.ts`：語系偵測、切換、持久化、更新 `html lang` 與 `document.title`

## 語系規則

### 支援語系

- `zh-TW`
- `en`

### 預設與 fallback

- 系統預設語系：`zh-TW`
- fallback 語系：`zh-TW`

### 語系來源優先序

1. `localStorage` 中使用者上次手動選擇
2. 瀏覽器語系
3. fallback `zh-TW`

### 瀏覽器語系映射

- `zh`、`zh-TW`、`zh-HK`、`zh-Hant` 一律映射到 `zh-TW`
- 其他語系先映射到 `en`

這樣可避免第一版就處理過細的中文變體差異。

## 文案 key 設計

建議依功能域分層：

- `common.*`
- `public.*`
- `auth.*`
- `admin.*`
- `editor.*`
- `seo.*`

範例：

- `common.actions.save`
- `common.actions.delete`
- `public.nav.explore`
- `auth.login.title`
- `admin.posts.emptyTitle`
- `editor.placeholder.body`
- `seo.profile.title`

原則：

- 以語意命名，不以文字內容命名
- 避免單一巨大平面字典
- 相同語意共用 key，例如共通按鈕

## UI 設計

### 語言切換器

前台與後台都提供語言切換器。

建議樣式：

- 小型 segmented control 或 inline toggle
- 顯示 `繁中 | EN`
- 不使用國旗
- 不使用大型 dropdown

理由：

- 與現有深色 tactile 介面較一致
- 視覺負擔低
- 實作與可用性都較穩

### 放置位置

- 前台：放在 header 操作區
- 後台：放在 admin header 或 sidebar 上方

目標是讓使用者在任何主要入口都能快速切換語言。

## 文件標題與 HTML 屬性

### `document.title`

每個主要 route 應定義對應 title key，切頁時更新瀏覽器標題。

例：

- 首頁：`seo.home.title`
- Login：`seo.login.title`
- Register：`seo.register.title`
- Profile：`seo.profile.title`
- Admin Posts：`seo.adminPosts.title`

### `html lang`

語系切換時更新：

- `zh-TW` 對應 `document.documentElement.lang = 'zh-Hant'`
- `en` 對應 `document.documentElement.lang = 'en'`

這能讓瀏覽器、輸入法、螢幕閱讀器取得較正確的語言資訊。

## 元件與頁面調整策略

### Layout

修改：

- `frontend/src/layouts/PublicLayout.vue`
- `frontend/src/layouts/AdminLayout.vue`

內容：

- 導覽列文案改成 `t()`
- footer 文案改成 `t()`
- 語言切換器放入 layout

### Public / Auth / Admin 頁面

將下列內容改成翻譯 key：

- 標題
- 說明文字
- 按鈕文案
- 空狀態文案
- 表單 label
- placeholder
- metadata label

### Editor

修改：

- `frontend/src/components/editor/RichTextEditor.vue`

內容：

- 編輯器 placeholder 改用翻譯字串
- 相關控制按鈕若為硬編碼，也一併改為翻譯 key

## 錯誤與訊息策略

### 前端自產訊息

前端自行設定的訊息改為可翻譯，例如：

- Login successful
- Login failed
- Profile updated
- Profile update failed
- Register failed
- Content must not be empty

### 後端原始錯誤訊息

本次先保留原文，不進行翻譯包裝。

理由：

- 後端錯誤格式尚未統一
- 若直接硬轉譯，容易造成訊息失真或覆蓋重要細節

後續若要擴充，可另做「錯誤碼 -> 翻譯 key」映射層。

## 測試策略

### 單元測試

新增或調整測試覆蓋：

- 預設 locale 為 `zh-TW`
- `localStorage` 優先於瀏覽器語系
- 瀏覽器語系映射邏輯正確
- 切換語言後回傳正確 locale

### UI / 元件測試

新增或調整測試覆蓋：

- layout 文案在不同 locale 下會變化
- 語言切換器可正常切換
- `html lang` 會更新
- `document.title` 會更新

### 驗證命令

- `npm test`
- `npm run build`
- `npm run check`

## 風險與對策

### 風險 1：硬編碼字串分散，初次抽離容易漏

對策：

- 先用全文搜尋盤點字串
- 依 layout / public / auth / admin / editor 分批替換
- 補測試鎖住關鍵頁面與 layout

### 風險 2：部分文案與狀態訊息混在程式邏輯中

對策：

- 把訊息集中成翻譯 key
- 避免在條件式中直接拼接語句

### 風險 3：`document.title` 與 route 切換同步不一致

對策：

- 在 router 層統一管理 title 更新
- 不讓各頁面自行隨機設定 title

### 風險 4：editor placeholder 初始化後不跟著語系更新

對策：

- 檢查編輯器套件是否需在 locale 改變時手動更新 placeholder 設定
- 若必要，透過 watch 或重建 editor instance 處理

## 實作順序建議

1. 導入 `vue-i18n` 與基礎 i18n 模組
2. 完成 locale 偵測、fallback、持久化
3. 串接 `main.ts`
4. 加入語言切換器
5. 先改 layout 與共通文案
6. 再改 public / auth / admin / editor 文案
7. 串接 `document.title` 與 `html lang`
8. 補測試與驗證

## 驗收標準

- 系統預設語系為繁體中文
- 可切換到英文
- 前台與後台主要介面文案可隨語系切換
- 切換結果會記錄到 `localStorage`
- 重整頁面後仍保留使用者所選語系
- `document.title` 會隨語系與 route 改變
- `html lang` 會隨語系改變
- 不影響既有路由與文章內容資料結構
