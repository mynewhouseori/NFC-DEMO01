# Codex Workflow

This repo is set up to stay simple for a POC.

## Simple Working Rhythm

1. Open the repo in Codex.
2. Ask for one meaningful improvement at a time.
3. Let Codex make the change and explain it in plain language.
4. Test the change in the browser.
5. Push the update to `main` when it looks good.

## Good Prompts For This Repo

- "Improve the equipment table for operators."
- "Make the register flow clearer and safer."
- "Refactor the Firebase settings without changing behavior."
- "Prepare this demo for a more production-ready next version."
- "Review this repo and tell me the highest-risk parts first."

## Simple Git Commands

Run these from the repo folder:

```powershell
git status
git add .
git commit -m "Improve equipment table experience"
git push origin main
```

If you want Codex to publish changes, say so directly and I’ll use your installed git / `gh` setup as simply as possible.

## What To Ask Codex To Include In Every Change

- what changed
- why it matters
- how to test it
- any product risk or Firebase risk

## Smart Safety Rule

If a change affects Firebase data structure, auth, or deployment, ask Codex to clearly separate:

- demo-grade quick fix
- safer long-term approach

That keeps decisions easy to understand before complexity grows.
