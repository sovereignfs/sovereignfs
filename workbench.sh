#!/usr/bin/env bash
# Thin shim into the workbench CLI. See CONCEPT.md.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$DIR/cli/bin/workbench.js" "$@"
