# syntax=docker/dockerfile:1.7

FROM node:22.5.1-alpine AS base
WORKDIR /app
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@10.22.0 --activate

FROM base AS builder
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma:generate
RUN pnpm build
RUN pnpm prune --prod

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 3009
CMD ["node", "dist/server.js"]

