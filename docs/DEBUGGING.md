# Debugging Workflow

This repo now includes a local preview server and an in-app debug panel.

## Simplest Rule

This is a static app, but for this repo you should still use localhost preview because the app loads Firebase as browser modules.

- do not open `index.html` directly with `file://`
- use `start-local.bat` or `npm run preview:open`
- use Chrome as the default browser for testing
- use headless Chrome for smoke tests when available

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

## Default Chrome Test Flow

Use this as the standard local test routine:

1. Start the preview with `start-local.bat` or `npm run preview:open`
2. Open `http://127.0.0.1:4173/?debug=1` in Chrome
3. Check the home screen text, icons, and language switch
4. Check the register flow, password screen, table tab, logs tab, and demo scan
5. Use headless Chrome screenshots when a visual check matters

Example headless Chrome pattern:

```powershell
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --window-size=1280,1600 --screenshot=chrome-check.png "http://127.0.0.1:4173/?debug=1"
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

## Updating Text

- edit `translations.js` when you want to change Hebrew or English wording
- keep the same translation keys in both languages
- after changing text, recheck the home screen, register flow, table tab, and logs tab in Chrome

## Important Limits

- Codex can help you fix app issues from the code and the debug information
- sandboxed browser screenshot capture may fail; if that happens, Codex should say so clearly
- real NFC scanning still must be tested on a supported device and browser
- Firebase web config is visible in the browser at runtime, so true security still depends on Firebase rules and backend-only secrets
