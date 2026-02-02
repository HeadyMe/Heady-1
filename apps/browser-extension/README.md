# HeadyMCP Browser Extension

Non-intrusive WebExtension that connects the active tab to HeadyMCP services. The extension previews actions first and only executes on explicit confirmation.

## Key Behaviors

- **Non-intrusive by default**: Preview-only until the user confirms execution.
- **Active tab only**: Uses `activeTab` and on-demand injection.
- **Visible elements only**: Actions apply to elements in the viewport.
- **Explicit scope expansion**: Optional host permissions can be requested per user action.

## Local Setup

1. Ensure the Heady Automation IDE backend is running (`http://localhost:4100`).
2. Set `HC_AUTOMATION_API_KEY` in `.env.local` and copy it into the extension settings.
3. Load the extension from `apps/browser-extension`.

## Install / Load (Chrome, Edge, Brave, Opera)

1. Go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `apps/browser-extension`.

## Install / Load (Firefox)

1. Visit `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select the `manifest.json` in `apps/browser-extension`.

## Install / Load (Safari)

1. Use Xcode → **File → New → Project → Safari Extension App**.
2. Choose **Convert Existing Web Extension** and select `apps/browser-extension`.
3. Build & run to install in Safari.

## Notes

- MCP endpoints require `x-api-key` headers. Configure in the extension options page.
- If `/api/task/execute` is deployed to a different base URL, update it in settings.
- The backend must allow extension origins via CORS for production deployments.
