import * as k8s from "@pulumi/kubernetes";

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

import * as otel from "./crd/opentelemetry/v1alpha1";
import { interpolate } from "@pulumi/pulumi";

// const openTelemetryOperator = new k8s.helm.v3.Release("opentelemetry-operator", {
//   namespace: "opentelemetry-operator-system",
//   createNamespace: true,
//   chart: "opentelemetry-operator",
//   version: "0.39.1",
//   values: {},
//   repositoryOpts: {
//     repo: "https://open-telemetry.github.io/opentelemetry-helm-charts",
//   },
// });

// const myInstrumentation = new otel.Instrumentation(
//   "my-instrumentation",
//   {
//     metadata: {
//       name: "my-instrumentation",
//       namespace: "default",
//     },
//     spec: {
//       exporter: {
//         endpoint: interpolate`http://${signoz.name}-otel-collector.${signoz.namespace}.svc.homelab.local:4317`,
//       },
//       propagators: ["tracecontext", "baggage", "b3"],
//       sampler: {
//         type: "parentbased_traceidratio",
//         argument: "1",
//       },
//     },
//   },
//   {
//     dependsOn: [openTelemetryOperator],
//   }
// );
