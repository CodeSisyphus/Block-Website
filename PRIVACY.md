# Privacy Policy — Site Blocker

**Effective date:** March 2026

## Summary

Site Blocker does **not** collect, transmit, or share any user data. Period.

## Data storage

- Your blocked-site list is stored **locally** on your device using the browser's `chrome.storage.local` API.
- No data is ever sent to any server, API, or third party.

## Permissions explained

| Permission | Why it's needed |
|---|---|
| `storage` | To save your blocked-site list locally on your device. |
| `declarativeNetRequest` | To block network requests to domains you specify. |
| `host_permissions: <all_urls>` | Required so the extension can block any domain you choose. |

## Network activity

This extension makes **zero** network requests. It contains no analytics, telemetry, crash reporting, or update-checking code.

## Third-party services

None. This extension has no dependencies on external services.

## Open source

The full source code is available for inspection. You can verify every claim in this policy by reading the code.

## Contact

If you have questions about this privacy policy, please open an issue on the GitHub repository.
