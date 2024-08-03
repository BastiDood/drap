# https://pnpm.io/docker

FROM node:22.5.1-alpine3.20 as build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
WORKDIR /drap
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM build AS build-email
RUN pnpm --filter=drap-email build
RUN pnpm --filter=drap-email --prod deploy /prod/email

FROM node:22.5.1-alpine3.20 AS email
WORKDIR /app
COPY --from=build-email /prod/email .
CMD ["node", "--enable-source-maps", "dist/main.js"]

FROM build AS build-app
RUN pnpm --filter=drap-app build
RUN pnpm --filter=drap-app --prod deploy /prod/app

FROM node:22.5.1-alpine3.20 AS app
WORKDIR /app
COPY --from=build-app /prod/app .
EXPOSE 3000
CMD ["node", "build/index.js"]
