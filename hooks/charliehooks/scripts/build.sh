#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SERVICE_NAME="charliehooks"
REPO_NAME="${REPO_NAME:-jstag711/stagswtf}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
IMAGE_TAG="$REPO_NAME:$SERVICE_NAME"
BUILD_DIR="$SCRIPT_DIR/../build"

mkdir -p "$BUILD_DIR"

echo "Building $IMAGE_TAG to $BUILD_DIR/$SERVICE_NAME.tar..."

docker buildx build \
  --platform "$PLATFORMS" \
  -t "$IMAGE_TAG" \
  -f "$REPO_ROOT/hooks/charliehooks/Dockerfile" \
  "$REPO_ROOT" \
  --output "type=oci,dest=$BUILD_DIR/$SERVICE_NAME.tar"

echo "Built $IMAGE_TAG"

