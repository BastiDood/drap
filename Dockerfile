# syntax=docker/dockerfile:1.7-labs

# https://pnpm.io/docker
FROM node:22.5.1-alpine3.20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
WORKDIR /drap
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
RUN pnpm --parallel --recursive build
RUN pnpm --filter=drap-email --prod deploy /prod/email
RUN pnpm --filter=drap-app --prod deploy /prod/app

FROM node:22.5.1-alpine3.20 AS deploy
COPY --from=build /prod /prod
EXPOSE 3000
CMD tail -f /dev/null
