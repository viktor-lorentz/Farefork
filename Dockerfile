FROM node:24-slim

WORKDIR /app
ENV SKIP_FONT_DOWNLOAD=1

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY packages/shared/package.json packages/shared/
RUN npm ci --ignore-scripts --include=dev --workspace=@repo/api --workspace=@repo/shared

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

WORKDIR /app/apps/api
ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "--import", "tsx", "src/node.ts"]
