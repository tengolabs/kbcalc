# Changelog

All notable changes to kbCalc are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] — 2026-09-01

First public release under the kbCalc name (previously an internal prototype
called CalcAmp). Highlights since the last internal build:

### Added
- Dual-language UI (Czech / English), follows the system language, switchable
  in the About dialog.
- About dialog with project links and a once-a-day GitHub Releases update check.
- 5-band equalizer with presets, shuffle and repeat, hardware media keys, tray
  icon, remembered window position.
- ID3 tag reading (dependency-free), drag-to-reorder playlists.
- Mini notepad and calculation history.
- Podcasts: add an RSS feed, stream episodes on demand.
- Internet radio: paste a stream URL, the station joins the playlist (`LIVE`
  display, no seeking).
- The player LCD shows the real source type (file extension / STREAM) instead
  of a decorative fake bitrate.

### Fixed
- Podcast feeds and episodes behind an HTTP redirect (common with podcast
  CDNs) failed to load — Electron's `net.fetch` in manual-redirect mode throws
  instead of returning the 3xx; the SSRF guard now follows redirects itself
  via `net.request`, re-checking every hop.
- `Ctrl+C` / `Ctrl+-` and other modifier combos no longer drive the
  calculator (Ctrl+C used to clear the display). `Delete` clears like `C`.
- `±` on `Error` produced `-Error`; input is capped at 15 digits; results in
  exponent form survive in the history after a restart.
- The About dialog waited for the GitHub update check (no timeout) before
  showing the version — offline it stayed empty. The version now shows
  immediately, the check runs in the background with a timeout.
- Switching to a freshly dropped folder loaded the first track twice and
  leaked one in-memory copy of it.
- Remote sources (podcasts, radio) restored from a saved playlist no longer
  open a network connection on start-up — only when you press ▶.
- Hardware media keys are grabbed only while kbCalc is the active player
  (▶ … Stop) instead of for the whole app lifetime, so other players keep
  working.
- CI: the "tag must match package.json version" guard never ran (workflow was
  not triggered on tags).

### Security
- SSRF guard on all podcast/radio requests (private/loopback/link-local
  ranges refused, redirects re-checked, size cap + timeout).
- CSP without `unsafe-inline`; deny-all permission handler; `fs:read`/`fs:expand`
  size and breadth caps.
- electron-builder 25 → 26.15 (AppImage built by older versions had an
  uncontrolled search path issue, GHSA-7g7r-gx96-252g); `npm audit` clean.

### Changed
- Upgraded Electron to 44 (from an end-of-life 32).
