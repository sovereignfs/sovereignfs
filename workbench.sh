#!/usr/bin/env bash
# Thin shim into the workbench CLI (@sovereignfs/workbench). See CONCEPT.md.
# Uses the local ./workbench checkout when there is one (for working on the
# CLI itself), otherwise the published package via npx.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export WORKBENCH_ROOT="$DIR"
if [ -f "$DIR/workbench/bin/workbench.js" ]; then
  exec node "$DIR/workbench/bin/workbench.js" "$@"
fi
exec npx --yes @sovereignfs/workbench@0.1 "$@"
