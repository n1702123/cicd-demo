---
marp: true
theme: default
paginate: true
header: '03 - HelloWorld 實作'
style: |
  section {
    font-size: 22px;
    padding: 50px 60px;
  }
  h1 {
    font-size: 38px;
  }
  h2 {
    font-size: 28px;
    margin-bottom: 0.4em;
  }
  h3 {
    font-size: 22px;
  }
  table {
    font-size: 17px;
    margin: 0 auto;
  }
  th, td {
    padding: 6px 10px;
  }
  pre, code {
    font-size: 15px;
  }
  pre {
    line-height: 1.3;
  }
  blockquote {
    font-size: 20px;
  }
  section.small {
    font-size: 18px;
  }
  section.small pre, section.small code {
    font-size: 13px;
  }
---

# 03 - 純 HTML Hello World + GitHub Actions + GitHub Pages

---

## 目標

用 GitHub Actions 自動部署純 HTML 靜態網站到 GitHub Pages：
> Push code → 自動部署到網路上（不需要 build）

---

## 整體流程

```
開發者 push code 到 GitHub
        │
        ▼
GitHub Actions 自動觸發
        │
        ├── Step 1: Checkout 程式碼
        └── Step 2: 推到 gh-pages branch
        │
        ▼
  GitHub Pages 更新網站
  ✅ 網址：https://{帳號}.github.io/{repo名稱}/
```

---

## 專案結構

```
demo-01-github-pages/
├── .github/
│   └── workflows/
│       └── deploy.yml   ← GitHub Actions 設定
└── index.html           ← 首頁（Hello World）
```

---

## index.html

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>Hello World</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
```

---

## GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]       # push 到 main 時自動觸發
  workflow_dispatch:        # 也可以手動觸發

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write       # 需要寫入權限推到 gh-pages branch

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .    # 直接發布根目錄
```

---

## GitHub 上的設定步驟

1. 把專案 push 到 GitHub
2. 等 Actions 跑完（約 30 秒）
3. 到 repo → **Settings** → **Pages**
4. Source 選 **Deploy from a branch**
5. Branch 選 **`gh-pages`**，資料夾選 **`/ (root)`**
6. 按 Save

---

## 完成後

網址：

```
https://{你的GitHub帳號}.github.io/demo-01-github-pages/
```

每次 push 到 main，網站就會自動更新。
