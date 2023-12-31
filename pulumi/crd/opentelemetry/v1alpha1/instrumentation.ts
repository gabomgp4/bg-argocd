// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as inputs from "../../types/input";
import * as outputs from "../../types/output";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

/**
 * Instrumentation is the spec for OpenTelemetry instrumentation.
 */
export class Instrumentation extends pulumi.CustomResource {
    /**
     * Get an existing Instrumentation resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): Instrumentation {
        return new Instrumentation(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:opentelemetry.io/v1alpha1:Instrumentation';

    /**
     * Returns true if the given object is an instance of Instrumentation.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is Instrumentation {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === Instrumentation.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"opentelemetry.io/v1alpha1" | undefined>;
    public readonly kind!: pulumi.Output<"Instrumentation" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * InstrumentationSpec defines the desired state of OpenTelemetry SDK and instrumentation.
     */
    public readonly spec!: pulumi.Output<outputs.opentelemetry.v1alpha1.InstrumentationSpec | undefined>;
    /**
     * InstrumentationStatus defines status of the instrumentation.
     */
    public readonly status!: pulumi.Output<{[key: string]: any} | undefined>;

    /**
     * Create a Instrumentation resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: InstrumentationArgs, opts?: pulumi.CustomResourceOptions) {
        let resourceInputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            resourceInputs["apiVersion"] = "opentelemetry.io/v1alpha1";
            resourceInputs["kind"] = "Instrumentation";
            resourceInputs["metadata"] = args ? args.metadata : undefined;
            resourceInputs["spec"] = args ? args.spec : undefined;
            resourceInputs["status"] = args ? args.status : undefined;
        } else {
            resourceInputs["apiVersion"] = undefined /*out*/;
            resourceInputs["kind"] = undefined /*out*/;
            resourceInputs["metadata"] = undefined /*out*/;
            resourceInputs["spec"] = undefined /*out*/;
            resourceInputs["status"] = undefined /*out*/;
        }
        opts = pulumi.mergeOptions(utilities.resourceOptsDefaults(), opts);
        super(Instrumentation.__pulumiType, name, resourceInputs, opts);
    }
}

/**
 * The set of arguments for constructing a Instrumentation resource.
 */
export interface InstrumentationArgs {
    apiVersion?: pulumi.Input<"opentelemetry.io/v1alpha1">;
    kind?: pulumi.Input<"Instrumentation">;
    metadata?: pulumi.Input<ObjectMeta>;
    /**
     * InstrumentationSpec defines the desired state of OpenTelemetry SDK and instrumentation.
     */
    spec?: pulumi.Input<inputs.opentelemetry.v1alpha1.InstrumentationSpecArgs>;
    /**
     * InstrumentationStatus defines status of the instrumentation.
     */
    status?: pulumi.Input<{[key: string]: any}>;
}
