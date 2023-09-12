import * as k8s from "@pulumi/kubernetes";
import * as yaml from "js-yaml";

const openebs = new k8s.helm.v3.Release("openebs", {
  namespace: "openebs",
  createNamespace: true,
  chart: "openebs",
  version: "",
  repositoryOpts: {
    repo: "https://openebs.github.io/charts",
  },
  //Installing only LocalPV HostPath provisioner
  values: {
    "localpv": {
      "enabled": true,
      "storageClassName": "local-hostpath",
    },
    "ndm": {
      "enabled": false,
    },
    "cstor": {
      "enabled": false,
    },
    "jiva": {
      "enabled": false,
    },
    "provisioners": {
      "localpv-hostpath": {
        "enabled": true,
      },
      "ndm-block": {
        "enabled": false,
      },
      "cstor-block": {
        "enabled": false,
      },
      "jiva": {
        "enabled": false,
      },
    },
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

export const cloudNativePg = new k8s.helm.v3.Release("cloudnative-pg", {
  namespace: "cloudnative-pg",
  createNamespace: true,
  chart: "cloudnative-pg",
  version: "0.18.2",
  repositoryOpts: {
    repo: "https://cloudnative-pg.github.io/charts",
  },
});
