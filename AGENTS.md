# AGENTS.md — planetwalk

Tiny procedural sidescroller: walk around a procedurally generated tiny planet.
Vanilla ES modules + Canvas 2D. **No dependencies, no build step, no framework.**

## Layout
```
index.html          page shell (top bar: New / Export)
style.css           greyscale UI
main.js             boot, game loop, camera, input, autosave
js/core/            procedural engine core (rng, noise, ProcEngine)
js/planet/          planet sub-generator + renderer
js/player/          player physics + procedural character animation
js/save.js          localStorage save/load + JSON export
DESIGN.md           READ FIRST — full design + exact module contracts
```

## Rules
- Read `DESIGN.md` before changing anything; module signatures there are contracts.
- ES modules only (`<script type="module">`). Browser-targeted code, runs from
  any static server (or `python3 -m http.server`).
- Greyscale palette only. Sky white, terrain grey, character near-black.
- Perf matters: no per-frame allocations in hot paths, cull off-screen decor,
  keep the whole game < ~40 KB of JS.
- Do not add libraries, bundlers, or tooling. Do not touch files outside your task.
- Test locally with a static server before committing; check the browser console
  is clean (no errors/warnings).

## Publishing
- **Live at https://oxpsi.github.io/planetwalk/** — GitHub Pages, deployed from
  the `main` branch (repo root, no Jekyll, no CI).
- Remote: `git@github.com:oxpsi/planetwalk.git` (SSH push auth works).
- Deploy = push to `main`; Pages rebuilds automatically. Build status:
  `GET /repos/oxpsi/planetwalk/pages/builds/latest` with the API token below.
- GitHub API token (repo creation, Pages config, metadata): lives OUTSIDE the
  repo at `~/.secrets/emin-bursa/github-api-token.json` (key `api_token`,
  classic token, `repo` scope). Read on demand; never print or commit it.
- TODO: the old fine-grained token (`github_pat_...`, no admin/pages perms) is
  still active — revoke at github.com/settings/personal-access-tokens when
  convenient (UI-only, cannot be done via API).
