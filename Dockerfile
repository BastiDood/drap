FROM node:24.14.0-alpine3.23 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

WORKDIR /app

# Fetch dependencies into the pnpm store (lockfile-only).
RUN --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    --mount=type=cache,id=pnpm,target=$PNPM_HOME/store \
    pnpm fetch

# Install node_modules/ from the cached store.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    --mount=type=cache,id=pnpm,target=$PNPM_HOME/store \
    pnpm install --offline

FROM base AS migrate

# Migration files are provided as bind mounts.
ENTRYPOINT ["pnpm", "db:migrate"]

FROM base AS build

# Build the app and prune dev dependencies. Bind-mounted source files
# are not baked into the layer — only build/ and node_modules/ persist.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    --mount=type=bind,source=svelte.config.js,target=svelte.config.js \
    --mount=type=bind,source=vite.config.js,target=vite.config.js \
    --mount=type=bind,source=tsconfig.json,target=tsconfig.json \
    --mount=type=bind,source=src,target=src \
    --mount=type=bind,source=static,target=static \
    pnpm build && pnpm prune --prod --ignore-scripts

FROM gcr.io/distroless/nodejs24-debian13:nonroot-${TARGETARCH} AS deploy

WORKDIR /app
COPY --from=build /app/node_modules node_modules/
COPY --from=build /app/build/ build/

ENV PORT=3000
EXPOSE ${PORT}
CMD ["build/index.js"]
