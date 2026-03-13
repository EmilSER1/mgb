#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist}"
ARCHIVE_NAME="bitrix_meetings_stub_$(date +%Y%m%d_%H%M%S).tar.gz"

mkdir -p "$OUT_DIR"

cd "$ROOT_DIR"
tar -czf "$OUT_DIR/$ARCHIVE_NAME" \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='*.log' \
  .

echo "$OUT_DIR/$ARCHIVE_NAME"
