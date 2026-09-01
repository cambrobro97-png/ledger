#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DnsStack } from "../lib/stacks/DnsStack";
import { LedgerStage } from "../lib/stages/LedgerStage";

const app = new cdk.App();

// Which environment to act on: `cdk deploy --all --context stage=dev`.
const stage = app.node.tryGetContext("stage") ?? "dev";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  // CloudFront certificates and functions are us-east-1 only, so the whole
  // app is pinned there rather than reaching across regions for them.
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

if (stage === "dns") {
  // Deployed once, before either environment, and rarely touched again.
  new DnsStack(app, "Ledger-Dns", { env });
} else if (stage === "dev" || stage === "prod") {
  new LedgerStage(app, `Ledger-${stage}`, { stage, env });
} else {
  throw new Error(
    `Invalid stage "${stage}". Must be "dns", "dev", or "prod".`,
  );
}

app.synth();
