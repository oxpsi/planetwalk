# PLANETWALK

A tiny sidescroller where you walk around a procedurally generated little
planet. The camera keeps "up" pointing away from the planet's center, so you
see the terrain curve away at the edges of the screen as you circle the world.

**Play: https://oxpsi.github.io/planetwalk/**

Vanilla ES modules + Canvas 2D. No dependencies, no build step, ~30 KB of JS.

## Controls

| Key | Action |
|---|---|
| `A`/`D` or `←`/`→` | walk left / right |
| hold `Shift` | run |
| `Space` / `W` / `↑` | jump |

Steep slopes (over 50°) can't be climbed on foot — you'll slide unless you have
enough momentum. The **New** button generates a fresh planet; **Export**
downloads the current world (seed + terrain params + player position) as a
small JSON file. Progress autosaves to your browser.

## How it works

- `js/core/` — procedural engine: seeded RNG (xmur3 + mulberry32), periodic
  circular fBm value noise, and a registry of named sub-generators.
- `js/planet/` — the `planet-terrain` sub-generator (720-sample circular
  heightmap + sparse decor) and a culling renderer that draws only the visible
  arc of the world.
- `js/player/` — polar-frame physics (radial gravity, slope/sliding rules,
  coyote time, jump buffering) and a procedural stick-rig character with six
  animation states.
- `js/save.js` — localStorage autosave + JSON export.

Every planet is fully determined by its 6-character seed: the same seed always
regenerates the same world.

## Development

Any static server works:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Deploy = push to `main` (GitHub Pages serves the repo root).
