FROM alpine:latest

RUN apk add --no-cache curl

COPY docker-entrypoint.sh /usr/local/bin/
ADD artifacts /tmp/artifacts
ENTRYPOINT ["docker-entrypoint.sh"]