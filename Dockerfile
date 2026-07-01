# Stage 1: Build client and server
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm install
COPY client/ ./client/
COPY server/ ./server/
RUN npm run build

# Stage 2: Runner production container
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY server/package*.json ./server/
RUN npm install --omit=dev
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server/dist/index.js"]
