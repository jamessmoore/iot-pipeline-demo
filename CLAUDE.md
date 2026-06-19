# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

IoT telemetry pipeline demo (oil well tank monitoring) — Python simulator → MQTT (Mosquitto) → Node.js bridge → OpenSearch → Next.js dashboard. Portfolio/demo project, not a production system or client deliverable; there is no deploy pipeline.

## Required workflow

`master` has no branch protection or auto-deploy configured, but treat it the same way for hygiene and portfolio history:

1. Create a new branch off `master` for the change (e.g. `git checkout -b fix/short-description`).
2. Commit changes to that branch.
3. Push the branch and open a pull request targeting `master` (`gh pr create`).
4. Wait for CI (`.github/workflows/test.yml` — simulator, bridge, web test jobs) to pass on the PR.
5. Merge the PR into `master` once checks pass.
6. After a successful merge, delete the local feature branch (`git branch -d <branch>`) and run `git fetch --prune`.

Avoid committing directly to `master` for any non-trivial change — keep PR history clean since this repo is portfolio proof-of-work.

## Local verification before opening/updating a PR

Run the same checks CI runs so failures are caught early:

```bash
cd simulator && pip install -r requirements-dev.txt && pytest -v
cd bridge && npm test
cd web && npm test
```

## Project structure

```
simulator/   # Python ESP32 well-sensor simulator, publishes to MQTT (sensors/{device_id}/data)
mosquitto/   # Mosquitto MQTT broker config
bridge/      # Node.js MQTT subscriber -> computes alert status -> indexes into OpenSearch
opensearch/  # well-telemetry index mapping + setup script
web/         # Next.js dashboard: live well map, detail panel, history charts, SSE stream
```

## Secrets & environment

- `web/.env.local` holds `OPENSEARCH_URL`, `OPENSEARCH_INDEX`, `NEXT_PUBLIC_STADIA_API_KEY` and is gitignored — never commit it, never print/log its contents.
- `bridge/` reads `MQTT_URL`, `OPENSEARCH_URL`, `OPENSEARCH_INDEX` from the environment — no hardcoded credentials (a hardcoded OpenSearch password was previously removed from history).

## Commit messages

Follow the existing log style: short, imperative, capitalized summary line (e.g. "Rename project to IOT-pipeline-demo and remove hardcoded OpenSearch password"). No conventional-commit prefixes (`feat:`, `fix:`, etc.).
