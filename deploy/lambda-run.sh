#!/bin/sh
# Lambda entry (AWS Lambda Web Adapter starts this and proxies requests to $PORT).
cd "$LAMBDA_TASK_ROOT/server" && exec node ./node_modules/tsx/dist/cli.mjs src/index.ts
