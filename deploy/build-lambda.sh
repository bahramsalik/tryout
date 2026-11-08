#!/bin/sh
# Builds deploy/out/tryout-api-lambda.zip (linux/arm64) for the hosted API. Needs Docker.
set -eu
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/deploy/out"
rm -rf "$OUT/pkg" && mkdir -p "$OUT/pkg"
docker build --platform linux/arm64 -f "$ROOT/deploy/api.Dockerfile" -t tryout-api:arm64 "$ROOT"
CID=$(docker create --platform linux/arm64 tryout-api:arm64)
docker cp "$CID:/app/." "$OUT/pkg/"
docker rm "$CID" >/dev/null
cp "$ROOT/deploy/lambda-run.sh" "$OUT/pkg/run.sh"
rm -f "$OUT/tryout-api-lambda.zip"
(cd "$OUT/pkg" && zip -qry "$OUT/tryout-api-lambda.zip" .)
ls -la "$OUT/tryout-api-lambda.zip"
