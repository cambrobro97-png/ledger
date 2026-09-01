import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Stage } from "../config";
import { GithubOidcStack } from "../stacks/GithubOidcStack";
import { LedgerSiteStack } from "../stacks/LedgerSiteStack";

export interface LedgerStageProps extends cdk.StageProps {
  stage: Stage;
}

/**
 * One complete environment: the hosting, plus the role that deploys to it.
 *
 * The two stages share no resources, so deploying one can never disturb the
 * other. The hosted zone they both write records into is the single
 * exception, and it is deployed separately for exactly that reason.
 */
export class LedgerStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: LedgerStageProps) {
    super(scope, id, props);

    const { stage } = props;

    const site = new LedgerSiteStack(this, "Site", { stage });

    new GithubOidcStack(this, "Cicd", {
      stage,
      bucket: site.bucket,
      distribution: site.distribution,
    });
  }
}
