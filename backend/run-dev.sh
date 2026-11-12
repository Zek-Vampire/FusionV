#!/usr/bin/env bash
set -e

[ -f .env ] || {
    echo "Create .env first (copy .env.example)"
    exit 1
}

set -a
. ./.env
set +a

mvn spring-boot:run
