#!/bin/bash
# Run a script with .env.local loaded.
# Usage: bash scripts/run.sh scripts/audit-destinations.ts [--dest Thailand]
set -e
set -a
# shellcheck disable=SC1091
source .env.local
set +a
npx tsx "$@"
