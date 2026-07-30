#!/usr/bin/env bash
# kbCalc launcher — spustí plovoucí Electron aplikaci
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -x "$DIR/node_modules/.bin/electron" ]; then
  # --no-sandbox jen pro DEV spouštění z node_modules: electronův chrome-sandbox
  # tam nemá SUID bit a na distribucích s omezenými user namespaces by start
  # spadl. Packaged buildy (AppImage/deb/exe) tento skript nepoužívají a běží
  # se sandboxem. Neodstraňovat bez otestování `npm start` na čistém systému.
  exec "$DIR/node_modules/.bin/electron" --no-sandbox "$DIR" >/dev/null 2>&1
fi

# fallback: kdyby Electron nebyl nainstalovaný, otevři v prohlížeči jako app
for B in google-chrome-stable google-chrome chromium chromium-browser; do
  if command -v "$B" >/dev/null 2>&1; then
    exec "$B" --app="file://$DIR/index.html" --window-size=340,760 \
      --user-data-dir="$HOME/.config/kbcalc-profile" >/dev/null 2>&1
  fi
done
xdg-open "file://$DIR/index.html"
