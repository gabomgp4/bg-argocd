import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { config } from "./config";

// Namespace
const echoserverNamespace = new k8s.core.v1.Namespace("echoserver", {
  metadata: {
    name: "echoserver",
  },
});

// Deployment
const echoserverDeployment = new k8s.apps.v1.Deployment("echoserver", {
  metadata: {
    name: "echoserver",
    namespace: echoserverNamespace.metadata.name,
  },
  spec: {
    replicas: 5,
    selector: {
      matchLabels: {
        app: "echoserver",
      },
    },
    template: {
      metadata: {
        labels: {
          app: "echoserver",
        },
      },
      spec: {
        containers: [
          {
            name: "echoserver",
            image: "ealen/echo-server:latest",
            imagePullPolicy: "IfNotPresent",
            ports: [
              {
                containerPort: 80,
              },
            ],
            env: [
              {
                name: "PORT",
                value: "80",
              },
            ],
          },
        ],
      },
    },
  },
});

// Service
const service = new k8s.core.v1.Service("echoserver", {
  metadata: {
    name: "echoserver",
    namespace: echoserverNamespace.metadata.name,
  },
  spec: {
    ports: [
      {
        name: "http",
        port: 80,
        targetPort: 80,
        protocol: "TCP",
      },
    ],
    type: "ClusterIP",
    selector: {
      app: "echoserver",
    },
  },
});

const app = "echo-server";
const domain = `${app}.${config.rootDomain}`;

// Ingress
const ingress = new k8s.networking.v1.Ingress(`${app}-app`, {
  metadata: {
    name: app,
    namespace: service.metadata.namespace,
    annotations: {
      "konghq.com/plugins": "https-port-plugin,oidc",
      "cert-manager.io/cluster-issuer": "letsencrypt-prod",
    },
  },
  spec: {
    ingressClassName: "kong",
    tls: [
      {
        hosts: [domain],
        secretName: `${domain}-tls`,
      },
    ],
    rules: [
      {
        host: domain,
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: service.metadata.name,
                  port: {
                    name: "http",
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
