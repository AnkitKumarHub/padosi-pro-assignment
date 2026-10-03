FROM node:22-bookworm-slim

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare pnpm@11.28.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY tsconfig.json ./
COPY drizzle ./drizzle
COPY padosipro_task_catalogue_seed.json ./
COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.ts"]
