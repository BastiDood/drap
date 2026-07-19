FROM ghcr.io/cryptaliagy/httpget:0.1.23 AS httpget

FROM public.ecr.aws/zinclabs/openobserve:v0.91.2

COPY --from=httpget /httpget /httpget
