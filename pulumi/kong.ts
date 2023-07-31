import * as k8s from "@pulumi/kubernetes";
import * as kong from "./crd/configuration/v1";

const nginxIngress = new k8s.helm.v3.Chart("kong-ingress", {
  chart: "kong",
  skipCRDRendering: true, //enable with new cluster from scratch
  version: "2.25.0",
  fetchOpts: {
    repo: "https://charts.konghq.com",
  },
  values: {
    image: {
      repository: "revomatico/docker-kong-oidc",
      tag: "3.3.0-1",
    },
    proxy: {
      type: "NodePort",
    },
    env: {
      PLUGINS: "bundled,oidc",
      LOG_LEVEL: "debug",
    },
  },
});

const port = 32611;

const oidcPlugin = new kong.KongClusterPlugin("kong-oidc", {
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
    client_secret: "DYohG9nSWBWKwiguFvyflZ04w9EEfmgm", // Generated on keyCloak
    realm: "kong",
    discovery: `https://keycloak:${port}/realms/kong/.well-known/openid-configuration`,
    scope: "openid",
    redirect_after_logout_uri: `https://keycloak:${port}/auth/realms/kong-oidc/protocol/openid-connect/logout?redirect_uri=http://grafana`,
    ssl_verify: "no",
  },
});

const httpsPortPlugin = new kong.KongClusterPlugin("https-port-plugin", {
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
    access: [`ngx.var.upstream_x_forwarded_port=${port}`],
  },
});

const grafanaIngress = new k8s.networking.v1.Ingress("grafana", {
  metadata: {
    namespace: "cattle-monitoring-system",
    annotations: {
      "konghq.com/plugins": "oidc",
    },
  },
  spec: {
    ingressClassName: "kong",
    rules: [
      {
        host: "grafana",
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: "rancher-monitoring-grafana",
                  port: {
                    number: 80,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
});

export const urn = nginxIngress.urn;
