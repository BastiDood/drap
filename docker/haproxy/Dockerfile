FROM ghcr.io/jqlang/jq:1.8.1 AS jq
FROM busybox:1.37.0-uclibc AS busybox

# Download the Spamhaus drop list.
FROM busybox AS drop
COPY --from=jq /jq /bin/jq
ADD https://www.spamhaus.org/drop/drop_v4.json /feeds/drop_v4.json
RUN mkdir -p /out \
  && /bin/jq --raw-output '.. | objects | .cidr? | select(type == "string")' /feeds/drop_v4.json > /out/drop.lst

# Download the Feodo blocklist.
FROM busybox AS feodo
COPY --from=jq /jq /bin/jq
ADD https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json /feeds/feodo.json
RUN mkdir -p /out \
  && /bin/jq --raw-output '.. | objects | .ip_address? | select(type == "string")' /feeds/feodo.json > /out/feodo.lst

# Merge the blocklists into a single file.
FROM busybox AS blocklists
COPY --from=drop /out/drop.lst /inputs/drop.lst
COPY --from=feodo /out/feodo.lst /inputs/feodo.lst
RUN mkdir -p /out \
  && cat /inputs/drop.lst /inputs/feodo.lst | sort -u > /out/external.lst

FROM haproxy:3.3.7-alpine3.23
COPY --from=blocklists /out/external.lst /usr/local/etc/haproxy/external.lst
COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg
COPY allowed-paths.lst /usr/local/etc/haproxy/allowed-paths.lst
