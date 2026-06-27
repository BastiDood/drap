FROM node:24.18.0-alpine3.24 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

WORKDIR /app

# Fetch dependencies into the pnpm store.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=$PNPM_HOME/store \
    pnpm fetch

# Install node_modules/ from the cached store.
RUN --mount=type=cache,id=pnpm,target=$PNPM_HOME/store \
    pnpm install --offline --frozen-lockfile --config.confirm-modules-purge=false

FROM base AS migrate

# Drizzle config, migration files, and schema files are provided as bind mounts.
ENTRYPOINT ["pnpm", "exec", "drizzle-kit", "migrate"]

FROM base AS build

ARG PUBLIC_ORIGIN
ENV ORIGIN=${PUBLIC_ORIGIN}

# Build the app and prune dev dependencies. The final image only copies
# build/ and node_modules/ from this stage.
COPY vite.config.js tsconfig.json ./
COPY static/ static/
COPY src/ src/
RUN pnpm build && pnpm prune --prod --ignore-scripts --config.confirm-modules-purge=false

FROM gcr.io/distroless/nodejs24-debian13:nonroot-${TARGETARCH} AS deploy

WORKDIR /app
COPY --from=build /app/node_modules node_modules/
COPY --from=build /app/build/ build/

ARG PUBLIC_ORIGIN
ENV ORIGIN=${PUBLIC_ORIGIN}

CMD ["build/index.js"]
