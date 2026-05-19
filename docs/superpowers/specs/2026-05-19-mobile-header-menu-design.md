# 手機版前台 Header 收合選單設計

## 背景

目前前台 Header 在手機版不會隱藏導覽與登入操作，而是將導覽列改成雙欄平鋪。這讓上方區塊在小螢幕上過高，且導覽、登入操作、品牌資訊同時展開時，視覺焦點分散。

本次調整目標是讓前台手機版 Header 改為收合式選單，降低初始高度，改善可讀性與操作節奏，同時保留桌機版既有樣式與資訊架構。

## 目標

- 手機版前台 Header 改為漢堡按鈕觸發的下拉選單
- 將 `Explore`、`Profile`、`Admin`、`Login`、`Register`、`Logout` 一起收進手機版選單
- 使用者點擊任一選單項目後，自動關閉選單
- 保留桌機版現有版型與互動，不影響既有桌機導覽
- 維持現有深色、觸感式、立體陰影的視覺語言，不改成通用白底抽屜樣式

## 非目標

- 不調整前台頁面內容區塊與 footer 結構
- 不變更路由資訊架構
- 不調整管理後台 sidebar 或 admin header 行為
- 不新增權限規則，`Admin` 顯示條件沿用現有 `canAccessAdmin()`

## 現況摘要

- 前台 Header 位於 [frontend/src/layouts/PublicLayout.vue](/D:/codes/simple-blog/frontend/src/layouts/PublicLayout.vue:3)
- 目前導覽與登入操作分別為 `top-nav` 與 `inline-actions`
- 手機版樣式位於 [frontend/src/style.css](/D:/codes/simple-blog/frontend/src/style.css:849)
- 現行 `max-width: 760px` 僅將 `top-nav` 改成雙欄 grid，未提供收合狀態、切換按鈕、遮罩或自動關閉行為

## 使用者體驗設計

### 桌機版

- Header 保持現況
- `top-nav` 與 `inline-actions` 持續直接顯示
- 不新增桌機版漢堡按鈕

### 手機版

- Header 第一列保留品牌資訊與漢堡按鈕
- 漢堡按鈕位於右側，點擊後展開下拉面板
- 下拉面板放在 Header 內容區內，於品牌列下方展開
- 面板內容分成兩區：
  - 主導覽：`Explore`、`Profile`、`Admin`（依權限顯示）
  - 帳號操作：`Login`、`Register` 或 `Logout`
- 所有選項改為單欄、大點擊區塊，避免雙欄平鋪造成擁擠
- 點擊任一連結或按鈕後，選單立即關閉
- 路由切換完成後，再保險關閉一次，避免非同步狀態殘留

## 互動規則

### 開關行為

- 點擊漢堡按鈕可切換選單開關
- 再次點擊漢堡按鈕可收合選單

### 自動關閉

- 點擊任一 `RouterLink` 後關閉選單
- 點擊 `Logout` 按鈕後關閉選單
- 路由變更時關閉選單

### 無障礙

- 漢堡按鈕提供 `aria-expanded`
- 漢堡按鈕提供 `aria-controls`
- 漢堡按鈕有明確可見的 focus 狀態
- 可使用語意化按鈕元素，不以 `div` 偽裝互動元件

## 技術設計

### 元件範圍

主要修改：

- [frontend/src/layouts/PublicLayout.vue](/D:/codes/simple-blog/frontend/src/layouts/PublicLayout.vue:1)
- [frontend/src/style.css](/D:/codes/simple-blog/frontend/src/style.css:537)

### 狀態

在 `PublicLayout.vue` 新增本地狀態：

- `isMobileMenuOpen: boolean`

此狀態僅控制前台手機版 Header 的顯示，不需要進入全域 store。

### 關閉機制

在元件內新增關閉方法，統一處理以下情境：

- 點擊導覽連結
- 點擊登入／註冊連結
- 點擊登出按鈕
- 監聽目前 route 改變

這能避免各互動入口使用不同收合邏輯，降低後續遺漏風險。

### 標記結構

手機版會新增：

- 漢堡按鈕區塊
- 可展開的 mobile menu panel 容器
- 面板內導覽與帳號操作分組容器

桌機版沿用原結構，但在 CSS 斷點下切換顯示方式，不拆成兩套完全獨立的 header 元件，避免重複維護選單內容。

## 視覺設計

### 整體方向

- 延續現有 `neo-shell`、深色漸層、內外陰影語言
- 手機版選單面板應看起來像 header 的延伸層，而不是獨立 popup

### 漢堡按鈕

- 風格比照現有 tactile button 語言
- 尺寸需適合單手點擊
- 開啟狀態可有輕微高亮或內陰影變化，讓開關狀態可辨識

### 下拉面板

- 使用圓角、半透明深色背景、邊框與陰影
- 與品牌列保留清楚間距
- 選單項目改成單欄縱向排列
- 主導覽與帳號操作之間用間距或淡分隔線區隔

## 響應式規則

- `> 760px`：沿用目前桌機版 header
- `<= 760px`：
  - 顯示漢堡按鈕
  - 收合 `top-nav` 與 `inline-actions` 的預設外露布局
  - 啟用 mobile menu panel 的展開／收合樣式

若後續實作發現 760px 臨界點視覺不理想，可微調，但此需求先沿用現有斷點，避免擴大範圍。

## 測試重點

### 手動驗證

- 手機寬度下，初始載入時選單預設關閉
- 點漢堡按鈕後可展開，再點一次可收合
- 點 `Explore`、`Profile`、`Admin` 後選單會自動關閉
- 點 `Login`、`Register`、`Logout` 後選單會自動關閉
- 登入與未登入狀態下，面板內容正確切換
- 有 `Admin` 權限與無權限時，面板內容正確切換
- 桌機寬度下，原本 header 版型不回歸成漢堡選單

### 回歸風險

- Sticky header 在展開狀態下是否遮擋內容過多
- 長品牌文案與漢堡按鈕在小寬度下是否互擠
- 登出後狀態切換是否造成面板殘留

## 實作建議順序

1. 在 `PublicLayout.vue` 新增開關狀態、切換按鈕、面板容器與關閉方法
2. 加入 route 變更時的自動關閉
3. 在 `style.css` 為手機版新增按鈕與下拉面板樣式
4. 移除目前手機版雙欄平鋪導覽規則，改為單欄 menu panel 規則
5. 手動驗證登入、未登入、admin 權限三種狀態

## 風險與對策

- 風險：將桌機與手機共用同一套 DOM，CSS 狀態交錯時可能造成樣式覆蓋混亂
  - 對策：新增明確的 mobile menu class 與狀態 class，避免直接覆寫過多既有 `.top-nav` 規則
- 風險：連結點擊與 route watch 都會關閉選單，可能造成重複觸發
  - 對策：關閉邏輯維持 idempotent，只做布林設值
- 風險：Logout 為 async，若先切換狀態再登出可能有短暫 UI 跳動
  - 對策：先關閉選單，再執行登出流程

## 驗收標準

- 手機版前台 header 不再直接外露完整導覽與登入操作
- 手機版改以漢堡按鈕控制下拉選單
- 導覽與帳號操作皆收納於同一個手機版選單中
- 點擊任一選單項目後，選單會自動關閉
- 桌機版視覺與互動維持既有行為
