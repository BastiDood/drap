ARG postgres_major=17
ARG postgres_release=${postgres_major}.7
ARG pgx_ulid_release=0.2.2

FROM scratch AS pgx_ulid
ARG TARGETARCH
ARG postgres_major
ARG pgx_ulid_release
ADD
"https://github.com/pksunkara/pgx_ulid/releases/download/v${pgx_ulid_release}/pgx_ulid-v${pgx_ulid_release}-pg${postgres_major}-${TARGETARCH:?required}-linux-gnu.deb" /tmp/pgx_ulid.deb

FROM postgres:${postgres_release}-trixie AS database
COPY --from=pgx_ulid /tmp/*.deb /tmp/
RUN apt-get update && apt-get install --yes --no-install-recommends /tmp/*.deb && rm --recursive --force /var/lib/apt/lists/* /tmp/*
USER postgres
