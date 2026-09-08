# ScamShield — Frontend (Netlify + Hugging Face Static Space)

A polished, presentation-ready React + Vite frontend for ScamShield. It runs **entirely in the
browser** using ScamShield's built-in rule-based **Pattern Engine** — no backend, no API token,
no server at all. This makes it fully static-hostable on both **Netlify** and a **Hugging Face
Static Space** for free.

## Stack

- React 18 + Vite 5
- `lucide-react` for icons
- Plain CSS design system (`src/styles/`)
- Client-side analysis engine (`src/analysis/engine.js`)

No backend framework, no `@gradio/client`, no secrets.

## How analysis works

`src/api.js` exposes a single `analyzeMessage(message)` entry point:

- **Free mode (default):** `VITE_SCAMSHIELD_API_URL` is empty → analysis runs locally via the
  Pattern Engine. No network request, no token.
- **With a secure backend (optional):** set `VITE_SCAMSHIELD_API_URL` → the message is POSTed to
  your backend (future path: Netlify → backend → Qwen3-30B). The browser never holds a token.

This means you can add a Qwen backend later without redesigning the frontend — just set the env var.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # outputs to dist/
npm run preview
```

The build is fully static (`base: "./"` in `vite.config.js`), so it works when served from any
path — root, a subfolder, or a Hugging Face Static Space.

## Deploy to Netlify

1. Connect the repo (or this folder) to a Netlify site.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. `netlify.toml` already configures the SPA fallback (`/* /index.html 200`).
5. No environment variables are required for the free version.

## Deploy to a Hugging Face Static Space (free showcase)

A Static Space serves the built `dist/` folder for free.

1. Build: `npm run build`
2. Create a new Space at https://huggingface.co/new-space, choosing the **Static** SDK.
3. Upload the **contents of `dist/`** to the Space root (so `index.html` is at the repo root,
   alongside the `assets/` folder).
4. The Space serves the app immediately — no build step, no secrets.

> The Static Space serves files from the repo root, so make sure `index.html` (not the `dist/`
> folder itself) is at the root of the Space repository.

## Environment variables

| Variable | Required? | Purpose |
|---|---|---|
| `VITE_SCAMSHIELD_API_URL` | No (leave empty for free mode) | Optional secure backend URL. Leave unset to use the local Pattern Engine. |

**Never put an `HF_TOKEN` in this file or anywhere in the frontend.**

## Features

- Hero with "Threat Signal Monitor" panel and fictional demo examples
- Live risk gauge, Scam DNA bars, highlighted evidence, signal cards
- Deterministic findings, links detected, recommended actions
- Loading, empty, error states
- Copy-results, reset, responsive layout, keyboard-friendly controls
- Clearly labeled "ScamShield Pattern Analysis" — never pretends to be AI model output
