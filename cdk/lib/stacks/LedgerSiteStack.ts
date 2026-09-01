import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { rewriteFunctionCode } from "../../functions/rewrite";
import { CONFIG, ROOT_DOMAIN, Stage } from "../config";

export interface LedgerSiteStackProps extends cdk.StackProps {
  stage: Stage;
}

/**
 * One environment's hosting: a private bucket holding the static export, and
 * a CloudFront distribution serving it over the stage's domains.
 */
export class LedgerSiteStack extends cdk.Stack {
  readonly bucket: s3.Bucket;
  readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: LedgerSiteStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const config = CONFIG[stage];
    const isProd = stage === "prod";

    // Resolved when the stack is synthesized, not at deploy time, so the
    // template carries a literal zone id and no cross-stack reference. The
    // answer is cached in cdk.context.json, which is committed.
    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: ROOT_DOMAIN,
    });

    // Production keeps its contents on stack teardown; dev is disposable.
    this.bucket = new s3.Bucket(this, "SiteBucket", {
      bucketName: config.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
    });

    // CloudFront only reads certificates from us-east-1, which is where this
    // whole app is pinned. Validation records are written into the zone above.
    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: config.domains[0],
      subjectAlternativeNames: config.domains.slice(1),
      validation: acm.CertificateValidation.fromDns(zone),
    });

    const rewrite = new cloudfront.Function(this, "RewriteFunction", {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      comment: `ledger-${stage}: directory index rewrite`,
      code: cloudfront.FunctionCode.fromInline(
        rewriteFunctionCode(config.redirectToApex),
      ),
    });

    // `app/layout.tsx` already asks robots to stay away. This covers the
    // responses that carry no HTML for a crawler to read the tag from.
    const responseHeadersPolicy = config.noindex
      ? new cloudfront.ResponseHeadersPolicy(this, "NoIndexPolicy", {
          customHeadersBehavior: {
            customHeaders: [
              {
                header: "X-Robots-Tag",
                value: "noindex, nofollow",
                override: true,
              },
            ],
          },
        })
      : undefined;

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: `ledger-${stage}`,
      defaultRootObject: "index.html",
      domainNames: config.domains,
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        compress: true,
        // This policy has MinTTL 1 and MaxTTL a year, so it defers to the
        // `Cache-Control` the deploy writes onto each object: HTML must
        // revalidate, and the content-hashed bundles under `_next/static`
        // are immutable for a year. Holding that in object metadata keeps it
        // true for the browser as well as the edge, which a cache policy
        // alone could not do — so there are deliberately no extra behaviors.
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: rewrite,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
        responseHeadersPolicy,
      },
      // With OAC the bucket grants `s3:GetObject` but not `s3:ListBucket`, so
      // a missing key comes back as 403 rather than 404. Both have to land on
      // the export's 404 page, and neither should be remembered for long.
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: cdk.Duration.seconds(10),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: cdk.Duration.seconds(10),
        },
      ],
    });

    // The apex needs an alias record rather than a CNAME, which is why DNS
    // lives in Route 53 at all. `www` points at the same distribution and is
    // redirected by the viewer-request function.
    for (const domain of config.domains) {
      const target = route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution),
      );
      const recordName = domain === ROOT_DOMAIN ? undefined : domain;

      new route53.ARecord(this, `ARecord-${domain}`, {
        zone,
        recordName,
        target,
      });
      new route53.AaaaRecord(this, `AaaaRecord-${domain}`, {
        zone,
        recordName,
        target,
      });
    }

    new cdk.CfnOutput(this, "BucketName", { value: this.bucket.bucketName });
    new cdk.CfnOutput(this, "DistributionId", {
      value: this.distribution.distributionId,
    });
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, "SiteUrl", { value: config.siteUrl });
  }
}
