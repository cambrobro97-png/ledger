#!/usr/bin/env bash
# Build the static export and publish it to S3 + CloudFront.
# Usage: BUCKET=my-bucket DISTRIBUTION=E123ABC ./deploy.sh
#   or copy .env.deploy.example to .env.deploy and fill it in.
set -euo pipefail

if [[ -f .env.deploy ]]; then
  # shellcheck disable=SC1091
  source .env.deploy
fi

: "${BUCKET:?Set BUCKET (S3 bucket name) in the environment or .env.deploy}"
: "${DISTRIBUTION:?Set DISTRIBUTION (CloudFront distribution ID) in the environment or .env.deploy}"

npm run build

# Everything except the content-hashed bundles must revalidate, or a redeploy
# would keep serving the old HTML until the cache expired.
aws s3 sync out/ "s3://$BUCKET/" --delete \
  --exclude "_next/static/*" \
  --cache-control "public,max-age=0,must-revalidate"

# Filenames under _next/static are content-hashed, so a given URL never changes
# meaning and can be cached in the browser for a year.
aws s3 sync out/_next/static/ "s3://$BUCKET/_next/static/" --delete \
  --cache-control "public,max-age=31536000,immutable"

# Only the HTML needs flushing; the hashed assets arrive under fresh names.
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION" \
  --paths "/" "/*" \
  --query 'Invalidation.Status' --output text

echo "Deployed."
