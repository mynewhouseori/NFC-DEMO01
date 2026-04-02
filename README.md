# NFC Demo

This repo contains a simple NFC equipment demo app built with static HTML, CSS, JavaScript, and Firebase Firestore.

## What It Does

- scans NFC tags on supported devices
- shows whether an item exists in the database
- lets you register or update equipment
- stores equipment records in Firestore
- stores scan history in Firestore
- supports Hebrew and English

## Project Structure

- `index.html` - the main HTML entry file
- `styles.css` - app styles
- `app.js` - app logic, Firebase logic, and NFC logic
- `translations.js` - Hebrew and English UI text in one place
- `background.jpeg` - home screen background image
- `AGENTS.md` - instructions for Codex so this repo stays easy to work with
- `config.demo.js` - public demo config used by GitHub Pages
- `config.local.example.js` - example local config file for Firebase and app settings
- `docs/CODEX_WORKFLOW.md` - simple working rhythm for Codex + GitHub

## Firebase Collections

- `nfc_items` - equipment records
- `nfc_scan_logs` - scan history

## Important Notes

- This is currently a demo-style app, not a production-hardened system.
- The Firebase config is loaded by the app through `config.demo.js` and optional `config.local.js`.
- GitHub Pages uses `config.demo.js`.
- Local work can override that with `config.local.js`, which is ignored by git.
- Copy `config.local.example.js` to `config.local.js` only if you want different local settings.
- Local testing uses the same demo Firebase project and data by default.
- NFC scanning depends on browser and device support.
- Web NFC typically requires `https://` or `localhost`.
- Important: Firebase web config is not a true secret in a browser app. Real protection must come from Firebase Security Rules and backend-only secrets.

## Best Way To Work With Codex Here

You can ask for changes in plain language, for example:

- "Make the home screen feel more premium."
- "Add a search box to the table."
- "Move Firebase settings into a safer config section."
- "Help me turn this into a cleaner multi-file project."
- "Make the registration flow easier for operators."

For this POC, keep GitHub usage simple: make the change, test it, and push to `main`.
If you say `update`, Codex should treat that as: make the change, commit it, and push it to `main`.

## Good Next Upgrades

- improve code organization inside `index.html`
- replace hardcoded password handling with a safer approach
- add form validation and better error messages
- add filtering and search for equipment
- prepare deployment instructions
- later, split HTML, CSS, and JavaScript into separate files

## Language Text

- UI wording lives in `translations.js`
- `app.js` uses translation keys instead of holding all text inline
- if you want to change Hebrew or English wording, start in `translations.js`
- keep the same keys in both languages so the app stays consistent

## How To Test

- Double-click `start-local.bat`
- Run `npm run preview`
- Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/)
- Use Chrome as the default browser for testing this repo
- Do not open `index.html` directly with `file://`
- Open the app in Chrome
- Check language switching.
- Check registration flow.
- Check table and scan log loading from Firebase.
- Test NFC scanning on a supported mobile device.

## Local Preview

- `start-local.bat` starts the local preview and opens the browser
- `npm run preview` starts a local server for the repo
- `npm run preview:open` starts the server and opens the preview in your browser
- do not open `index.html` directly with `file://` for this app; use localhost preview instead
- use Chrome for local browser checks and headless smoke tests
- use [http://127.0.0.1:4173/?debug=1](http://127.0.0.1:4173/?debug=1) when you want the built-in debug panel
- by default, local preview uses the same live demo data as GitHub Pages
- only create `config.local.js` if you want a different local Firebase project or password

See [docs/DEBUGGING.md](C:\Users\mynew\Desktop\NFC-DEMO01\docs\DEBUGGING.md) for the debugging workflow.

## Working Style For This Repo

Keep changes practical and easy to understand. Small improvements that make the product clearer are better than a large refactor too early.
