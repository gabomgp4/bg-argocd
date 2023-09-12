import { interpolate } from "@pulumi/pulumi";
import * as keycloak from "./crd/k8s/v2alpha1"; // Replace this with the path to your generated module
import * as cnpg from "./crd/postgresql/v1";
import * as k8s from "@pulumi/kubernetes";
import cluster from "cluster";
import * as kong from "./crd/configuration/v1";
import {config} from "./config";
import {cloudNativePg, localStorageClass} from './storage'

var keycloakNs = new k8s.core.v1.Namespace("keycloak");

const keyCloakDb = new cnpg.Cluster("keycloak-db", {
  metadata: {
    namespace: keycloakNs.metadata.name,
  },
  spec: {
    instances: 3,
    storage: {
      size: "1Gi",
    },
  },
}, {
  dependsOn: [cloudNativePg, localStorageClass],
});


const keycloakVersion = "22.0.1"

const keycloaksCrd = new k8s.yaml.ConfigFile("keycloak-crd", {
  file: `https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/${keycloakVersion}/kubernetes/keycloaks.k8s.keycloak.org-v1.yml`,
});

const keycloakRealImports = new k8s.yaml.ConfigFile("keycloak-real-imports", {
  file: `https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/${keycloakVersion}/kubernetes/keycloakrealmimports.k8s.keycloak.org-v1.yml`,
}, {
  dependsOn: [keycloaksCrd],
});

const keycloakOperator = new k8s.yaml.ConfigFile("keyclock-operator", {
  file: `https://raw.githubusercontent.com/keycloak/keycloak-k8s-resources/${keycloakVersion}/kubernetes/kubernetes.yml`,
}, {
  dependsOn: [keycloakRealImports],
});

const dbSecret = interpolate`${keyCloakDb.metadata.apply((metadata) => metadata?.name)}-app`;

// Adapted from https://github.com/keycloak/keycloak/issues/14666#issuecomment-1461028049
const keyCloakDbInstance = interpolate`${keyCloakDb.metadata.apply((metadata) => metadata?.name)}`;
const keyCloak = new keycloak.Keycloak("keycloak", {
  metadata: {
    namespace: keycloakNs.metadata.name,
  },
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
}, {
  dependsOn: [keycloakOperator],
});

// Put on the service as annotiation konghq.com/override":"keycloak-kong-ingress"
const keycloakKongIngress = new kong.KongIngress("keycloak-kong-ingress", {
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

const ingress = new k8s.networking.v1.Ingress("keycloak", {
  metadata: {
    namespace: keycloakNs.metadata.name,
    annotations: {
      "konghq.com/plugins": "https-port-plugin",
    },
  },
  spec: {
    ingressClassName: "kong",
    rules: [
      {
        host: `keycloak.${config.rootDomain}`,
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
