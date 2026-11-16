// Procedural stick-rig character, drawn in the LOCAL frame: origin = feet
// contact, +y = down (canvas convention), +x = tangent-forward. p.facing is
// applied here by mirroring all angles, so after mirroring +x = facing forward.
// Caller applies camera + rotation only. Height ~26, near-black, 2px lines.

const INK = '#1e1e1e';
const INK_FAR = '#5a5a5a'; // far-side limbs, subtle depth cue

// Two-segment limb from (x,y). Angles measured from straight down, + = forward.
function limb(ctx, x, y, a1, a2, l1, l2) {
  const mx = x + Math.sin(a1) * l1, my = y + Math.cos(a1) * l1;
  ctx.moveTo(x, y);
  ctx.lineTo(mx, my);
  ctx.lineTo(mx + Math.sin(a2) * l2, my + Math.cos(a2) * l2);
}

export function drawCharacter(ctx, p) {
  const t = p.phase;
  let bob = 0, crouch = 0, lean = 0;
  let la1 = 0, la2 = 0, lb1 = 0, lb2 = 0; // legs: thigh, shin (abs angle from down)
  let aa1 = 0, aa2 = 0, ab1 = 0, ab2 = 0; // arms: upper, forearm

  switch (p.state) {
    case 'walk': {
      const s = Math.sin(t);
      la1 = 0.55 * s; la2 = la1 + 0.35;
      lb1 = -0.55 * s; lb2 = lb1 + 0.35;
      aa1 = -0.45 * s; aa2 = aa1 + 0.5;
      ab1 = 0.45 * s; ab2 = ab1 + 0.5;
      bob = -Math.abs(Math.cos(t)) * 1.2;
      lean = 0.08;
      break;
    }
    case 'run': {
      const s = Math.sin(t);
      la1 = 0.85 * s; la2 = la1 + 0.9;
      lb1 = -0.85 * s; lb2 = lb1 + 0.9;
      aa1 = -0.9 * s; aa2 = aa1 + 1.1;
      ab1 = 0.9 * s; ab2 = ab1 + 1.1;
      bob = -Math.abs(Math.cos(t)) * 2;
      lean = 0.3;
      break;
    }
    case 'jump': // legs tucked
      la1 = 0.9; la2 = 2.2;
      lb1 = 0.35; lb2 = 2.0;
      aa1 = -0.7; aa2 = 0.2;
      ab1 = -1.1; ab2 = -0.3;
      lean = 0.15;
      break;
    case 'fall': // arms up, legs trailing behind
      la1 = -0.8; la2 = -1.4;
      lb1 = -0.3; lb2 = -0.9;
      aa1 = -2.5; aa2 = -2.9;
      ab1 = 2.6; ab2 = 3.0;
      lean = 0.1;
      break;
    case 'slide': // low crouch, leaning back, feet forward
      crouch = 4;
      la1 = 1.15; la2 = 1.7;
      lb1 = 0.8; lb2 = 2.0;
      aa1 = -0.9; aa2 = -0.5;
      ab1 = -0.5; ab2 = 0;
      lean = -0.55;
      break;
    default: // idle: subtle breathing bob
      const b = Math.sin(t);
      bob = b * 0.8;
      la1 = 0.06; la2 = 0.1;
      lb1 = -0.07; lb2 = 0.05;
      aa1 = 0.1 + b * 0.04; aa2 = 0.35;
      ab1 = -0.06 + b * 0.04; ab2 = 0.4;
      lean = 0.02;
  }

  // Mirror the whole rig when facing the other way (+x becomes forward).
  const m = p.facing < 0 ? -1 : 1;
  lean *= m;
  la1 *= m; la2 *= m; lb1 *= m; lb2 *= m;
  aa1 *= m; aa2 *= m; ab1 *= m; ab2 *= m;

  const hx = 0, hy = -11 + crouch + bob;    // hip
  const nx = hx + Math.sin(lean) * 8;       // neck (torso length 8)
  const ny = hy - Math.cos(lean) * 8;
  const hdx = nx + Math.sin(lean) * 4;      // head center
  const hdy = ny - Math.cos(lean) * 4;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;

  ctx.strokeStyle = INK_FAR; // far-side limbs
  ctx.beginPath();
  limb(ctx, hx, hy, lb1, lb2, 5.5, 5.5);
  limb(ctx, nx, ny, ab1, ab2, 4.5, 4.5);
  ctx.stroke();

  ctx.strokeStyle = INK; // near-side limbs
  ctx.beginPath();
  limb(ctx, hx, hy, la1, la2, 5.5, 5.5);
  limb(ctx, nx, ny, aa1, aa2, 4.5, 4.5);
  ctx.stroke();

  ctx.beginPath(); // torso
  ctx.moveTo(hx, hy);
  ctx.lineTo(nx, ny);
  ctx.stroke();

  ctx.fillStyle = INK; // head
  ctx.beginPath();
  ctx.arc(hdx, hdy, 3.2, 0, Math.PI * 2);
  ctx.fill();
}
