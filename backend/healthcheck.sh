#!/bin/sh
set -e

curl -f "http://127.0.0.1:${PORT:-8000}/health"
