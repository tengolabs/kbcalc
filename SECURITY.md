# Security Policy

## Reporting a vulnerability

Please report security issues privately to **security@killbottleneck.com** —
do not open a public issue for vulnerabilities.

We will acknowledge your report within a few days. Please include steps to
reproduce and, if possible, an assessment of impact.

## Scope notes

CalcAmp is a local desktop app: it plays local audio files and never uploads
anything. The only network request the app makes is an anonymous once-a-day
query to the GitHub Releases API to detect new versions (no telemetry).
Reports about the Electron hardening (IPC surface, CSP, file-system guards)
are especially welcome.
