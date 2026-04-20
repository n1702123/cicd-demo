# CI/CD 實戰教育訓練 — Demo 腳本

> 講師現場示範指引。每個 Demo 都標註預估時間與講解要點。
> 對應兩個實際 repo：[hello-world/](../hello-world/)、[hello-world-railway/](../hello-world-railway/)

---

## Demo 全覽

| Demo | 主題 | 範例 repo | 時間 |
|------|------|----------|------|
| Demo 1 | 第一個 GitHub Actions Workflow（熱身） | 任何空 repo | 15 min |
| Demo A | Next.js → GitHub Pages（無 Docker） | `hello-world` | 20 min |
| Demo B | Next.js + Docker → Docker Hub → Railway | `hello-world-railway` | 25 min |

---

## 事前準備

### 共通

- 兩個 repo 都已經 push 到 GitHub
- 事先跑過一次 Actions 確認成功
- 預先開好分頁：兩個 repo 的 Actions 頁、Docker Hub、Railway 儀表板

### Demo A 用 — `hello-world/`

已經預備好：

```
hello-world/
├── .github/workflows/deploy.yml
├── app/
│   ├── layout.js
│   └── page.js
├── next.config.mjs          ← output: 'export', basePath: '/hello-world'
└── package.json
```

GitHub repo 設定：
- Settings → Pages → Source = `Deploy from a branch`，Branch = `gh-pages`

### Demo B 用 — `hello-world-railway/`

已經預備好：

```
hello-world-railway/
├── .github/workflows/deploy.yml
├── app/
│   ├── layout.js
│   └── page.js
├── .dockerignore
├── Dockerfile               ← 三階段 Build
├── next.config.mjs          ← output: 'standalone'
└── package.json
```

GitHub Secrets 已設定：
| Secret | 說明 |
|--------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 帳號 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token（Read & Write） |
| `RAILWAY_WEBHOOK_URL` | Railway Deploy Hook URL |

Railway 專案已設定：`Deploy from Docker Hub image`，指向 `{帳號}/hello-world-railway:latest`

---

## Demo 1：第一個 Workflow（15 min）

**目標**：讓學員看到「push code 自動跑東西」的效果，建立 GitHub Actions 心智模型。

### 1-1. 建立 Workflow（5 min）

```bash
mkdir -p .github/workflows
```

建立 `.github/workflows/hello.yml`：

```yaml
name: Hello CI

on: [push]

jobs:
  say-hello:
    runs-on: ubuntu-latest
    steps:
      - name: Say Hello
        run: echo "Hello, CI/CD!"

      - name: Show date
        run: date

      - name: Show runner info
        run: |
          echo "OS: $(uname -s)"
          echo "User: $(whoami)"
          echo "Directory: $(pwd)"
```

**講解要點**：
- YAML 結構：`name` → `on` → `jobs` → `steps`
- 「這就是在告訴 GitHub：每次 push，在雲端 Linux 機器跑這些指令」
- `run: |` 可以寫多行

### 1-2. Push 並觀看結果（5 min）

```bash
git add .github/workflows/hello.yml
git commit -m "Add first CI workflow"
git push
```

| 狀態 | 說明 |
|------|------|
| 🟡 黃色圓圈 | 執行中 |
| ✅ 綠色勾勾 | 成功 |
| ❌ 紅色叉叉 | 失敗 |

切到 Actions 頁籤，點進去看每個 Step 的 log。

### 1-3. 加入 Checkout（5 min）

更新 workflow：

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: List files
    run: ls -la

  - name: Show package info
    run: cat package.json 2>/dev/null || echo "no package.json yet"
```

**講解要點**：
- 沒 `checkout`，Runner 上是**空的**
- `uses` vs `run`：
  - `uses` → 用別人寫好的 Action
  - `run` → 自己寫 shell 指令
- log 裡可以看到 `ls -la` 列出 repo 檔案

---

## Demo A：Next.js → GitHub Pages（20 min）

**目標**：展示最簡單、無需 Docker、無需 Secrets 的真實部署流程。
**使用 repo**：[hello-world/](../hello-world/)

### A-1. 專案快速導覽（3 min）

打開 `app/page.js`：

```javascript
export default function Home() {
  return (
    <main style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <h1>Hello World!</h1>
      <p>這是 Next.js + GitHub Actions + GitHub Pages 的 Demo</p>
    </main>
  )
}
```

打開 `next.config.mjs`：

```javascript
const nextConfig = {
  output: 'export',         // 輸出靜態檔案
  basePath: '/hello-world', // GitHub Pages 網址不是根目錄
  images: { unoptimized: true },
}
```

**講解要點**：
- `output: 'export'` → `npm run build` 會產出 `out/` 資料夾
- `basePath` → 對應網址 `{帳號}.github.io/hello-world/`

### A-2. Workflow 逐行解說（5 min）

打開 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write       # 推到 gh-pages branch 需要

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

| Step | 做了什麼 |
|------|---------|
| Checkout | 拉 repo 到 Runner |
| Setup Node.js | 裝 Node.js 20 + npm cache |
| `npm ci` | 嚴格安裝相依套件 |
| `npm run build` | Next.js 輸出靜態檔到 `out/` |
| Deploy | 把 `out/` 推到 `gh-pages` branch |

**重點**：
- `GITHUB_TOKEN` 是 GitHub **自動提供**的，不用自己設定
- 只要宣告 `permissions: contents: write` 就能用

### A-3. 現場修改 + Push（5 min）

修改 `app/page.js`：

```javascript
<h1>Hello from CI/CD！🚀</h1>
```

```bash
git add . && git commit -m "Update greeting" && git push
```

切到 Actions 頁面，即時看 5 個 Step 依序跑完（約 1-2 分鐘）。

### A-4. 打開成品（5 min）

```
https://{你的GitHub帳號}.github.io/hello-world/
```

**講解要點**：
- 看到剛剛的修改已經上線了
- 打開 Settings → Pages，說明 `gh-pages` branch 的設定
- **整個流程 0 個 Secrets！** 因為用的是內建 `GITHUB_TOKEN`

### A-5. 小結（2 min）

> 「一個 YAML 檔，0 個 Secrets，就能把 Next.js 網站自動部署上線。適合文件站、部落格、Landing Page。」

**缺點**：
- 只能跑靜態，沒有後端
- 有後端邏輯的 Web App 需要真正的 Server → 下一個 Demo

---

## Demo B：完整 CI/CD Pipeline → Railway（25 min）

**目標**：串起完整容器化部署流程。
**使用 repo**：[hello-world-railway/](../hello-world-railway/)
**這是整堂課的高潮！**

### B-1. 專案結構導覽（3 min）

打開 `next.config.mjs`：

```javascript
const nextConfig = {
  output: 'standalone',  // 產生最小化的 server 執行檔
}
```

打開 `Dockerfile`（多階段 Build）：

```dockerfile
# Stage 1: 安裝依賴
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: 執行（最小化 image）
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

**講解要點**：
- 為什麼三階段：只有 `runner` 會進最終 image，不會帶入 `node_modules` 和編譯工具
- `output: 'standalone'` 配合 Dockerfile，讓 image 非常小

### B-2. Workflow 三個 Job 解說（7 min）

打開 `.github/workflows/deploy.yml`：

```yaml
name: Build, Push & Deploy to Railway

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Build（確認沒有編譯錯誤）
        run: npm run build

  docker-build-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/hello-world-railway:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/hello-world-railway:${{ github.sha }}

  deploy-to-railway:
    needs: docker-build-push
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Railway Deploy
        run: |
          curl -X POST "${{ secrets.RAILWAY_WEBHOOK_URL }}"
```

**三個 Job 的依賴鏈**：

```
test ── needs ──► docker-build-push ── needs ──► deploy-to-railway
```

**講解要點**：
- 每個 Job 都在**獨立 Runner** 上跑（全新機器）
- `needs` 讓前一個失敗，後面就被 skip
- 兩個 tag：`latest`（最新）+ git SHA（可追蹤、可回滾）
- `docker/build-push-action` 自動幫你 `docker build` + `docker push`

### B-3. 展示 Secrets 與 Railway（3 min）

- GitHub repo → Settings → Secrets and variables → Actions：展示三個 Secret 的名稱（值看不到）
- Railway → 專案 → Settings → Deploy Hooks：展示 Webhook URL 怎麼生成的

### B-4. 現場修改 + Push（3 min）

修改 `app/page.js`：

```javascript
<h1>Hello from Railway! 🚂</h1>
```

```bash
git add . && git commit -m "Update Railway demo greeting" && git push
```

### B-5. 即時觀看 Pipeline（5 min）

切到 Actions 頁面：

1. 🟡 Pipeline 開始
2. ✅ `test` Job 完成（~30s）
3. 🟡 `docker-build-push` 開始（~2-3 min）
4. ✅ Docker image push 完成
5. 🟡 `deploy-to-railway` 觸發 Webhook
6. ✅ 全部完成

**講解要點**：
- 展示 Actions UI 的 Job 依賴關係圖
- log 裡 Secrets 的值都被遮成 `***`

### B-6. 驗證結果（4 min）

1. **Docker Hub**：到 `hub.docker.com/r/{帳號}/hello-world-railway` → 看到 `latest` 和 `{sha}` 兩個 tag
2. **Railway**：儀表板顯示 `Deploying` → `Active`
3. **成品網址**：`https://your-app.railway.app` → 看到新版本

### B-7. 串整個故事（2 min）

> 「我只是 push 一行 code。後面的事情——測試、Build Docker Image、Push 上 Docker Hub、通知 Railway 部署——全部在 3-5 分鐘內自動完成。這就是 CI/CD 的威力。」

---

## 緊急備案

| 狀況 | 解決方案 |
|------|---------|
| Actions 排隊跑太慢 | 先講下一段，回來再看；或用預先跑成功的截圖 |
| Docker Hub 登入失敗 | 檢查 `DOCKERHUB_TOKEN` 權限（Read & Write） |
| Docker Hub push 失敗 | 檢查 image 名稱，備案只 demo 到 `docker build` |
| Railway Webhook 沒反應 | 檢查 URL，備案用 Railway 儀表板手動 Redeploy |
| GitHub Pages 404 | 確認 `basePath` 對應 repo 名稱、`gh-pages` branch 已經產生 |
| 網路不穩 | 使用預先錄好的 Demo 影片或截圖 |

---

## 回顧：三個 Demo 的關鍵差異

| | Demo 1 | Demo A | Demo B |
|---|-------|-------|-------|
| 目的 | 熱身：看 Actions 能跑 | 真實靜態部署 | 完整容器化 CI/CD |
| 範例 | Echo 指令 | Next.js 靜態站 | Next.js + Docker |
| 部署目標 | 無 | GitHub Pages | Railway |
| Job 數 | 1 | 1 | 3 |
| Secrets 數 | 0 | 0 | 3 |
| 學到什麼 | YAML 結構、Runner | Permissions、官方 Action | Docker 整合、Secrets、Job 依賴、Deploy Hook |
