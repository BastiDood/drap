FROM node:24.5.0-alpine3.22 AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

WORKDIR /app

# Only fetch the dependencies into the virtual store for better Docker caching.
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm fetch

# Then copy the project files and build the `node_modules/` (with dev dependencies).
COPY . ./
RUN pnpm install --offline

# build/ and node_modules/ are now ready for production.
RUN pnpm build && pnpm prune --prod --ignore-scripts

FROM gcr.io/distroless/nodejs24-debian12:nonroot-amd64 AS deploy

WORKDIR /app
COPY --from=build /app/node_modules node_modules/
COPY --from=build /app/build/ build/

ENV PORT=3000
EXPOSE ${PORT}
CMD ["build/index.js"]
