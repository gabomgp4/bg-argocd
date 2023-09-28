import * as kx from "@pulumi/kubernetesx";
import * as _ from "lodash";

var podEnv = {
  EXTERNAL_REST_URL: "http://localhost:8080/rest/users",
  SPRING_DATASOURCE: {
    URL: "jdbc:h2:mem:testdb",
    USERNAME: "sa",
    PASSWORD: "",
  },
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
      image: "gerardoaquino25/bfftest",
      env: mapObjectToEnvArray(podEnv),
    },
  ],
  restartPolicy: "Always",
});

// Create a Job using the Pod defined by the PodBuilder.
const exampleJobKx = new kx.Deployment("gerardo-app", {
  spec: pb.asDeploymentSpec(),
});
