import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import * as clickhouse from "./crd/clickhouse/v1"; // Replace this with the path to your generated module
import * as metallb from "./crd/metallb/v1beta1"; // Replace this with the path to your generated module
import { interpolate } from "@pulumi/pulumi";
const yaml = require("js-yaml");
const crypto = require("crypto");

function computeSHA256(input: string) {
  const hash = crypto.createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

const password = "1082925798";
const codedPassword = computeSHA256(password);

const addressPool = new metallb.AddressPool("address-pool", {
  metadata: {
    name: "address-pool",
    namespace: "default",
  },
  spec: {
    protocol: "layer2",
    addresses: ["198.51.100.0/24"],
  },
});

const pvSimpleInstallation = new clickhouse.ClickHouseInstallation("qryn-db", {
  spec: {
    defaults: {
      templates: {
        dataVolumeClaimTemplate: "data-volume-template",
        logVolumeClaimTemplate: "log-volume-template",
      },
    },
    configuration: {
      clusters: [
        {
          name: "simple",
          layout: {
            shardsCount: 1,
            replicasCount: 1,
          },
        },
      ],
      users: {
        "admin/password_sha256_hex": codedPassword,
        "admin/profile": "default",
        "admin/networks/ip": "::/0",
      },
    },
    templates: {
      volumeClaimTemplates: [
        {
          name: "data-volume-template",
          spec: {
            accessModes: ["ReadWriteOnce"],
            resources: {
              requests: {
                storage: "50Gi",
              },
            },
          },
        },
        {
          name: "log-volume-template",
          spec: {
            accessModes: ["ReadWriteOnce"],
            resources: {
              requests: {
                storage: "100Mi",
              },
            },
          },
        },
      ],
    },
  },
});

const qrynDeployment = new k8s.apps.v1.Deployment("qryn", {
  metadata: {
    name: "qryn",
    labels: {
      "io.metrico.service": "qryn",
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        "io.metrico.service": "qryn",
      },
    },
    strategy: {},
    template: {
      metadata: {
        annotations: {
          "qryn.cmd": "qryn.dev",
        },
        labels: {
          "io.metrico.service": "qryn",
        },
      },
      spec: {
        containers: [
          {
            name: "qryn",
            image: "qxip/qryn",
            env: [
              {
                name: "CLICKHOUSE_AUTH",
                value: `admin:${password}`,
              },
              {
                name: "CLICKHOUSE_PORT",
                value: "8123",
              },
              {
                name: "CLICKHOUSE_SERVER",
                value: interpolate`clickhouse-${pvSimpleInstallation.metadata.apply(
                  (meta) => meta?.name
                )}`,
              },
            ],
            ports: [
              {
                containerPort: 3100,
              },
            ],
            resources: {},
          },
        ],
        restartPolicy: "Always",
      },
    },
  },
});

const qrynService = new k8s.core.v1.Service("qryn", {
  metadata: {
    labels: {
      "io.metrico.service": "qryn",
    },
    name: "qryn",
  },
  spec: {
    ports: [
      {
        name: "3100",
        port: 3100,
        targetPort: 3100,
      },
    ],
    selector: {
      "io.metrico.service": "qryn",
    },
  },
});

const clickHouseConnString = interpolate`tcp://clickhouse-${pvSimpleInstallation.metadata.apply(
  (meta) => meta?.name
)}/cloki?username=admin&password${password}`;

const config = (qrynDsn: string) => ({
  receivers: {
    otlp: {
      protocols: {
        grpc: {
          endpoint: "0.0.0.0:4317",
        },
        http: {
          endpoint: "0.0.0.0:4318",
        },
      },
    },
    jaeger: {
      protocols: {
        grpc: {
          endpoint: "0.0.0.0:14250",
        },
        thrift_http: {
          endpoint: "0.0.0.0:14268",
        },
      },
    },
    zipkin: {
      endpoint: "0.0.0.0:9411",
    },
    fluentforward: {
      endpoint: "0.0.0.0:24224",
    },
    prometheus: {
      config: {
        scrape_configs: [
          {
            job_name: "otel-collector",
            scrape_interval: "5s",
            static_configs: [
              {
                targets: ["exporter:8080"],
              },
            ],
          },
        ],
      },
    },
  },
  processors: {
    batch: {
      send_batch_size: 10000,
      timeout: "5s",
    },
    memory_limiter: {
      check_interval: "2s",
      limit_mib: 1800,
      spike_limit_mib: 500,
    },
    "resourcedetection/system": {
      detectors: ["system"],
      system: {
        hostname_sources: ["os"],
      },
    },
    resource: {
      attributes: [
        {
          key: "service.name",
          value: "serviceName",
          action: "upsert",
        },
      ],
    },
    spanmetrics: {
      metrics_exporter: "otlp/spanmetrics",
      latency_histogram_buckets: ["100us", "1ms", "2ms", "6ms", "10ms", "100ms", "250ms"],
      dimensions_cache_size: 1500,
    },
    servicegraph: {
      metrics_exporter: "otlp/spanmetrics",
      latency_histogram_buckets: ["100us", "1ms", "2ms", "6ms", "10ms", "100ms", "250ms"],
      dimensions: ["cluster", "namespace"],
      store: {
        ttl: "2s",
        max_items: 200,
      },
    },
    metricstransform: {
      transforms: [
        {
          include: "calls_total",
          action: "update",
          new_name: "traces_spanmetrics_calls_total",
        },
        {
          include: "latency",
          action: "update",
          new_name: "traces_spanmetrics_latency",
        },
      ],
    },
  },
  exporters: {
    qryn: {
      dsn: qrynDsn,
      timeout: "10s",
      sending_queue: {
        queue_size: 100,
      },
      retry_on_failure: {
        enabled: true,
        initial_interval: "5s",
        max_interval: "30s",
        max_elapsed_time: "300s",
      },
      logs: {
        format: "json",
      },
    },
    "otlp/spanmetrics": {
      endpoint: "localhost:4317",
      tls: {
        insecure: true,
      },
    },
  },
  extensions: {
    health_check: null,
    pprof: null,
    zpages: null,
    memory_ballast: {
      size_mib: 1000,
    },
  },
  service: {
    extensions: ["pprof", "zpages", "health_check"],
    pipelines: {
      logs: {
        receivers: ["fluentforward", "otlp"],
        processors: ["memory_limiter", "resourcedetection/system", "resource", "batch"],
        exporters: ["qryn"],
      },
      traces: {
        receivers: ["otlp", "jaeger", "zipkin"],
        processors: [
          "memory_limiter",
          "resourcedetection/system",
          "resource",
          //"spanmetrics",
          // "servicegraph",
          "batch",
        ],
        exporters: ["qryn"],
      },
      "metrics/spanmetrics": {
        receivers: ["otlp"],
        processors: ["metricstransform"],
        exporters: ["qryn"],
      },
      metrics: {
        receivers: ["prometheus"],
        processors: ["memory_limiter", "resourcedetection/system", "resource", "batch"],
        exporters: ["qryn"],
      },
    },
  },
});

const cm = new kx.ConfigMap("qryn-otel-collector-configmap", {
  data: { config: clickHouseConnString.apply((qrynDsn) => yaml.dump(config(qrynDsn))) },
});

const qrynOtelCollector = new kx.PodBuilder({
  containers: [
    {
      image: "ghcr.io/metrico/qryn-otel-collector:latest",
      ports: [
        { name: "otlp-grpc", containerPort: 4317 },
        { name: "otlp-http", containerPort: 4318 },
        { name: "jaeger-grpc", containerPort: 14250 },
        { name: "jaeger-thrift", containerPort: 14268 },
        { name: "zipkin", containerPort: 9411 },
        { name: "fluent-forward", containerPort: 24224 },
      ],
      volumeMounts: [cm.mount("/etc/otel/config.yaml", "config")],
    },
  ],
});

const qrynOtelCollectorDeploy = new kx.Deployment("qryn-otel-collector", {
  metadata: {
    labels: {
      "io.metrico.service": "qryn-otel-collector",
    },
  },
  spec: qrynOtelCollector.asDeploymentSpec(),
});

const otelService = qrynOtelCollectorDeploy.createService();

export const name = otelService.metadata.name;
