import { ProcEngine } from './js/core/engine.js';
import { randomSeed } from './js/core/rng.js';
import { makePlanet, planetParams } from './js/planet/generator.js';
import { PlanetRenderer } from './js/planet/renderer.js';
import { Player, spawnOnPlanet, input } from './js/player/player.js';
import { drawCharacter } from './js/player/pose.js';
import { saveGame, loadGame, clearSave, exportGame } from './js/save.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const dpr = Math.min(window.devicePixelRatio || 1, 2);

const engine = new ProcEngine();
let planet, renderer, player;
let zoom = 2, viewW = 0, viewH = 0;
let saveTimer = 0;

function buildWorld(seed, params, savedPlayer) {
  planet = makePlanet(engine, seed, params);
  renderer = new PlanetRenderer(planet);
  player = spawnOnPlanet(planet);
  if (savedPlayer) {
    player.x = savedPlayer.x; player.y = savedPlayer.y;
    player.vx = savedPlayer.vx; player.vy = savedPlayer.vy;
  }
}

function snapshot() {
  return {
    v: 1,
    seed: planet.seed,
    params: { radius: planet.radius, samples: planet.samples,
              amplitude: planetParams.amplitude, octaves: planetParams.octaves },
    player: { x: player.x, y: player.y, vx: player.vx, vy: player.vy },
  };
}

function newPlanet() {
  clearSave();
  buildWorld(randomSeed(), { ...planetParams });
  saveGame(snapshot());
}

function resize() {
  viewW = window.innerWidth; viewH = window.innerHeight;
  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
  canvas.style.width = viewW + 'px';
  canvas.style.height = viewH + 'px';
  zoom = Math.min(viewW, viewH) / 500;
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, viewW, viewH);

  const px = player.x, py = player.y;
  const theta = Math.atan2(py, px);
  // camera sits slightly radially outward so the ground fills the lower screen
  const camR = Math.hypot(px, py) + 60;
  const camX = Math.cos(theta) * camR, camY = Math.sin(theta) * camR;

  ctx.translate(viewW / 2, viewH / 2);
  ctx.scale(zoom, zoom);
  ctx.rotate(-theta - Math.PI / 2);
  ctx.translate(-camX, -camY);

  renderer.draw(ctx, theta, camX, camY, viewW, viewH, zoom);

  // character: local frame — origin at feet, +y = toward planet center
  // (pose.js applies facing internally; no mirroring here)
  ctx.translate(px, py);
  ctx.rotate(theta + Math.PI / 2);
  drawCharacter(ctx, player);
}

function step(dt) {
  player.update(dt, planet);
  saveTimer += dt;
  if (saveTimer >= 3) { saveTimer = 0; saveGame(snapshot()); }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  step(dt);
  render();
  requestAnimationFrame(loop);
}

// input
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'run', ShiftRight: 'run',
};
addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    if (!e.repeat) input.jump = true;
    e.preventDefault();
    return;
  }
  const k = KEYMAP[e.code];
  if (k) { input[k] = true; e.preventDefault(); }
});
addEventListener('keyup', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { input.jump = false; return; }
  const k = KEYMAP[e.code];
  if (k) input[k] = false;
});

document.getElementById('btn-new').addEventListener('click', newPlanet);
document.getElementById('btn-export').addEventListener('click', () => exportGame(snapshot()));

addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(snapshot()); });
addEventListener('pagehide', () => saveGame(snapshot()));

// boot: cached planet if we have one, else a fresh world
resize();
const saved = loadGame();
if (saved && saved.seed) {
  const params = { ...planetParams, ...(saved.params || {}) };
  buildWorld(saved.seed, params, saved.player);
} else {
  buildWorld(randomSeed(), { ...planetParams });
}
requestAnimationFrame(loop);
