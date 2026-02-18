#!/bin/sh
set -e

cat > /usr/share/nginx/html/config.js << 'EOL'
window.ENV_CONFIG = {
  CLIENT_ID: '${CLIENT_ID}',
  DOMAIN: '${DOMAIN}',
  BACKEND_URL: '${BACKEND_URL}',
  CUSTOM_STYLES: '${CUSTOM_STYLES}',
  MANUAL_URL: '${MANUAL_URL}',
  COPYRIGHT: '${COPYRIGHT}',
  GOOGLE_METRICA_ID: '${GOOGLE_METRICA_ID}'
};
EOL

envsubst < /usr/share/nginx/html/config.js > /tmp/config.js
mv /tmp/config.js /usr/share/nginx/html/config.js

echo "Environment variables injected into config.js"

exec nginx -g "daemon off;"