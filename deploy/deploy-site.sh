#!/bin/sh
# Builds one site and uploads it to its Amplify app as a manual deployment.
#   deploy/deploy-site.sh student <amplify-app-id>
#   deploy/deploy-site.sh employer <amplify-app-id>
# Needs VITE_API_URL (and VITE_STUDENT_URL for the employer site) in the environment.
set -eu
SITE=$1; APP_ID=$2; REGION=${AWS_REGION:-us-east-1}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/deploy/out"; mkdir -p "$OUT"
(cd "$ROOT/apps/$SITE" && npm run build)
rm -f "$OUT/$SITE.zip"
(cd "$ROOT/apps/$SITE/dist" && zip -qr "$OUT/$SITE.zip" .)
set -- $(aws amplify create-deployment --region "$REGION" --app-id "$APP_ID" --branch-name main --query '[jobId,zipUploadUrl]' --output text)
curl -sf -X PUT -H 'Content-Type: application/zip' --upload-file "$OUT/$SITE.zip" "$2" >/dev/null
aws amplify start-deployment --region "$REGION" --app-id "$APP_ID" --branch-name main --job-id "$1" --query 'jobSummary.status' --output text
echo "https://main.$APP_ID.amplifyapp.com (job $1)"
