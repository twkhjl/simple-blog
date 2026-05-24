# Editor Link Paste Design

Date: 2026-05-24
Status: Implementation-ready

## Goal

讓後台文章編輯器支援三種連結行為：

1. 選取文字後，透過工具列連結表單套用 URL。
2. 選取文字後，若直接貼上單一純 URL，將目前 selection 套成連結，不插入 URL 字串。
3. 未選取文字時，若直接貼上單一純 URL，在游標位置插入可點擊連結，顯示文字先使用 URL 本身。

## Scope

### In Scope

- 後台 `RichTextEditor` 的連結插入與貼上行為
- URL 合法性判斷與共用 helper
- `paste` 事件分流邏輯
- 元件測試補強

### Out of Scope

- 浮動連結編輯泡泡
- 自動將一般輸入文字即時轉為連結
- `tel:`、自訂協定、相對 URL
- 連結 `target` / `nofollow` 等進階設定
- 後端資料結構調整

## Existing Baseline

- 編輯器已載入 `@tiptap/extension-link`
- 工具列已有連結按鈕、URL 輸入框、套用與移除按鈕
- `applyLink()` / `removeLink()` 已存在
- render sanitizer 已允許 `<a>` 與 `href` / `target` / `rel`
- 目前 `handlePaste()` 主要處理圖片貼上

這代表需求 `1` 已大致具備，需求 `2`、`3` 主要缺自訂 paste 判斷與測試。

## Recommendation

採用「保留現有表單 + 擴充 paste handler」。

理由：

- 變更集中在 `RichTextEditor.vue`，不需改後端或內容 schema。
- 與現有圖片貼上流程相容，實作位置一致。
- 可精確區分純 URL 貼上與一般文字貼上，避免誤判。
- 測試邊界清楚，回歸風險低。

## Alternatives Considered

### Option A: 只依賴 Tiptap `linkOnPaste`

優點：

- 改動最小

缺點：

- 難精確控制需求 `2` 與 `3` 的行為邊界
- 與既有自訂 `handlePaste()` 並存時，行為較不透明
- 測試可預期性較差

### Option B: 自訂 paste URL 分流

優點：

- 可完整覆蓋需求 `2`、`3`
- 與圖片貼上規則可明確排序
- 測試與除錯都直接

缺點：

- 需要自己維護 URL 判斷邏輯

結論：選 Option B。

## Product Rules

- 只有在 clipboard 純文字內容為「單一合法 URL」時，才攔截貼上流程。
- 合法 URL 先僅接受 `http:`、`https:`、`mailto:`。
- 若 clipboard 內容不是單一純 URL，應交回編輯器預設貼上行為。
- 若 clipboard 同時含有圖片或混合內容，既有圖片貼上規則優先；非純圖片時不應誤攔截。
- 無效 URL 不能套用為連結。

## Technical Design

### Shared URL Helper

將連結驗證從元件內抽成共用 helper，供以下路徑共用：

- `applyLink()` 表單套用
- `paste` 純 URL 判斷

helper 職責：

- 去除前後空白
- 判斷是否為單一 URL
- 驗證協定是否允許
- 回傳 normalized href 或 `null`

### Paste Flow

`handlePaste()` 改成先後分流：

1. 先檢查 clipboard image 流程，保留現有行為。
2. 若不是純圖片貼上，讀取 `text/plain`。
3. 若 `text/plain` 不是單一合法 URL，直接 return，不攔截。
4. 若目前 selection 非 collapsed：
   - `preventDefault()`
   - 對 selection 執行 `setLink({ href })`
   - 保留原 selection 文字，不插入 URL 字串
5. 若目前 selection 為 collapsed：
   - `preventDefault()`
   - 在游標位置插入帶有 link mark 的 URL 文字

### Insert-at-Cursor Behavior

需求 `3` 的插入內容使用 URL 原文作為可見文字，例如：

```html
<p><a href="https://example.com">https://example.com</a></p>
```

先不做自訂 label 或自動縮短顯示文字。

### Interaction With Existing Link Form

- 保留現有連結表單與移除連結功能
- `applyLink()` 改用共用 helper 驗證 URL
- 若 URL 無效，本輪不新增錯誤提示 UI，維持不套用

## File-Level Plan

### 1. `frontend/src/components/editor/RichTextEditor.vue`

- 抽出或引入 URL 驗證 helper
- 擴充 `handlePaste()` 支援純 URL 分流
- 新增「以 URL 文字插入 link」的小型 editor command 包裝
- 讓 `applyLink()` 與 paste 共用同一套驗證規則

### 2. `frontend/src/utils/richText.ts` 或新 helper 檔

- 放置 URL normalize / validate helper
- 避免在元件內重複維護 regex

是否放在既有 `richText.ts`，取決於是否希望將 editor-specific helper 與 render sanitizer 分離；兩者都可，但應避免把 URL paste 邏輯塞進過重的檔案。

### 3. `frontend/tests/rich-text-editor.spec.ts`

新增或補強：

- 選字後用表單套用連結
- 選字後貼上純 URL，原文字變成連結
- 無 selection 貼上純 URL，插入 URL 文字連結
- 貼上一般文字，不攔截
- 貼上混合文字內容，不走純 URL 快捷路徑
- 貼上無效 URL，不攔截

## Error Handling

- 純 URL 驗證失敗時，不攔截 paste，交回原生 editor 行為
- 表單套用無效 URL 時，不套用連結
- 不新增 toast 或 inline error，避免本輪擴 scope

## Test Plan

### Component

- `applyLink()` 仍可正確包住 selection
- `removeLink()` 不回歸
- 純 URL paste 在 selection 與 collapsed selection 下都正確
- 一般文字 paste 不受影響
- 圖片 paste 舊行為不回歸

### Regression

- 現有圖片貼上測試持續通過
- 已存在的連結表單測試可保留或小幅調整
- render sanitizer 既有 `<a>` 支援不受影響

## Risks

### Risk 1: URL 判斷過寬

Impact:

- 一般文字被誤判成連結，造成貼上體驗怪異

Mitigation:

- 僅接受單一純 URL
- 先只允許 `http:`、`https:`、`mailto:`

### Risk 2: 與圖片 paste 邏輯互相干擾

Impact:

- 圖片貼上被文字流程攔截，造成功能退化

Mitigation:

- 保持圖片判斷在前，URL 純文字判斷在後
- 補圖片與文字混合 paste 測試

## Acceptance Criteria

- 選字後可透過連結表單套用合法 URL
- 選字後貼上單一合法 URL，selection 文字成為連結，URL 不直接插入內容
- 無 selection 時貼上單一合法 URL，游標處插入可點擊連結
- 貼上非單一 URL 文字時，維持既有編輯器行為
- 既有圖片 paste 行為不回歸
