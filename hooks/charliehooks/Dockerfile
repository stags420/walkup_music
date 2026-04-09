FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY hooks/charliehooks/src ./hooks/charliehooks/src
COPY .charlie/instructions/LINEAR_FLOW.md ./.charlie/instructions/LINEAR_FLOW.md

RUN mkdir -p /out && \
  npx tsc hooks/charliehooks/src/*.ts \
    --outDir /out \
    --rootDir hooks/charliehooks/src \
    --module NodeNext \
    --moduleResolution NodeNext \
    --target ES2022 \
    --lib ES2022,DOM \
    --types node \
    --strict \
    --skipLibCheck \
    --esModuleInterop \
    --allowSyntheticDefaultImports

FROM node:22-bookworm-slim

WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=8787

COPY --from=build /out ./dist
COPY --from=build /app/.charlie ./.charlie

EXPOSE 8787

CMD ["node", "dist/server.js"]

