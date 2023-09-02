import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
5;
import * as clickhouse from "./crd/clickhouse/v1"; // Replace this with the path to your generated module
import * as metallb from "./metallb"; // Replace this with the path to your generated module5
import {selector} from "./keycloak";
import {ingress} from "./echo-server";
import * as storage from './storage';
import './telemetry';
import { interpolate } from "@pulumi/pulumi";
import * as kong from "./kong";
import "./argocd";


export const selectorKeyCloak = selector;
export const urnKong = kong.urn;
export const echoIngress = ingress;
export const jj = metallb.addressPool;