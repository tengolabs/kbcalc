# Changelog

All notable changes to kbCalc are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

### Security
- SSRF guard on all podcast requests (private/loopback/link-local ranges
  refused, redirects re-checked, size cap + timeout).
- CSP without `unsafe-inline`; deny-all permission handler; `fs:read`/`fs:expand`
  size and breadth caps.

### Changed
- Upgraded Electron to 43 (from an end-of-life 32).
