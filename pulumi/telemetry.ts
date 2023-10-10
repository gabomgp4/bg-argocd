import * as k8s from "@pulumi/kubernetes";
import { config } from "./config";
import { interpolate } from "@pulumi/pulumi";

export const signoz = new k8s.helm.v3.Release("signoz", {
  namespace: "signoz",
  createNamespace: true,
  chart: "signoz",
  version: "0.26.0",
  values: {
    clickhouse: {
      settings: {
        "prometheus/metrics": true,
        "prometheus/asynchronous_metrics": true,
        "prometheus/events": true,
      },
    },
  },
  repositoryOpts: {
    repo: "https://charts.signoz.io",
  },
});

const app = "signoz";
const domain = `${app}.${config.rootDomain}`;

var service = interpolate `${signoz.status.name}-otel-collector`

const ingress = new k8s.networking.v1.Ingress(`${app}-app`, {
  metadata: {
    name: "signoz-ingress",
    namespace: "signoz",
    annotations: {
      "konghq.com/plugins": "https-port-plugin",
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
                  name: service,
                  port: {
                    name: "otlp-http",
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