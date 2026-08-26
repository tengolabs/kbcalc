# Security Policy

## Reporting a vulnerability

Please report security issues privately to **security@killbottleneck.com** —
do not open a public issue for vulnerabilities.

We will acknowledge your report within a few days. Please include steps to
reproduce and, if possible, an assessment of impact.

## Scope notes

kbCalc is a local desktop app that plays local audio files and podcasts. It
never uploads anything — there is no telemetry. It makes network requests only
in the main process, on your behalf:

- an anonymous once-a-day query to the GitHub Releases API (new-version check);
- when you add a podcast or an internet radio station: downloading the RSS
  feed and streaming the episode / station you play (only after you press ▶ —
  never on start-up).

Podcast and radio requests go through an SSRF guard that resolves the target
host and refuses private / loopback / link-local ranges, follows redirects
manually and re-checks every hop. The renderer never fetches over the network
itself; it only asks the main process for these two specific operations
(fetch a feed, stream a URL).

Reports about the Electron hardening (IPC surface, CSP, file-system guards, the
podcast fetch/stream path) are especially welcome.
