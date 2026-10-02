#!/usr/bin/env bash
set -euo pipefail

MODEL_ID="${MODEL_ID:?MODEL_ID is required, e.g. gemini-3.1-flash-lite}"
POLL_SECONDS="${POLL_SECONDS:-15}"
MAX_TASKS="${MAX_TASKS:-0}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKER="$ROOT/scripts/node/model-worker.mjs"

cd "$ROOT"

echo "worker-loop: model=$MODEL_ID poll=${POLL_SECONDS}s max_tasks=$MAX_TASKS"

count=0
while true; do
  if [[ "$MAX_TASKS" != "0" && "$count" -ge "$MAX_TASKS" ]]; then
    echo "worker-loop: max tasks reached"
    exit 0
  fi

  # The Node worker owns claiming, policy enforcement, execution, and state transitions.
  MODEL_ID="$MODEL_ID" node "$WORKER" --once

  count=$((count + 1))
  sleep "$POLL_SECONDS"
done
