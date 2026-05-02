#!/bin/sh

set -eu

curl --fail --silent --show-error http://localhost:9000/health
curl --fail --silent --show-error http://localhost:9001/rustfs/console/health
