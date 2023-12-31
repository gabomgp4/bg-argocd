// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as utilities from "../../utilities";

// Export members:
export { KongClusterPluginArgs } from "./kongClusterPlugin";
export type KongClusterPlugin = import("./kongClusterPlugin").KongClusterPlugin;
export const KongClusterPlugin: typeof import("./kongClusterPlugin").KongClusterPlugin = null as any;
utilities.lazyLoad(exports, ["KongClusterPlugin"], () => require("./kongClusterPlugin"));

export { KongConsumerArgs } from "./kongConsumer";
export type KongConsumer = import("./kongConsumer").KongConsumer;
export const KongConsumer: typeof import("./kongConsumer").KongConsumer = null as any;
utilities.lazyLoad(exports, ["KongConsumer"], () => require("./kongConsumer"));

export { KongIngressArgs } from "./kongIngress";
export type KongIngress = import("./kongIngress").KongIngress;
export const KongIngress: typeof import("./kongIngress").KongIngress = null as any;
utilities.lazyLoad(exports, ["KongIngress"], () => require("./kongIngress"));

export { KongPluginArgs } from "./kongPlugin";
export type KongPlugin = import("./kongPlugin").KongPlugin;
export const KongPlugin: typeof import("./kongPlugin").KongPlugin = null as any;
utilities.lazyLoad(exports, ["KongPlugin"], () => require("./kongPlugin"));


const _module = {
    version: utilities.getVersion(),
    construct: (name: string, type: string, urn: string): pulumi.Resource => {
        switch (type) {
            case "kubernetes:configuration.konghq.com/v1:KongClusterPlugin":
                return new KongClusterPlugin(name, <any>undefined, { urn })
            case "kubernetes:configuration.konghq.com/v1:KongConsumer":
                return new KongConsumer(name, <any>undefined, { urn })
            case "kubernetes:configuration.konghq.com/v1:KongIngress":
                return new KongIngress(name, <any>undefined, { urn })
            case "kubernetes:configuration.konghq.com/v1:KongPlugin":
                return new KongPlugin(name, <any>undefined, { urn })
            default:
                throw new Error(`unknown resource type ${type}`);
        }
    },
};
pulumi.runtime.registerResourceModule("crds", "configuration.konghq.com/v1", _module)
