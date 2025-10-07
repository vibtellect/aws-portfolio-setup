# Changelog

All notable changes to `s3-bucket-secure` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-07

### Added
- Initial release
- Block Public Access (all 4 flags enabled)
- SSE-S3 encryption by default
- Optional versioning via `versioned` prop
- Optional server access logs via `serverAccessLogs` prop
- Configurable removal policy (`RETAIN` default)
- HTTPS-only enforced via bucket policy

### Security
- Block Public Access aktiviert
- Serverseitige Verschlüsselung (SSE-S3)
- HTTPS-Enforcement

### Notes
- Getestet mit CDK v2.120.0
- Kompatibel mit Node.js 18+
