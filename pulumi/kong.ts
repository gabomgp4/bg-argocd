import * as k8s from "@pulumi/kubernetes";
import * as kong from "./crd/configuration/v1";
import * as keycloak from "./keycloak";
import { interpolate } from "@pulumi/pulumi";
import { config } from "./config";
import * as telemetry from "./telemetry";

const kongIngress = new k8s.helm.v3.Release("kong-ingress", {
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

const port = 32611;

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
      client_secret: "1BbSCCnuf0x1n3OWGOgunBPy5CN8eIw3", // Generated on keyCloak
      realm: "kong",
      discovery: interpolate`https://keycloak:${port}/realms/kong/.well-known/openid-configuration`,
      scope: "openid",
      redirect_after_logout_uri: interpolate`https://keycloak:${port}/auth/realms/kong-oidc/protocol/openid-connect/logout?redirect_uri=https://grafana:${port}/`,
      ssl_verify: "no", //change on production
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
      access: [`ngx.var.upstream_x_forwarded_port=${port}`],
    },
  },
  {
    dependsOn: kongIngress,
  }
);


const grafanaIngress = new k8s.networking.v1.Ingress(
  "grafana",
  {
    metadata: {
      annotations: {
        "konghq.com/plugins": "oidc",
      },
    },
    spec: {
      ingressClassName: "kong",
      rules: [
        {
          host: `grafana.${config.rootDomain}`,
          http: {
            paths: [
              {
                path: "/",
                pathType: "ImplementationSpecific",
                backend: {
                  service: {
                    name: telemetry.kubePrometheusStack.status.name.apply(
                      (name) => name + "-grafana"
                    ),
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
  },
  {
    dependsOn: [kongIngress, telemetry.kubePrometheusStack],
  }
);

export const urn = kongIngress.urn;
