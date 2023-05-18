import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import * as clickhouse from "./crd/clickhouse/v1"; // Replace this with the path to your generated module
import * as metallb from "./crd/metallb/v1beta1"; // Replace this with the path to your generated module

const crypto = require('crypto');

function computeSHA256(input: string) {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}

const password = "1082925798";
const codedPassword = computeSHA256(password);

const addressPool = new metallb.AddressPool("address-pool", {
  metadata: {
    name:"address-pool",
    namespace: "metallb-system"
  },
  spec: {
    protocol: "layer2",
    addresses: ["198.51.100.0/24"]
  }
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
        "admin/networks/ip": "::/0"
      }
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
                value: pvSimpleInstallation.status.apply((status) => status?.endpoint!),
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

export const name = qrynService.metadata.name;
