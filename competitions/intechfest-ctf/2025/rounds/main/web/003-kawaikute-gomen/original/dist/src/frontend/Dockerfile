# syntax=docker/dockerfile:1

# Install deps and build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps
COPY app ./app
COPY next.config.js ./next.config.js
COPY postcss.config.js ./postcss.config.js
COPY tailwind.config.js ./tailwind.config.js
RUN npm run build

# Run prod server
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# create user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# only copy the minimal standalone output
COPY --from=builder /app/.next/standalone ./ 
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "PORT=3000 HOSTNAME=0.0.0.0 node server.js"]
