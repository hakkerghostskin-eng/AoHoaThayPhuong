#!/bin/sh
set -eu

: "${BACKEND_PROVIDER:=local}"
: "${API_BASE_URL:=/api}"
: "${SUPABASE_URL:=}"
: "${SUPABASE_ANON_KEY:=}"
: "${FIREBASE_API_KEY:=}"
: "${FIREBASE_PROJECT_ID:=}"
: "${FIREBASE_DATABASE_URL:=}"

envsubst \
    '${BACKEND_PROVIDER} ${API_BASE_URL} ${SUPABASE_URL} ${SUPABASE_ANON_KEY} ${FIREBASE_API_KEY} ${FIREBASE_PROJECT_ID} ${FIREBASE_DATABASE_URL}' \
    < /opt/medicloud/runtime-config.template.js \
    > /app/js/runtime-config.js
