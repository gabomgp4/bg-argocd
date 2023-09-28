import * as k8s from "@pulumi/kubernetes";
import * as kong from "./crd/configuration/v1";
import * as keycloak from "./keycloak";
import { interpolate } from "@pulumi/pulumi";
import { config } from "./config";
import * as telemetry from "./telemetry";
import * as certManager from "./crd/certmanager/v1";

const kongIngress = new k8s.helm.v3.Release("kong-ingress", {
  namespace: "kong",
  createNamespace: true,
  chart: "kong",
  version: "2.25.0",
  repositoryOpts: {
    repo: "https://charts.konghq.com",
  },
  values: {
    replicaCount: 3,
    autoscaling: {
      enabled: false,
    },
    image: {
      repository: "revomatico/docker-kong-oidc",
      tag: "3.3.0-1",
    },
    proxy: {
      type: "NodePort",
    },
    env: {
      PLUGINS: "bundled,oidc",
      LOG_LEVEL: "info",
    },
  },
});

export const keyCloakRoot = `keycloak.${config.rootDomain}`;

const realm = "kong";

const oidcPlugin = new kong.KongClusterPlugin(
  "kong-oidc",
  {
    metadata: {
      name: "oidc",
      annotations: {
        "kubernetes.io/ingress.class": "kong",
      },
      labels: {
        global: "false",
      },
    },
    disabled: false,
    plugin: "oidc",
    config: {
      client_id: "kong-oidc",
      client_secret: "FPhzvjn5hpgr9tzHVsXsCpDUXpT4IHqa", // Generated on keyCloak
      realm: realm,
      discovery: interpolate`https://${keyCloakRoot}/realms/${realm}/.well-known/openid-configuration`,
      scope: "openid",
      redirect_after_logout_uri: interpolate`https://${keyCloakRoot}/auth/realms/${realm}/protocol/openid-connect/logout?redirect_uri=https://echo-server.${config.rootDomain}/`,
      ssl_verify: "yes",
    },
  },
  {
    dependsOn: kongIngress,
  }
);

const httpsPortPlugin = new kong.KongClusterPlugin(
  "https-port-plugin",
  {
    metadata: {
      name: "https-port-plugin",
      annotations: {
        "kubernetes.io/ingress.class": "kong",
      },
      labels: {
        global: "false",
      },
    },
    disabled: false,
    plugin: "post-function",
    config: {
      access: [`ngx.var.upstream_x_forwarded_port=${443}`],
    },
  },
  {
    dependsOn: kongIngress,
  }
);

export const urn = kongIngress.urn;
