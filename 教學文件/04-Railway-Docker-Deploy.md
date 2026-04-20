# 04 - Node.js + Redis + Docker + GitHub Actions + Railway

## 目標

用 GitHub Actions 自動 Build Docker Image、推到 Docker Hub、再部署到 Railway：
> Push code → 測試 → Build Docker Image → Push to Docker Hub → Railway 拉 image 重新部署

---

## 與 GitHub Pages 的差異

| | GitHub Pages（Demo A）| Railway（Demo B）|
|---|---|---|
| 類型 | 靜態網站 | 真正的 Server + 資料庫 |
| 技術棧 | 純 HTML | Node.js 原生 http + Redis |
| 支援動態功能 | 不支援 | 支援（API、持久化計數器） |
| 使用 Docker | 不需要 | 需要 |
| 費用 | 免費 | 免費方案可用 |
| 網址格式 | `帳號.github.io/repo名稱` | `your-app.railway.app` |

---

## 整體流程

```
開發者 push code 到 GitHub
        │
        ▼
┌─────────────────────┐
│ Job 1: test         │
│  npm ci             │
│  npm run check      │  ← node --check 語法檢查
└────────┬────────────┘
         │ 通過
         ▼
┌─────────────────────┐
│ Job 2: docker push  │
│  docker login       │
│  docker build       │
│  docker push        │  → Docker Hub 有新 image
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Job 3: deploy       │
│  railway redeploy   │  ← 用 Railway CLI 觸發重新部署
└────────┬────────────┘
         │
         ▼
  Railway 重新拉 image 部署
  ✅ 網站自動更新
  https://your-app.railway.app
```

---

## 專案結構

```
demo-02-railway-docker/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions（三個 Job）
├── public/
│   └── index.html              ← 前端（計數器 UI）
├── server.js                   ← Node.js 主程式（HTTP + Redis）
├── package.json                ← 依賴 ioredis
├── package-lock.json
├── Dockerfile                  ← 單階段（Node.js app 很小）
├── docker-compose.yml          ← 本機開發（app + Redis）
└── .dockerignore
```

---

## 關鍵設定

### server.js（重點）

```js
import http from 'http'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')
const PORT = process.env.PORT ?? 3000

// GET  /api/counter → 讀計數
// POST /api/counter → 加 1
// GET  /api/info    → 回傳 hostname / Redis 狀態
```

- 本機開發：`REDIS_URL` 透過 `docker-compose.yml` 指到內建 `redis` service
- Railway 生產：Railway 的 Redis plugin 會注入 `REDIS_URL`

### Dockerfile（單階段就夠）

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
```

> **為什麼不用多階段？** 這個 app 沒有編譯步驟（純 Node.js），也沒有 `devDependencies` 要剝離，單階段已經夠小。多階段 Build 的時機是：需要編譯（Next.js / TypeScript）、或有大量 dev-only 工具。

### docker-compose.yml（本機開發）

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

本機一行 `docker compose up` 就能同時跑 app + Redis。

---

## 需要設定的 Secrets（共 4 個）

到 GitHub repo → Settings → Secrets and variables → Actions，新增：

| Secret 名稱 | 值 | 哪裡取得 |
|------------|-----|---------|
| `DOCKERHUB_USERNAME` | Docker Hub 帳號 | Docker Hub 帳號頁面 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token（Read & Write）| Docker Hub → Account Settings → Security → New Access Token |
| `RAILWAY_TOKEN` | Railway Account Token | Railway → Account Settings → Tokens |
| `RAILWAY_SERVICE_ID` | Service ID（UUID）| Railway → 專案 → Service → Settings → Service ID |

> 為什麼不用 Webhook？Webhook 只能觸發「最近一次部署」重跑，無法精準指定 service。用 CLI + Token 更彈性，也能搭配多環境（staging / production）。

---

## Railway 設定步驟

### 1. 建立 Railway 帳號

前往 [railway.app](https://railway.app) 用 GitHub 登入。

### 2. 建立新專案 — 掛上 Docker Hub image

```
New Project → Deploy from Docker Image
```

填入 Docker Hub image 名稱：
```
你的帳號/hello-world-railway:latest
```

### 3. 加一個 Redis plugin

```
專案 → + New → Database → Add Redis
```

Railway 會自動把 `REDIS_URL` 注入到 app service 的環境變數。

### 4. 取得 Service ID 與 Account Token

```
Service → Settings → Service ID      （複製 UUID）
Account → Tokens → Create New Token   （複製 Token）
```

兩個值分別貼到 GitHub Secrets `RAILWAY_SERVICE_ID`、`RAILWAY_TOKEN`。

### 5. PORT 自動處理

Railway 會注入 `PORT` 環境變數，`server.js` 已讀取 `process.env.PORT`，不用額外設定。

---

## GitHub Actions Workflow 解說

實際檔案：[`.github/workflows/deploy.yml`](../demo-02-railway-docker/.github/workflows/deploy.yml)

```yaml
name: Build, Push & Deploy to Railway

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  # Job 1: 測試（語法檢查）
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run check          # node --check server.js

  # Job 2: Build Docker Image 並 Push
  docker-build-push:
    needs: test                     # 測試通過才執行
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Login to Docker Hub
        uses: docker/login-action@v4
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/hello-world-railway:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/hello-world-railway:${{ github.sha }}

  # Job 3: 通知 Railway 部署
  deploy-to-railway:
    needs: docker-build-push
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Railway Deploy
        run: |
          npm install -g @railway/cli
          railway redeploy --service ${{ secrets.RAILWAY_SERVICE_ID }} --yes
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 三個 Job 的依賴鏈

```
test ── needs ──► docker-build-push ── needs ──► deploy-to-railway
```

- 每個 Job 都在**獨立 Runner** 上跑（全新機器）
- `needs` 確保前一個失敗，後面 Skip
- 兩個 tag：`latest`（方便取用）+ `${{ github.sha }}`（可追蹤、可回滾）

---

## 完成後的效果

```
git push
  └── 約 2-4 分鐘後
       └── https://your-app.railway.app 網站更新完成
       └── Redis 計數不會歸零（持久化）
```

---

## 常見問題

### 1. Railway 沒有重新部署
→ 檢查 `RAILWAY_TOKEN` 與 `RAILWAY_SERVICE_ID` 是否正確
→ 在 Actions log 看 `railway redeploy` 的輸出

### 2. Docker image 拉不到
→ 確認 Railway 設定的 image 名稱與 Docker Hub 一致
→ 確認 Docker Hub image 是 Public（或在 Railway 設定 Registry 憑證）

### 3. Redis 連線失敗（網站起來但 counter 壞掉）
→ 確認 Railway 有加 Redis plugin，且 `REDIS_URL` 有注入到 app service
→ 點 `/api/info` 看 `redisStatus` 是否 `connected`

### 4. 本機 `docker compose up` 報錯
→ 確認本機有安裝 Docker Desktop
→ 3000 / 6379 port 沒被佔用

---

## 回顧

| | Demo A（GitHub Pages）| Demo B（Railway）|
|---|---|---|
| 適合場景 | 靜態網站、文件、部落格 | 有後端邏輯、需要資料庫的 Web App |
| 部署目標 | GitHub Pages | Railway（Docker Container + Redis）|
| 容器化 | 不需要 | Dockerfile |
| Secrets 數量 | 0 個 | 4 個 |
| Job 數 | 1 | 3（test → build-push → deploy）|

> Demo 專案位置：[`demo-02-railway-docker/`](../demo-02-railway-docker/)
