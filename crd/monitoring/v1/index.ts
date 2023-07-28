// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as utilities from "../../utilities";

// Export members:
export { AlertmanagerArgs } from "./alertmanager";
export type Alertmanager = import("./alertmanager").Alertmanager;
export const Alertmanager: typeof import("./alertmanager").Alertmanager = null as any;
utilities.lazyLoad(exports, ["Alertmanager"], () => require("./alertmanager"));

export { PodMonitorArgs } from "./podMonitor";
export type PodMonitor = import("./podMonitor").PodMonitor;
export const PodMonitor: typeof import("./podMonitor").PodMonitor = null as any;
utilities.lazyLoad(exports, ["PodMonitor"], () => require("./podMonitor"));

export { ProbeArgs } from "./probe";
export type Probe = import("./probe").Probe;
export const Probe: typeof import("./probe").Probe = null as any;
utilities.lazyLoad(exports, ["Probe"], () => require("./probe"));

export { PrometheusArgs } from "./prometheus";
export type Prometheus = import("./prometheus").Prometheus;
export const Prometheus: typeof import("./prometheus").Prometheus = null as any;
utilities.lazyLoad(exports, ["Prometheus"], () => require("./prometheus"));

export { PrometheusRuleArgs } from "./prometheusRule";
export type PrometheusRule = import("./prometheusRule").PrometheusRule;
export const PrometheusRule: typeof import("./prometheusRule").PrometheusRule = null as any;
utilities.lazyLoad(exports, ["PrometheusRule"], () => require("./prometheusRule"));

export { ServiceMonitorArgs } from "./serviceMonitor";
export type ServiceMonitor = import("./serviceMonitor").ServiceMonitor;
export const ServiceMonitor: typeof import("./serviceMonitor").ServiceMonitor = null as any;
utilities.lazyLoad(exports, ["ServiceMonitor"], () => require("./serviceMonitor"));


const _module = {
    version: utilities.getVersion(),
    construct: (name: string, type: string, urn: string): pulumi.Resource => {
        switch (type) {
            case "kubernetes:monitoring.coreos.com/v1:Alertmanager":
                return new Alertmanager(name, <any>undefined, { urn })
            case "kubernetes:monitoring.coreos.com/v1:PodMonitor":
                return new PodMonitor(name, <any>undefined, { urn })
            case "kubernetes:monitoring.coreos.com/v1:Probe":
                return new Probe(name, <any>undefined, { urn })
            case "kubernetes:monitoring.coreos.com/v1:Prometheus":
                return new Prometheus(name, <any>undefined, { urn })
            case "kubernetes:monitoring.coreos.com/v1:PrometheusRule":
                return new PrometheusRule(name, <any>undefined, { urn })
            case "kubernetes:monitoring.coreos.com/v1:ServiceMonitor":
                return new ServiceMonitor(name, <any>undefined, { urn })
            default:
                throw new Error(`unknown resource type ${type}`);
        }
    },
};
pulumi.runtime.registerResourceModule("crds", "monitoring.coreos.com/v1", _module)
