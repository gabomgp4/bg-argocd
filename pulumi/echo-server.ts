import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import {config} from "./config";

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
const echoserverService = new k8s.core.v1.Service("echoserver", {
  metadata: {
    name: "echoserver",
    namespace: echoserverNamespace.metadata.name,
  },
  spec: {
    ports: [
      {
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

// Ingress
const echoserverIngress = new k8s.networking.v1.Ingress("echoserver", {
  metadata: {
    name: "echoserver",
    namespace: echoserverNamespace.metadata.name,
    annotations: {
      "konghq.com/plugins": "https-port-plugin",
    },
  },
  spec: {
    ingressClassName: "kong",
    rules: [
      {
        host: `echo-server.${config.rootDomain}`,
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: "echoserver",
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

export const ingress = echoserverIngress.metadata.name;
