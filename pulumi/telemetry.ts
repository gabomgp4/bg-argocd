import * as k8s from "@pulumi/kubernetes";

export const signoz = new k8s.helm.v3.Release("signoz", {
  chart: "signoz",
  version: "0.23.0",
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
