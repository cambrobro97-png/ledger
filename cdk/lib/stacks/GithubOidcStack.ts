import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import {
  CONFIG,
  GITHUB_OIDC_PROVIDER_ARN,
  GITHUB_SUB_PREFIX,
  Stage,
} from "../config";

export interface GithubOidcStackProps extends cdk.StackProps {
  stage: Stage;
  bucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
}

/**
 * The role GitHub Actions assumes to deploy this stage.
 *
 * Workflow runs authenticate with a short-lived OIDC token instead of stored
 * access keys, so there is nothing in the repository to leak or rotate.
 */
export class GithubOidcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
    super(scope, id, props);

    const { stage, bucket, distribution } = props;
    const config = CONFIG[stage];

    const provider =
      iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this,
        "GithubOidcProvider",
        GITHUB_OIDC_PROVIDER_ARN,
      );

    const role = new iam.Role(this, "DeployRole", {
      roleName: `ledger-${stage}-github-deploy`,
      description: `Deploys the ${stage} site from the ${config.branch} branch`,
      maxSessionDuration: cdk.Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(
        provider.openIdConnectProviderArn,
        {
          // Both conditions carry weight. Without the audience check any
          // OIDC token could be presented; without a pinned `sub`, any
          // workflow in the repository — including one running from a fork's
          // pull request — could assume the role and deploy.
          //
          // The workflow names a job environment, so the subject ends in
          // `:environment:<name>` rather than the branch ref. That is the
          // stronger pin of the two: an environment can carry protection
          // rules and its own branch policy, whereas a ref is only whoever
          // managed to push. The branch that reaches each environment is
          // settled in the workflow and by that environment's own rules.
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            "token.actions.githubusercontent.com:sub": `${GITHUB_SUB_PREFIX}:environment:${stage}`,
          },
        },
      ),
    });

    // A deploy does exactly two things: sync the export into the bucket, and
    // invalidate the HTML at the edge. The grants go no further than that,
    // and never past this stage's own resources.
    bucket.grantReadWrite(role);
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
        ],
        resources: [
          `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        ],
      }),
    );

    new cdk.CfnOutput(this, "DeployRoleArn", { value: role.roleArn });
  }
}
