import * as kx from "@pulumi/kubernetesx";
import * as _ from "lodash";
import * as k8s from "@pulumi/kubernetes";
import { config } from "./config";

var podEnv = {
  EXTERNAL_REST_URL: "http://localhost:8080/rest/users",
  SERVER_maxHttpHeaderSize: 48000,
  SPRING_DATASOURCE: {
    URL: "jdbc:h2:mem:testdb",
    USERNAME: "sa",
    PASSWORD: "",
  },
  OTEL_JAVAAGENT_DEBUG: "true",
};

//map nested object to k8s env using lodash
type EnvArray = Array<{ name: string; value: string }>;
function mapObjectToEnvArray(env: any, prefix: string = ""): EnvArray {
  return _.flatMap(env, (value, key) => {
    const name = prefix + key;
    if (_.isString(value) || _.isNumber(value)) {
      return [
        {
          name: name,
          value: value.toString(),
        },
      ];
    } else {
      return mapObjectToEnvArray(value, name + "_");
    }
  });
}

const pb = new kx.PodBuilder({
  containers: [
    {
      name: "gerardo-app",
      image: "gerardoaquino25/bfftest:v1.0u",
      env: mapObjectToEnvArray(podEnv),
      ports: {
        http: 8080,
      },
    },
  ],
  restartPolicy: "Always",
});

const deployKx = new kx.Deployment("gerardo-app", {
  metadata: {
    annotations: {
      "instrumentation.opentelemetry.io/inject-java": "my-instrumentation",
    },
  },
  spec: pb.asDeploymentSpec(),
});

const service = deployKx.createService();

const app = "gerardo-demo";
const domain = `${app}.${config.rootDomain}`;

// Ingress
const ingress = new k8s.networking.v1.Ingress(`${app}-app`, {
  metadata: {
    name: app,
    namespace: service.metadata.namespace,
    annotations: {
      "konghq.com/plugins": "https-port-plugin,oidc",
      "cert-manager.io/cluster-issuer": "letsencrypt-prod",
    },
  },
  spec: {
    ingressClassName: "kong",
    tls: [
      {
        hosts: [domain],
        secretName: `${domain}-tls`,
      },
    ],
    rules: [
      {
        host: domain,
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: service.metadata.name,
                  port: {
                    name: "http",
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
});
