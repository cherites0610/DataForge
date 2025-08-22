# DataForge - 數造工坊

> 🔧 一鍵生成高仿真測試數據的智能工具｜支援規則引擎 + LLM 雙模式生成｜輸出 Excel｜內建問卷邏輯模擬

![DataForge Logo](https://via.placeholder.com/400x150?text=DataForge)  
*「Forge Realistic Data, Instantly.」*

DataForge 是一個基於 **NestJS** 開發的數據偽造與模擬工具，專為開發者、產品經理、問卷設計師與測試團隊打造。透過直覺的網頁介面，使用者可自定義字段、生成規則與問卷邏輯，快速產出高品質的模擬數據，並即時下載為 Excel 檔案。

無論是後端 API 測試、前端 UI 填充，還是市場問卷模擬分析，DataForge 都能大幅節省人工造數時間，提升開發與驗證效率。

---

## 🌟 核心功能

### ✅ 自定義字段與數據類型
- 支援自由新增、編輯、刪除字段
- 字段類型豐富：
  - 基本類型：文字、數字、布林值
  - 常見格式：姓名、手機號碼、身份證號、郵箱、地址
  - 問卷題型：
    - 1–5 分量表（Likert Scale）
    - 是/否選擇
    - 單選 / 多選
    - 開放式問答
- 支援跳題邏輯設定（Conditional Logic），模擬真實問卷流程

### 🎯 雙引擎數據生成
1. **規則式生成（Rule-based Engine）**
   - 編號：支援前綴、起始值、步長（如 `USER-001`, `USER-002`）
   - 中國大陸手機號：依現行號段規則生成（如 `139`, `152`, `176` 等）
   - 身份證號：符合 GB 11643-1999 標準，含地區碼、出生日、校驗碼
   - 量表題：可設定分佈（均勻、常態、偏態）

2. **LLM 智能生成（AI-powered）**
   - 整合 OpenAI GPT-3.5 / GPT-4、Azure OpenAI 等大模型 API
   - 支援語義級生成：如「公司名稱」、「個人簡介」、「開放式問卷答案」等
   - 自動提示工程（Prompt Engineering）優化輸出一致性

### 🔁 熔斷與降級機制
- 多 LLM 服務商支援（OpenAI, Azure, 可擴充至國產模型）
- 多 API Key 輪詢與故障轉移
- 當所有 LLM 服務異常時，自動降級至規則生成模式，保障服務可用性

### 💾 即時 Excel 匯出
- 生成後自動轉換為 `.xlsx` 格式
- 支援大規模數據分批處理（可配置）
- 不儲存用戶數據，保障隱私與合規

### 🛡️ 安全與防禦
- 輸入欄位過濾與白名單校驗，防止注入攻擊
- API 調用頻率限制（Rate Limiting）
- Redis 快取加速重複請求處理

### 💼 商業化預留設計
- UI 預留「升級 Pro」按鈕與功能標記
- 支援高級規則、百萬筆生成、團隊協作等付費功能擴展

---

## 🖼️ 使用介面預覽

| 功能 | 截圖示意 |
|------|----------|
| 字段管理 | ![Field Management](https://via.placeholder.com/600x300?text=Field+Management) |
| 問卷邏輯設定 | ![Logic Setup](https://via.placeholder.com/600x300?text=Skip+Logic+Setup) |
| 生成與下載 | ![Export](https://via.placeholder.com/600x300?text=Excel+Download) |

> *實際介面將採用簡潔現代風格，支援暗色模式與響應式設計*

---

## 🏗️ 技術架構

### 後端（NestJS）
- **框架**：NestJS (TypeScript)
- **API**：RESTful + WebSocket（可選，用於大數據生成進度回報）
- **數據生成引擎**：
  - `RuleEngineService`：處理編號、身份證、手機等規則生成
  - `LLMService`：封裝 OpenAI / Azure OpenAI 調用，支援熔斷（Hystrix 模式）
  - `FallbackService`：LLM 失效時自動切換至規則生成
- **Excel 轉換**：使用 `exceljs` 或 `SheetJS (xlsx)` 生成 `.xlsx`
- **快取**：Redis 緩存常用生成模板與結果
- **安全**：
  - 使用 `class-validator` 與 `class-transformer` 校驗輸入
  - `@nestjs/throttler` 實現限流
  - Helmet, CORS, CSRF 防護

### 前端（內嵌於 NestJS）
- 使用 `@nestjs/serve-static` + `EJS` 或 `React/Vue`（可選）
- 單頁應用設計，支援拖曳排序、即時預覽
- 狀態管理：Zustand / Redux Toolkit（若使用 React）

### 第三方服務
- OpenAI API
- Azure OpenAI Service
- Redis（快取與限流）