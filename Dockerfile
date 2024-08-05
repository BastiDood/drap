# syntax=docker/dockerfile:1.7-labs
FROM node:22.5.1-alpine3.20 AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
WORKDIR /drap
COPY pnpm-lock.yaml ./
RUN pnpm fetch
COPY . ./
RUN pnpm install --recursive --offline
RUN pnpm --filter=drap-email --prod deploy /prod/email && pnpm --filter=drap-app --prod deploy /prod/app
RUN pnpm --parallel --recursive build && mv email/dist/ /prod/email && mv app/build/ /prod/app

FROM node:22.5.1-alpine3.20 AS deploy
COPY --from=build /prod/ /drap/
EXPOSE 3000
USER node

# This is the command to start the SvelteKit server. The background email worker
# should be spawned as a separate process somehow. When deploying to Fly.io
# (see the fly.toml), we use Process Groups to spawn both the main SvelteKit
# server and the email worker at the same time. For the sake of supplying a
# # default entry point, the following `CMD` starts the SvelteKit server.
CMD ["node", "/prod/app/build/index.js"]
