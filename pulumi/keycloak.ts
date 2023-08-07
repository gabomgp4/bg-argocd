import { interpolate } from "@pulumi/pulumi";
import * as keycloack from "./crd/k8s/v2alpha1"; // Replace this with the path to your generated module
import * as cnpg from "./crd/postgresql/v1";
import * as k8s from "@pulumi/kubernetes";
import cluster from "cluster";
import * as kong from "./crd/configuration/v1";

const keyCloakDb = new cnpg.Cluster("keycloak-db", {
  spec: {
    instances: 3,
    storage: {
      size: "1Gi",
    },
  },
});

const dbSecret = interpolate`${keyCloakDb.metadata.apply((metadata) => metadata?.name)}-app`;

// Adapted from https://github.com/keycloak/keycloak/issues/14666#issuecomment-1461028049
const keyCloakDbInstance = interpolate`${keyCloakDb.metadata.apply((metadata) => metadata?.name)}`;
const keyCloak = new keycloack.Keycloak("keycloak", {
  spec: {
    instances: 3,
    additionalOptions: [
      {
        name: "hostname-strict-https",
        value: "false",
      },
      {
        name: "hostname-strict",
        value: "false",
      },
      {
        name: "proxy",
        value: "edge",
      },
    ],
    ingress: {
      enabled: true,
    },
    db: {
      vendor: "postgres",
      host: interpolate`${keyCloakDbInstance}-rw`,
      usernameSecret: {
        name: dbSecret,
        key: "username",
      },
      passwordSecret: {
        name: dbSecret,
        key: "password",
      },
      database: "app",
    },
  },
});

// Put on the service as annotiation konghq.com/override":"keycloak-kong-ingress"
const keycloackKongIngress = new kong.KongIngress("keycloak-kong-ingress", {
  upstream: {
    healthchecks: {
      active: {
        healthy: {
          interval: 2,
          successes: 3
        },
        http_path: "/health/ready",
        type: "http",
        unhealthy: {
          http_failures: 1,
          interval: 5
        }
      },
      passive: {
        healthy: {
          successes: 1
        },
        unhealthy: {
          tcp_failures: 1,
        }
      }
    }
  }
});

const keyCloakInstance = interpolate`${keyCloak.metadata.apply((metadata) => metadata?.name)}`;
const keyCloakService = interpolate`${keyCloakInstance}-service`;

const ingress = new k8s.networking.v1.Ingress("keycloack", {
  metadata: {
    annotations: {
      "konghq.com/plugins": "https-port-plugin",
    },
  },
  spec: {
    ingressClassName: "kong",
    rules: [
      {
        host: "keycloak",
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: keyCloakService,
                  port: {
                    number: 8080,
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

export const ingressHost = keyCloakService;

export const selector = keyCloakDb.status.apply((status) => status?.writeService);
