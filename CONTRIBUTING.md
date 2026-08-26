# Contributing to kbCalc

Thanks for taking a look! kbCalc is a small showcase app, so the bar is low
and the codebase is deliberately tiny.

## Run it from source

```bash
npm install
npm start          # dev launch (if Electron's chrome-sandbox refuses to start on your Linux, use ./kbcalc.sh — it adds --no-sandbox)
npm test           # dependency-free checks: syntax, calculator/history, i18n, SSRF filter
```

`npm test` runs in plain Node (no Electron) and is what CI runs on every push
and PR — keep it green. It won't catch UI/Electron regressions, so also launch
the app and click through anything you touched.

When running from source you will see an *"Electron Security Warning (Insecure
Content-Security-Policy)"* in the DevTools console. It is a known Electron
false positive with `contextIsolation` (the check runs in the isolated world,
which is not covered by the page CSP); the CSP is set in `index.html` and
packaged builds do not print the warning.

## Code layout

| File | What lives there |
|---|---|
| `main.js` | Electron main process: window, IPC handlers (`fs:read`, `fs:expand`, links, update check), profile migration |
| `preload.js` | The entire renderer↔main bridge — a handful of named functions, nothing generic |
| `index.html` | Static UI markup (Czech defaults + `data-i18n` keys) |
| `app.js` | All renderer logic: calculator, player, playlists, visualizer, i18n dictionary |
| `app.css` | All styles |
| `.github/workflows/build.yml` | CI: 3-OS matrix, manual runs publish a draft release, `v*` tags a real one |

## Ground rules

- **The calculator behaves like the Windows *Standard* calculator on purpose** —
  left-to-right evaluation (`2 + 3 × 4 = 20`), context-aware percent, `=` does
  not repeat the last operation. Please don't "fix" these.
- **Security invariants** (see the Security model in the README): no new IPC
  surface without a guard. The renderer may pass a file path (validated against
  the audio allow-list + realpath) or a podcast URL (validated by the SSRF
  guard — private/loopback ranges refused, redirects re-checked); it must never
  get a channel that fetches an arbitrary host or reads an arbitrary path. CSP
  stays without `unsafe-inline`, so all scripts/styles live in
  `app.js`/`app.css`, never inline in the HTML.
- **Both languages**: any user-visible string goes through the `I18N`
  dictionary in `app.js` (cs + en), static markup via `data-i18n` /
  `data-i18n-title` attributes.
- No new runtime dependencies — the app is dependency-free by design
  (Electron + what Chromium provides).
- Before opening a PR, actually launch the app (`npm start`) and click through
  the calculator, the player and the About dialog. `node --check` on the JS
  files catches syntax; it does not catch a broken app.

## Reporting bugs / proposing features

Use the issue templates. For security issues, **do not open an issue** —
see [SECURITY.md](SECURITY.md).
