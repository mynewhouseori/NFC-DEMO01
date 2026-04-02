# AGENTS.md

This file helps Codex work well in this repository and keeps the project easy to operate for a non-technical builder.

## Project Snapshot

- Project type: static HTML/CSS/JS app
- Main entry: `index.html`
- Asset file: `background.jpeg`
- Database: Firebase Firestore
- Main purpose: NFC equipment registration and scan demo with Hebrew, English, and Arabic UI

## Current App Behavior

- The app is split into a few simple files:
  - `index.html` for structure
  - `styles.css` for styling
  - `app.js` for app logic
  - `translations.js` for Hebrew, English, and Arabic text
- Firestore collections currently used:
  - `nfc_items`
  - `nfc_scan_logs`
- A simple password check currently protects the registration screen.

## Important Technical Notes

- This app uses browser Web NFC, so scanning only works on supported mobile browsers and devices.
- Web NFC usually requires a secure context such as `https://` or `localhost`.
- Public demo settings live in `config.demo.js` for GitHub Pages.
- Local project settings can override them through `config.local.js`, which should not be committed.
- UI text should stay centralized in `translations.js`.
- There is no build step yet. Keep changes simple unless the user explicitly asks for a refactor.
- This is a static app. Do not assume a dev server is required for every test.

## How Codex Should Work In This Repo

- Prefer small, low-risk improvements over big rewrites.
- Preserve the simple file structure and avoid unnecessary framework complexity.
- Treat this as a repo for a non-technical user first, and an engineering project second.
- Keep the experience calm and low-friction: fewer steps, fewer files, fewer decisions.
- When making changes, explain them in simple product language first, not just engineering language.
- If suggesting architecture changes, offer a safe option and a more advanced option.
- Keep Hebrew, English, and Arabic support working.
- When changing wording, update `translations.js` first instead of scattering text across the app.
- Do not remove Firebase or Web NFC behavior unless the user asks.
- Prefer direct updates to `main` for this repo unless the user explicitly asks for branches or PR flow.
- If the user says `update`, interpret that as: make the change, commit it, and push it to `main`.
- Avoid asking the user to run git commands manually when Codex can do it.
- Be careful with hardcoded values such as:
  - password value
  - Firestore collection names
- Keep GitHub Pages working at `https://mynewhouseori.github.io/NFC-DEMO01/` unless the user explicitly wants to change deployment behavior.
- Use `config.demo.js` for the hosted demo and `config.local.js` only as an optional local override.
- Be explicit that Firebase web config is not a true browser secret; treat Firebase rules and server-side credentials as the real security boundary.
- If a change touches data shape, clearly note any Firestore migration risk.

## Preferred Next-Step Improvements

When asked for improvements, prefer this order:

1. Fix bugs and make behavior clearer.
2. Improve readability and safety inside `index.html`.
3. Extract configuration into clearly named constants.
4. Split the app into smaller files only when the project is ready for that step.
5. Add deployment and Firebase setup documentation.

## Plain-Language Collaboration Style

Assume the repo owner is a strong product innovator and may not want deep technical jargon.

- Use plain English.
- Prefer short explanations over technical deep-dives unless asked.
- Offer 2-3 concrete options when tradeoffs matter.
- Name risks clearly.
- State what changed, why it matters, and how to test it.
- Make progress without forcing the user to answer many setup questions.
- Default to doing the helpful next step instead of turning the user into the operator.

## Common Tasks Codex Can Help With

- improve the UI and mobile experience
- clean up the single-file app without breaking behavior
- make Firebase usage safer and clearer
- push straightforward updates with git / `gh` when the user wants changes published
- help convert the app later into a more scalable structure
- add admin features, validation, filtering, and logs
- prepare for deployment to Firebase Hosting or another static host

## Testing Guidance

When making changes, Codex should verify what it can locally:

- Prefer the simplest test path first:
  - use `start-local.bat` or `npm run preview:open` for browser testing in this repo
  - use Chrome as the default browser for manual checks
  - use headless Chrome for quick smoke tests when available
  - use `http://127.0.0.1:4173/` as the default local app URL
  - use `http://127.0.0.1:4173/?debug=1` when debugging is needed
- confirm files changed as expected
- check for obvious HTML/JS syntax issues
- verify that the main buttons still point to real functions
- for UI checks, prefer validating:
  - home screen labels and icons
  - language switch
  - register/password flow
  - table tab
  - logs tab
  - demo scan button
- describe any testing that cannot be completed in the sandbox
- remind the user that real NFC testing must happen on a supported device

## Browser Test Notes

- Do not use `file:///.../index.html` for this app. It uses a module-based Firebase frontend and will hit browser CORS/module restrictions.
- Prefer Chrome over Edge for this repo unless the user explicitly asks for something else.
- For headless browser checks, prefer Chrome with a temporary user-data directory.
- Use `tools/serve.js` / `npm run preview` / `start-local.bat` for local browser testing.
- If screenshot capture is blocked by the sandbox, say so clearly instead of pretending visual verification happened.
- Default Chrome smoke-test flow:
  - start localhost preview
  - run a desktop viewport pass with `http://127.0.0.1:4173/`
  - run a mobile viewport pass with `http://127.0.0.1:4173/`
  - check home screen text, icons, and language switch in both
  - check register/password flow, table tab, logs tab, and demo scan in both when the change affects layout or interaction
  - use `?debug=1` and capture a screenshot when visual validation or diagnostics matter
- Recommended headless Chrome sizes:
  - desktop: `1280x1600`
  - mobile: `390x844`

## Known Product Constraints

- Keep the experience simple enough for a demo.
- Avoid overengineering.
- Prefer visible progress over hidden complexity.
- Do not introduce workflow ceremony unless the user explicitly asks for it.
- If adding security-sensitive features, point out what is demo-grade versus production-grade.
