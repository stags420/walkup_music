#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="charliehooks"
REPO_NAME="${REPO_NAME:-jstag711/stagswtf}"
DOCKER_USER="${DOCKER_USERNAME:-jstag711}"
IMAGE_TAG="$REPO_NAME:$SERVICE_NAME"
BUILD_TAR="$SCRIPT_DIR/../build/$SERVICE_NAME.tar"

if [[ ! -f "$BUILD_TAR" ]]; then
  echo "Missing $BUILD_TAR. Run ./hooks/charliehooks/scripts/build.sh first."
  exit 1
fi

if [[ -z "${DOCKER_PAT:-}" ]]; then
  for candidate in \
    "$SCRIPT_DIR/../../../.secrets/docker_pat" \
    "$SCRIPT_DIR/../../../../pi-webserver/.secrets/docker_pat"; do
    if [[ -f "$candidate" ]]; then
      DOCKER_PAT="$(cat "$candidate")"
      break
    fi
  done
fi

if ! command -v skopeo >/dev/null 2>&1; then
  echo "skopeo is required to publish the cached OCI archive."
  exit 1
fi

AUTH_ARGS=()
if [[ -n "${DOCKER_PAT:-}" ]]; then
  AUTH_ARGS+=(--dest-creds "${DOCKER_USER}:${DOCKER_PAT}")
fi

echo "Publishing $IMAGE_TAG from $BUILD_TAR..."
skopeo copy --all "${AUTH_ARGS[@]}" "oci-archive:$BUILD_TAR" "docker://$IMAGE_TAG"
echo "Published $IMAGE_TAG"

