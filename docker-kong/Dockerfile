FROM kong/kong:3.3.1


USER root
RUN apt update && apt install -y unzip git
RUN luarocks install kong-oidc
RUN luarocks install kong-plugin-jwt-keycloak

USER kong
