#!/bin/sh
set -e

# ingress defaults
export FRONT_SERVER_NAME="${FRONT_SERVER_NAME:-_}"
export FRONT_PLAIN_PORT="${FRONT_PLAIN_PORT:-80}"
export BACKEND_HOST="${BACKEND_HOST:-id-back}"
export BACKEND_PORT="${BACKEND_PORT:-3005}"
export OIDC_HOST="${OIDC_HOST:-id-oidc}"
export OIDC_PORT="${OIDC_PORT:-3003}"
export AUTH_HOST="${AUTH_HOST:-id-auth}"
export AUTH_PORT="${AUTH_PORT:-3007}"
export FRONT_BASE_PATH="${FRONT_BASE_PATH:-${ID_BASE_PATH:-}}"
export FRONT_ENABLE_INTERNAL_MTLS="${FRONT_ENABLE_INTERNAL_MTLS:-false}"
export FRONT_MTLS_PORT="${FRONT_MTLS_PORT:-3443}"
export FRONT_MTLS_VERIFY_DEPTH="${FRONT_MTLS_VERIFY_DEPTH:-3}"

# Backward compatibility for installations that already expose a path-based
# DOMAIN but do not yet define ID_BASE_PATH/FRONT_BASE_PATH explicitly.
if [ -z "$FRONT_BASE_PATH" ] && [ -n "${DOMAIN:-}" ]; then
  domain_authority_and_path="${DOMAIN#*://}"
  case "$domain_authority_and_path" in
    */*)
      FRONT_BASE_PATH="/${domain_authority_and_path#*/}"
      FRONT_BASE_PATH="${FRONT_BASE_PATH%%[?#]*}"
      ;;
  esac
fi

if [ "$FRONT_BASE_PATH" = "/" ]; then
  FRONT_BASE_PATH=""
fi

case "$FRONT_BASE_PATH" in
  ""|/*) ;;
  *)
    echo "FRONT_BASE_PATH must be empty or start with '/': $FRONT_BASE_PATH" >&2
    exit 1
    ;;
esac

while [ -n "$FRONT_BASE_PATH" ] && [ "${FRONT_BASE_PATH%/}" != "$FRONT_BASE_PATH" ]; do
  FRONT_BASE_PATH="${FRONT_BASE_PATH%/}"
done

if [ -n "$FRONT_BASE_PATH" ] && ! printf '%s' "$FRONT_BASE_PATH" | grep -Eq '^(/[A-Za-z0-9._~-]+)+$'; then
  echo "FRONT_BASE_PATH contains unsupported characters: $FRONT_BASE_PATH" >&2
  exit 1
fi
export FRONT_BASE_PATH

envsubst '${FRONT_SERVER_NAME} ${FRONT_PLAIN_PORT} ${FRONT_BASE_PATH} ${BACKEND_HOST} ${BACKEND_PORT} ${OIDC_HOST} ${OIDC_PORT} ${AUTH_HOST} ${AUTH_PORT}' \
  < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

if [ "$FRONT_ENABLE_INTERNAL_MTLS" = "true" ]; then
  : "${FRONT_MTLS_CERT_FILE:?FRONT_MTLS_CERT_FILE is required when FRONT_ENABLE_INTERNAL_MTLS=true}"
  : "${FRONT_MTLS_KEY_FILE:?FRONT_MTLS_KEY_FILE is required when FRONT_ENABLE_INTERNAL_MTLS=true}"
  : "${FRONT_MTLS_CA_FILE:?FRONT_MTLS_CA_FILE is required when FRONT_ENABLE_INTERNAL_MTLS=true}"

  envsubst '${FRONT_SERVER_NAME} ${FRONT_MTLS_PORT} ${FRONT_BASE_PATH} ${FRONT_MTLS_CERT_FILE} ${FRONT_MTLS_KEY_FILE} ${FRONT_MTLS_CA_FILE} ${FRONT_MTLS_VERIFY_DEPTH} ${BACKEND_HOST} ${BACKEND_PORT}' \
    < /etc/nginx/templates/mtls.conf.template > /etc/nginx/conf.d/mtls.conf
  echo "Internal mTLS ingress enabled on port ${FRONT_MTLS_PORT}"
else
  rm -f /etc/nginx/conf.d/mtls.conf
  echo "Internal mTLS ingress disabled"
fi

# Start nginx.
exec nginx -g "daemon off;"
