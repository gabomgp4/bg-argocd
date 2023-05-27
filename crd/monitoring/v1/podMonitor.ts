// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as inputs from "../../types/input";
import * as outputs from "../../types/output";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

/**
 * PodMonitor defines monitoring for a set of pods.
 */
export class PodMonitor extends pulumi.CustomResource {
    /**
     * Get an existing PodMonitor resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): PodMonitor {
        return new PodMonitor(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:monitoring.coreos.com/v1:PodMonitor';

    /**
     * Returns true if the given object is an instance of PodMonitor.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is PodMonitor {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === PodMonitor.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"monitoring.coreos.com/v1" | undefined>;
    public readonly kind!: pulumi.Output<"PodMonitor" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * Specification of desired Pod selection for target discovery by Prometheus.
     */
    public readonly spec!: pulumi.Output<outputs.monitoring.v1.PodMonitorSpec>;

    /**
     * Create a PodMonitor resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: PodMonitorArgs, opts?: pulumi.CustomResourceOptions) {
        let resourceInputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            resourceInputs["apiVersion"] = "monitoring.coreos.com/v1";
            resourceInputs["kind"] = "PodMonitor";
            resourceInputs["metadata"] = args ? args.metadata : undefined;
            resourceInputs["spec"] = args ? args.spec : undefined;
        } else {
            resourceInputs["apiVersion"] = undefined /*out*/;
            resourceInputs["kind"] = undefined /*out*/;
            resourceInputs["metadata"] = undefined /*out*/;
            resourceInputs["spec"] = undefined /*out*/;
        }
        opts = pulumi.mergeOptions(utilities.resourceOptsDefaults(), opts);
        super(PodMonitor.__pulumiType, name, resourceInputs, opts);
    }
}

/**
 * The set of arguments for constructing a PodMonitor resource.
 */
export interface PodMonitorArgs {
    apiVersion?: pulumi.Input<"monitoring.coreos.com/v1">;
    kind?: pulumi.Input<"PodMonitor">;
    metadata?: pulumi.Input<ObjectMeta>;
    /**
     * Specification of desired Pod selection for target discovery by Prometheus.
     */
    spec?: pulumi.Input<inputs.monitoring.v1.PodMonitorSpecArgs>;
}
