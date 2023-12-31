// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as utilities from "../../utilities";

// Export members:
export { PlanArgs } from "./plan";
export type Plan = import("./plan").Plan;
export const Plan: typeof import("./plan").Plan = null as any;
utilities.lazyLoad(exports, ["Plan"], () => require("./plan"));


const _module = {
    version: utilities.getVersion(),
    construct: (name: string, type: string, urn: string): pulumi.Resource => {
        switch (type) {
            case "kubernetes:upgrade.cattle.io/v1:Plan":
                return new Plan(name, <any>undefined, { urn })
            default:
                throw new Error(`unknown resource type ${type}`);
        }
    },
};
pulumi.runtime.registerResourceModule("crds", "upgrade.cattle.io/v1", _module)
