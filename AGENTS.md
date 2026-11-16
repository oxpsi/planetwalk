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
- Hosted on GitHub Pages from the `main` branch of this repo (root, no Jekyll).
- Repo remote: `git@github.com:<owner>/planetwalk.git`. Deploy = push to `main`;
  Pages serves automatically. No CI needed.
