import * as monitoring from "./crd/monitoring";
import * as k8s from "@pulumi/kubernetes";

const certManagerCrds = new k8s.yaml.ConfigFile("cert-manager-crds", {
  file: "https://github.com/cert-manager/cert-manager/releases/download/v1.12.3/cert-manager.crds.yaml",
});

const certManager = new k8s.helm.v3.Release(
  "cert-manager",
  {
    chart: "cert-manager",
    version: "1.12.3",
    repositoryOpts: {
      repo: "https://charts.jetstack.io",
    },
  },
  {
    dependsOn: certManagerCrds,
  }
);

const openTelemetryOperator = new k8s.helm.v3.Release(
  "open-telemetry",
  {
    chart: "opentelemetry-operator",
    version: "0.35.0",
    repositoryOpts: {
      repo: "https://open-telemetry.github.io/opentelemetry-helm-charts",
    },
  },
  {
    dependsOn: certManager,
  }
);

export const kubePrometheusStack = new k8s.helm.v3.Release("kube-prometheus-stack", {
  chart: "kube-prometheus-stack",
  version: "48.3.1",
  repositoryOpts: {
    repo: "https://prometheus-community.github.io/helm-charts",
  },
});
