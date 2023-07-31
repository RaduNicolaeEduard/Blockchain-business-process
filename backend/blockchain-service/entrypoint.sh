#!/bin/bash

# creating keycloak.json from env variables

echo "Creating keycloak.json from .env file"
set -a
. .env
set +a

cat >/usr/src/app/.env\
<<-_EOL_
{
    "realm": ${BLOCKCHAIN_SERVICE_KEYCLOAK_REALM},
    "auth-server-url": ${BLOCKCHAIN_SERVICE_KEYCLOAK_BASE_URL},
    "ssl-required": "external",
    "bearer-only": true,
    "resource": ${BLOCKCHAIN_SERVICE_KEYCLOAK_CLIENT},
    "credentials": {
      "secret": ${BLOCKCHAIN_SERVICE_KEYCLOAK_CLIENT_SECRET}
    },
    "confidential-port": 0
}
_EOL_
sed -i 's/<policy domain="coder" rights="none" pattern="PDF" \/>/<policy domain="coder" rights="read|write" pattern="PDF" \/>/' /etc/ImageMagick-6/policy.xml
node /usr/src/app/index.js