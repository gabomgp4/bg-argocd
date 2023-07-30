import * as k8s from "@pulumi/kubernetes";

const nginxIngress = new k8s.helm.v3.Chart("kong-ingress", {
    chart: "kong",
    skipCRDRendering: true,//enable with new cluster from scratch
    version: "2.25.0",
    fetchOpts:{
        repo: "https://charts.konghq.com",
    },
    values: {
        image: {
            repository: "revomatico/docker-kong-oidc",
            tag: "3.3.0-1"
        },
        proxy: {
            type: "NodePort",
        },
        env: {
            PLUGINS: "bundled,oidc"
        }
    },
});

export const urn = nginxIngress.urn