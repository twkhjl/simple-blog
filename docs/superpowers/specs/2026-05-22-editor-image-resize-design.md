# Editor Image Resize MVP Design

Date: 2026-05-22
Status: Implementation-ready

## Goal

讓 admin 文章編輯器中的 inline image 在被點選時顯示外框與 resize handle，作者可直接拖拉調整圖片寬度，並讓該尺寸設定在儲存後於公開頁同步生效。

本次目標是補齊圖片基本版面控制，不做完整圖片編輯器。

## Scope

### In Scope

- 點選 editor 內圖片時顯示選取外框
- 顯示右下角單一 resize handle
- 允許滑鼠拖拉調整圖片寬度
- 高度維持原始比例
- 尺寸寫入 editor HTML 並在 public render 保留
- 補 editor / render / page-level 測試

### Out of Scope

- 圖片對齊（置左、置中、置右）
- caption
- 裁切、旋轉、濾鏡
- 百分比寬度 / 響應式自訂尺寸 UI
- 多個 resize handle
- 觸控手勢優化
- 圖片工具列

## User Problem

目前後台圖片只能插入，不能在編輯器內調整視覺大小。作者若覺得圖片太大或太小，只能接受預設渲染結果，無法在內容排版階段修正。

## Recommendation

採用「自訂 Tiptap image node attrs + Vue NodeView resize wrapper」。

理由：

- 單靠 CSS 無法把拖拉尺寸穩定寫回內容
- NodeView 最適合處理「被選取時顯示控制點 + pointer drag」
- 只存 `width`，可避免一次引入過多版面屬性

## Alternatives Considered

### Option A: CSS only selected outline

做法：
- 用 `.ProseMirror-selectednode` 顯示外框
- 不做 drag resize

優點：
- 實作最小

缺點：
- 無法解決真正需求，只是顯示選取狀態

### Option B: Width input / preset buttons

做法：
- 點圖片後顯示輸入框或 preset button
- 例如 small / medium / large

優點：
- 比 drag 實作簡單

缺點：
- 操作感差
- 不符合你要的「拉伸圖片大小」

### Option C: NodeView drag resize

做法：
- 自訂 image NodeView wrapper
- 顯示選取外框與右下角 handle
- drag 時計算 width，更新 node attrs

優點：
- 最符合需求
- 可持久化尺寸

缺點：
- 前端實作比純 CSS 大

採用 Option C。

## Existing Baseline

- editor 元件：`frontend/src/components/editor/RichTextEditor.vue`
- image extension：目前在同檔內 `InstantPreviewImage`
- public render sanitize：`frontend/src/utils/richText.ts`
- public article render：`frontend/src/pages/public/PostDetailPage.vue`
- editor/public 共用內容樣式：`frontend/src/style.css`

目前 image node attrs 只涵蓋：

- `src`
- `alt`
- `data-upload-id`（暫時上傳狀態）

目前沒有：

- `width`
- NodeView
- 選取外框
- resize UI

## Product Rules

- 只有在 editor 內點到圖片時才顯示外框與 handle
- 未選取時不顯示控制點
- resize 只改 width
- 圖片高度一律自動依比例縮放
- 圖片 width 必須有最小值與最大值
- 儲存後重新載入文章，尺寸應保留
- public render 不可忽略已儲存 width

## Technical Design

## Stored Format

建議在 image node 上存 `width` 屬性。

HTML 輸出範例：

```html
<p><img src="https://cdn.example.com/files/posts/2026/05/example.webp" alt="example.webp" width="480"></p>
```

不存 `height`。

理由：

- 單一 width 足夠描述版面需求
- 高度由瀏覽器依比例自動計算
- 比 inline `style="width: ...px"` 更容易與 sanitize allowlist 對齊

## Editor Node Attributes

擴充 `InstantPreviewImage` attrs：

- `src`
- `alt`
- `data-upload-id`
- `width`

規則：

- `width` 預設為 `null`
- 若 `width` 存在，render 到 DOM 時輸出 `width` attribute
- 若 `width` 不存在，維持目前自然寬度行為

## NodeView Behavior

新增自訂 Vue NodeView 元件，例如：

- `frontend/src/components/editor/ResizableImageNodeView.vue`

責任：

- 顯示圖片本體
- 處理選取態樣式
- 在選取時顯示右下角 handle
- 監聽 pointer/mouse drag
- 計算新寬度
- 透過 `updateAttributes({ width })` 寫回 node attrs

## Resize Interaction

流程：

1. 使用者點圖片
2. 圖片進入 selected 狀態
3. 顯示外框與右下角 handle
4. 使用者拖拉 handle
5. 以圖片容器當前寬度 + pointer delta 計算新 width
6. 套用 clamp：
   - 最小寬度：`120px`
   - 最大寬度：editor 內容區寬度
7. drag 結束後，node attrs 中的 `width` 保留

## Selection Styling

選取狀態需清楚但不誇張。

建議視覺：

- 圖片外框使用 `var(--secondary)` 或 `var(--primary)` 半透明線
- handle 為小圓點或小方點
- 外框與 handle 只在 selected 狀態出現

## Public Render

public 頁不需要 handle 或外框，但要保留 width 效果。

規則：

- sanitize allowlist 要接受 image `width` attribute
- `.rich-content img` 樣式不可覆蓋掉已存 width
- 仍保留 `max-width: 100%` 與 `height: auto`

這樣可達成：

- 有存 width：依該 width 顯示，但不超出容器
- 無存 width：沿用自然/容器寬度

## Security Boundary

本次不引入 `style` attribute。

理由：

- 現有 sanitize 本來就禁 `style`
- 若為了圖片尺寸放寬整體 inline style，風險過大

僅放寬 `img[width]` 即可。

## File-Level Plan

### Frontend

#### 1. `frontend/src/components/editor/RichTextEditor.vue`

調整重點：

- 抽出或擴充 image extension，支援 `width`
- 將 image extension 掛上自訂 NodeView
- 保持現有 clipboard upload / instant preview 行為

#### 2. `frontend/src/components/editor/ResizableImageNodeView.vue`

新檔，責任：

- render image wrapper
- 顯示 selected outline
- 顯示右下角 resize handle
- drag resize 時計算 width
- 呼叫 `updateAttributes`

#### 3. `frontend/src/style.css`

新增：

- selected image wrapper 樣式
- resize handle 樣式
- 保留 public `.rich-content img` 與 editor `.tiptap img` 的 width 行為

#### 4. `frontend/src/utils/richText.ts`

確認 sanitize allowlist 接受：

- `img`
- `src`
- `alt`
- `width`

若目前 `width` 會被移除，需要補 allowlist。

### Tests

#### 5. `frontend/tests/rich-text-editor.spec.ts`

新增或調整測試：

- image node 可保留 `width` attribute
- 點選圖片時 resize path 可更新 HTML 中的 `width`
- 既有 instant preview / upload replacement 不回歸

#### 6. `frontend/tests/rich-text.spec.ts`

新增測試：

- `sanitizeRenderHtml()` 保留安全圖片的 `width`
- 惡意外部圖片仍被移除

#### 7. `frontend/tests/ui.spec.ts`

新增靜態檢查：

- editor / public image styles 保留 `height: auto`
- resize handle / selected wrapper class 存在

## Validation Rules

- width 僅接受正整數像素值
- 小於最小寬度時 clamp 到 `120`
- 大於 editor 內容區寬度時 clamp 到容器上限
- 若 width 無效，回退為 `null`

## Risks

### Risk 1: NodeView 與現有 instant preview 互相干擾

Impact:
- pending upload image 在替換正式 URL 時，selection / resize 狀態錯亂

Mitigation:
- 先讓 image attrs 模型穩定，再在 NodeView 中只關心 `src/alt/width`
- `data-upload-id` 仍保留在 attrs，但不參與視覺 resize 邏輯

### Risk 2: Public sanitize 把 width 移除

Impact:
- editor 內尺寸看起來正確，公開頁失效

Mitigation:
- 測試明確覆蓋 `img[width]` 保留

### Risk 3: Drag 過程頻繁更新造成卡頓

Impact:
- editor 體驗不順

Mitigation:
- MVP 先直接更新 attrs
- 若實測卡頓，再加 `requestAnimationFrame` 節流

## Acceptance Criteria

- 點選 editor 圖片時，可看到清楚外框
- 選取圖片時，右下角可看到 resize handle
- 拖拉 handle 可改變圖片寬度
- 儲存後重新載入文章，尺寸保留
- public 頁圖片尺寸與 editor 設定一致
- 既有圖片上傳、貼上即預覽、儲存 guard 行為不回歸

