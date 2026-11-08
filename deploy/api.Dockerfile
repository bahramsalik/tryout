# Tryout API container (App Runner). Build from the repo root:
#   docker build --platform linux/amd64 -f deploy/api.Dockerfile -t tryout-api .
FROM node:22-slim
ENV NODE_ENV=production PORT=8080
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
# tsx (a regular dependency) runs the TypeScript directly.
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY shared /app/shared
COPY server/src ./src
COPY server/tsconfig.json ./
EXPOSE 8080
CMD ["npx", "tsx", "src/index.ts"]
