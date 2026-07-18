# Multi-stage build for ModernShop
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Use npm install instead of npm ci to handle Tailwind CSS v4 native bindings
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db.json ./db.json
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
