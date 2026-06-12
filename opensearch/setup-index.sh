#!/usr/bin/env bash
set -euo pipefail

OPENSEARCH_URL="${OPENSEARCH_URL:-http://localhost:9200}"
INDEX_NAME="${OPENSEARCH_INDEX:-well-telemetry}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Waiting for OpenSearch at ${OPENSEARCH_URL} ..."
until curl -s "${OPENSEARCH_URL}/_cluster/health" | grep -q '"status"'; do
  sleep 2
  echo "  still waiting..."
done
echo "OpenSearch is up."

echo "Deleting existing index '${INDEX_NAME}' (if present) for a clean dev slate..."
curl -s -o /dev/null -w "  DELETE status: %{http_code}\n" -X DELETE "${OPENSEARCH_URL}/${INDEX_NAME}"

echo "Creating index '${INDEX_NAME}' with mapping..."
curl -s -X PUT "${OPENSEARCH_URL}/${INDEX_NAME}" \
  -H "Content-Type: application/json" \
  -d @"${SCRIPT_DIR}/mapping.json" \
  -w "\n  PUT status: %{http_code}\n"

echo "Done."
