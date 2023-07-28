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
    hostname: {
      hostname: "keycloak",
      strict: false,
      strictBackchannel: false,
    },
    additionalOptions: [
      {
        name: "hostname-strict-https",
        value: "false",
      },
      {
        name: "hostname-port",
        value: "30907",
      },
    ],
    http: {
      httpEnabled: true,
    },
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

const ingress = new k8s.networking.v1.Ingress("keycloack", {
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
                  name: interpolate `${keyCloak.metadata.apply(metadata=>metadata?.name)}-service`,
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

export const ingressNameOutput = ingress.metadata.name;

export const selector = keyCloakDb.status.apply((status) => status?.writeService);
