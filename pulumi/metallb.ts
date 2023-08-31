import * as mlb from "./crd/metallb/v1beta1";
import * as k8s from "@pulumi/kubernetes";

/**
 * Debe marcarse el nodo ggomez-control como routereflector:
 * 
 *  > kubectl annotate node ggomez-control projectcalico.org/RouteReflectorClusterID=244.0.0.1
 *  > kubectl label node ggomez-control route-reflector=true
 * 
 */

// inspired in
// https://devpress.csdn.net/cloud/62f654497e6682346618b0b8.html#devmenu7
// https://docs.rke2.io/install/network_options
// const rke2Calico = new k8s.apiextensions.CustomResource("rke2-calico", {
//   apiVersion: "helm.cattle.io/v1",
//   kind: "HelmChartConfig",
//   metadata: {
//     name: "rke2-calico",
//     namespace: "kube-system",
//   },
//   spec: {
  // valuesContent: |-
  //   installation:
  //     calicoNetwork:
  //       bgp: Enabled
  //       ipPools:
  //       - cidr: 10.42.0.0/16
  //         encapsulation: VXLAN
  //         natOutgoing: Enabled
  //       - cidr: fd10::/56
  //         encapsulation: VXLAN
  //         natOutgoing: Enabled
// `,
//   },
// });

// valuesContent: |-
//   installation:
//     calicoNetwork:
//       bgp: Enabled
//       ipPools:
//       - cidr: 10.42.0.0/16
//         encapsulation: None
//         natOutgoing: Disabled
//       - cidr: fd10::/56
//         encapsulation: None
//         natOutgoing: Disabled


/* De todo lo que hice, el orden que quizas funcione a la proxima es:
1. Instalar el cluster con rancher indicando los CIDR de valuesContent para IPv4 e IPv6
2. Marcar homelab01 (debe estar conectado por Ethernet, NO wifi) con el
  label route-reflector=true y la  annotation projectcalico.org/RouteReflectorClusterID = 244.0.0.2 
  Nota: RouteReflectorClusterId puede ser cualquier ip no usada en el cluster.
3. Cambiar el recurso rke2-calico para que tenga los valores de valuesContent que se ven arriba
4. Instalar los recursos de BGP reflector, openwrt-peer y BGPConfiguration que estan en este archivo.
5. Cambiar las ipPool IPv4 e IPv6 de este archivo para que coincidan con las de valuesContent, osea sin VXLAN y sin outgoingNat. Ejemplo:
spec:
  allowedUses:
    - Workload
    - Tunnel
  blockSize: 26
  cidr: 10.42.0.0/16
  ipipMode: Never
  natOutgoing: false
  nodeSelector: all()
  vxlanMode: Never
6. Reiniciar todos los pods del namespace calico-system.
7. Si quedan pods pegados, reinicar unicamente el pod que sirve de reflector, el calico-node presente en homelab01 (el que esta marcado como reflector.)

Cluster CIDR: 10.42.0.0/16,fd10::/56
Service CIDR: 10.43.0.0/16,fd10:0:1::/112

IMPORTANTE: bloquear a NetworkManager de molestar a calico: 
  https://docs.tigera.io/calico/latest/operations/troubleshoot/troubleshooting#configure-networkmanager


Cuando se crea el cluster en Rancher por primera vez:

En clsuter.yaml se puede ver como se creo el cluster con RKE. Recordar el cluster se debe llamar homelab.
*/

const metallb = new k8s.helm.v3.Release("metallb", {
  chart: "metallb",
  version: "0.13.10",
  repositoryOpts: {
    repo: "https://metallb.github.io/metallb",
  },
});

export const addressPool = new mlb.AddressPool(
  "address-pool",
  {
    spec: {
      protocol: "bgp",
      addresses: ["172.16.0.0/16"],
    },
  },
  {
    dependsOn: metallb,
  }
);
