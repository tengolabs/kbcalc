#!/usr/bin/env bash
# CalcAmp launcher — spustí plovoucí Electron aplikaci
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -x "$DIR/node_modules/.bin/electron" ]; then
  exec "$DIR/node_modules/.bin/electron" --no-sandbox "$DIR" >/dev/null 2>&1
fi

# fallback: kdyby Electron nebyl nainstalovaný, otevři v prohlížeči jako app
for B in google-chrome-stable google-chrome chromium chromium-browser; do
  if command -v "$B" >/dev/null 2>&1; then
    exec "$B" --app="file://$DIR/index.html" --window-size=340,760 \
      --user-data-dir="$HOME/.config/calcamp-profile" >/dev/null 2>&1
  fi
done
xdg-open "file://$DIR/index.html"
