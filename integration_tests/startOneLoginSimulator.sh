#!/usr/bin/env bash
# Starts the GOV.UK One Login simulator for integration tests in CI.
# Invoked via `npm run int-test-init:ci` by the shared hmpps-github-actions node_integration_tests workflow.
# Config should match the onelogin-simulator service in docker-compose-test.yml
set -euo pipefail

docker run -d \
  --name onelogin-simulator \
  -p 9090:3000 \
  -e CLIENT_ID=oneLoginClientId \
  -e IDENTITY_VERIFICATION_SUPPORTED=false \
  -e POST_LOGOUT_REDIRECT_URLS=http://localhost:3007/signed-out \
  -e REDIRECT_URLS=http://localhost:3007/auth/callback \
  -e SIMULATOR_URL=http://localhost:9090 \
  ghcr.io/govuk-one-login/simulator:latest

for i in {1..30}; do
  if curl -sf http://localhost:9090/ > /dev/null; then
    echo "onelogin-simulator is ready"
    exit 0
  fi
  echo "Waiting for onelogin-simulator... (attempt $i/30)"
  sleep 2
done

echo "onelogin-simulator failed to start"
docker logs onelogin-simulator
exit 1
