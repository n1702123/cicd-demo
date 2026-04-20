FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Railway 會自動設定 PORT 環境變數
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
