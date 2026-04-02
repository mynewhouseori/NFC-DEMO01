# Debugging Workflow

This repo now includes a local preview server and an in-app debug panel.

## Start The Preview

Simplest option on Windows:

```powershell
start-local.bat
```

Or run:

```powershell
npm run preview
```

Open:

[http://127.0.0.1:4173/?debug=1](http://127.0.0.1:4173/?debug=1)

If you want the browser to open automatically:

```powershell
npm run preview:open
```

## What The Debug Panel Shows

- whether debug mode is on
- current host and URL
- Firebase project ID
- whether Web NFC is available on this device
- recent runtime activity and errors

## Best Way To Work With Codex

When something is wrong, tell Codex:

- what you clicked
- what you expected
- what actually happened
- any text shown in the debug panel

You can also use the `Copy Debug Info` button and paste the result directly into chat.

## Local Data

- local preview uses the same demo Firebase data as the hosted GitHub Pages app by default
- this keeps testing simple and avoids extra setup
- only use `config.local.js` if you intentionally want different local settings

## Important Limits

- Codex can help you fix app issues from the code and the debug information
- real NFC scanning still must be tested on a supported device and browser
- Firebase web config is visible in the browser at runtime, so true security still depends on Firebase rules and backend-only secrets
