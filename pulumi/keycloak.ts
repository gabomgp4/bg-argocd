import { interpolate } from "@pulumi/pulumi";
import * as keycloack from "./crd/k8s/v2alpha1"; // Replace this with the path to your generated module
import * as cnpg from "./crd/postgresql/v1";
import * as k8s from "@pulumi/kubernetes";

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
const keyCloak = new keycloack.Keycloak("keycloak", {
  spec: {
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
      }
    ],
    ingress: {
      enabled: false,
    },
    db: {
      host: keyCloakDb.status.apply((status) => status?.writeService!),
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

const keyCloakService = interpolate`${keyCloak.metadata.apply((metadata) => metadata?.name)}-service`

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
