# Privacy – UdePrompt

This document describes how the UdePrompt Chrome extension handles user data, for compliance with [Chrome Web Store policies](https://developer.chrome.com/docs/webstore/program-policies/) and the [Best Practices](https://developer.chrome.com/docs/webstore/best-practices/).

## Data collection

- **Template text**: The extension stores the user’s custom template (e.g. text with a `{{ transcript }}` placeholder) in Chrome’s local storage (`chrome.storage.local`) on the user’s device only. This data is not sent to any external server.
- **Clipboard**: When the user clicks to copy a transcript, the extension writes the formatted transcript to the system clipboard. No clipboard content is read, stored, or transmitted by the extension.
- **Udemy pages**: The extension runs only on `*.udemy.com` and reads the visible transcript DOM on the current page to extract text. It does not access other sites, and it does not send page content to any server.

## Data use

- Template text is used only to format the transcript before copying to the clipboard.
- No analytics, tracking, or third-party services are used.
- No personal or account data is collected or transmitted.

## Permissions

| Permission   | Purpose |
|-------------|---------|
| `activeTab` | Access the current tab only when the user invokes the extension (e.g. popup or FAB). |
| `clipboardWrite` | Copy the formatted transcript to the clipboard when the user requests it. |
| `storage`   | Save and load the user’s template in `chrome.storage.local` on the device. |

Content scripts are injected only on `*://*.udemy.com/*` as declared in the manifest.

## Updates

If our data practices change, we will update this document and the extension’s Chrome Web Store listing (including the Privacy tab) accordingly.
