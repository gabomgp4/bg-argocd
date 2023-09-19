import * as k8s from "@pulumi/kubernetes";
import * as certManagerV1 from "./crd/certmanager/v1";

const certManagerCrd = new k8s.yaml.ConfigFile("cert-manager-crd", {
  file: "https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.crds.yaml",
});

const certManager = new k8s.helm.v3.Release(
  "cert-manager",
  {
    namespace: "cert-manager",
    createNamespace: true,
    chart: "cert-manager",
    version: "1.13.0",
    repositoryOpts: {
      repo: "https://charts.jetstack.io",
    },
    values: {
      installCRDs: false,
    },
  },
  {
    dependsOn: certManagerCrd,
  }
);

const letsencryptIssuer = new certManagerV1.ClusterIssuer("letsencrypt-prod", {
  metadata: {
    name: "letsencrypt-prod",
  },
  spec: {
    acme: {
      email: "gabomgp4@gmail.com", // Remember to change this!
      privateKeySecretRef: {
        name: "letsencrypt-prod",
      },
      server: "https://acme-v02.api.letsencrypt.org/directory",
      solvers: [
        {
          http01: {
            ingress: {
              podTemplate: {
                metadata: {
                  annotations: {
                    "kuma.io/sidecar-injection": "false", // If ingress is running in Kuma/Kong Mesh, disable sidecar injection
                    "sidecar.istio.io/inject": "false", // If using Istio, disable sidecar injection
                  },
                },
              },
              class: "kong",
            },
          },
        },
      ],
    },
  },
}, {
  dependsOn: certManager,
});
