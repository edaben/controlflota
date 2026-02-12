FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

# Use ts-node-dev for hot-reload: auto-restarts when files change
CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "--poll", "src/index.ts"]
