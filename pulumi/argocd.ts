import * as k8s from "@pulumi/kubernetes";

var argoCdNs = new k8s.core.v1.Namespace("argocd");
var argoCd = new k8s.helm.v3.Release("argocd", {
    chart: "argo-cd",
    version: "5.45.0",
    namespace: argoCdNs.metadata.name,
    repositoryOpts: {
        repo: "https://argoproj.github.io/argo-helm",
    }
});