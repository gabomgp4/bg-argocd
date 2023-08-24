import * as k8s from "@pulumi/kubernetes";
import * as yaml from "js-yaml";

const openebs = new k8s.helm.v3.Release("openebs", {
  chart: "openebs",
  version: "",
  repositoryOpts: {
    repo: "https://openebs.github.io/charts",
  },
});

const localStorageConfig = {
  StorageType: "hostpath",
  BasePath: "/home/openebs/local",
};

const config = Object.entries(localStorageConfig).map(([key, value]) => ({ name: key, value }));

export const localStorageClass = new k8s.storage.v1.StorageClass("local-hostpath", {
  metadata: {
    annotations: {
      "openebs.io/cas-type": "local",
      "cas.openebs.io/config": yaml.dump(config),
      "storageclass.kubernetes.io/is-default-class": "true",
    },
  },
  reclaimPolicy: "Delete",
  provisioner: "openebs.io/local",
  volumeBindingMode: "WaitForFirstConsumer",
}, {
  dependsOn: [openebs],
});

export const clickHouseOperator = new k8s.helm.v3.Release("cho", {
  chart: "altinity-clickhouse-operator",
  version: "0.21.3",
  repositoryOpts: {
    repo: "https://docs.altinity.com/clickhouse-operator/",
  },
});


export const cloudNativePg = new k8s.helm.v3.Release("cloudnative-pg", {
  chart: "cloudnative-pg",
  version: "0.18.2",
  repositoryOpts: {
    repo: "https://cloudnative-pg.github.io/charts",
  },
});
