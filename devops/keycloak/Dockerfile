
FROM quay.io/keycloak/keycloak:21.0.0 as keycloak_builder

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
#ENV KC_FEATURES=token-exchange

ENV KC_DB=postgres
# copy asset build from above

# import all preconfigured realms
# https://github.com/keycloak/keycloak-quickstarts/blob/latest/quickstart-realm.json
COPY realm_config/ /opt/keycloak/data/import

RUN /opt/keycloak/bin/kc.sh build

#####

FROM quay.io/keycloak/keycloak:21.0.0 as keycloak_runtime
COPY --from=keycloak_builder /opt/keycloak/ /opt/keycloak/
WORKDIR /opt/keycloak
# for demonstration purposes only, please make sure to use proper certificates in production instead
RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:localhost,IP:127.0.0.1" -keystore conf/server.keystore


ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start --import-realm --log-level=DEBUG"]