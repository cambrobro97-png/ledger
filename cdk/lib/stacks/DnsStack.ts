import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { ROOT_DOMAIN } from "../config";

/**
 * The hosted zone for ledger-1.com, and nothing else.
 *
 * Both environments need this zone, but neither should own it: a stack that
 * owned it would become a dependency of the other, and a dev deploy could
 * then reach a resource production relies on. Keeping it here, deployed once
 * and outside either stage, lets the site stacks find it with a synth-time
 * `HostedZone.fromLookup` and stay entirely independent of each other.
 */
export class DnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const zone = new route53.PublicHostedZone(this, "Zone", {
      zoneName: ROOT_DOMAIN,
    });

    // A replacement zone comes with new nameservers, which means editing them
    // at the registrar again and waiting out propagation before anything
    // resolves. Never let a stack teardown take it.
    zone.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    // These four go into the registrar's custom-nameserver field.
    new cdk.CfnOutput(this, "NameServers", {
      value: cdk.Fn.join(", ", zone.hostedZoneNameServers ?? []),
      description: "Set these as the custom nameservers for ledger-1.com",
    });

    new cdk.CfnOutput(this, "HostedZoneId", { value: zone.hostedZoneId });
  }
}
