FROM ghcr.io/cryptaliagy/httpget:0.1.23 AS httpget

FROM databasus/databasus:v3.47.1

COPY --from=httpget /httpget /httpget
