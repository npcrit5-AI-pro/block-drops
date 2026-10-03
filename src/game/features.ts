import { SY, WATER, blockId, type Dimension, type VoxelWorld } from "./engine";

export type ActorKind = "golem" | "ghast" | "armadillo" | "nautilus" | "breeze" | "dragon";

export type Actor = {
  kind: ActorKind;
  x: number;
  y: number;
  z: number;
  homeX: number;
  homeZ: number;
  t: number;
  dim: Dimension;
  hp: number;
};

export const PLAN = [
  { name: "Abandoned camps", state: "In", detail: "Wool tents, straw beds, copper chests, golem statues." },
  { name: "Dappled grove", state: "In", detail: "Poplar trees, red shrubs, shelf mushrooms, golden dandelions. East edge." },
  { name: "Sulfur cave", state: "In", detail: "Open shaft west of the pond. Spikes, cinnabar, potent sulfur." },
  { name: "Ice cave", state: "In", detail: "South edge. White and cyan ice, a shaft down, crystals on the floor." },
  { name: "Trial combat", state: "In", detail: "Pit beside the pond. Spear the breeze. Wind knocks you back. A chest opens when it falls." },
  { name: "Nether", state: "In", detail: "Black portal west of the camp. Red cavern, lava, and a portal home." },
  { name: "End", state: "In", detail: "Purple portal south of the nether one. Island, chorus, and a dragon you can fight." },
  { name: "Copper golem", state: "In", detail: "Walks to the nearest copper chest. Right-click a statue to wake another." },
  { name: "Copper chest oxidation", state: "In", detail: "Chests near you age from copper to oxidized." },
  { name: "Happy ghast", state: "In", detail: "Floats nearby. Hold a harness and press F to ride. Right-click a dried ghast to grow one." },
  { name: "Nautilus", state: "In", detail: "Swims the light-blue pond. Nautilus armor is equipped from the pack." },
  { name: "Armadillo", state: "In", detail: "Wanders, then curls when you get close. Scutes craft wolf armor." },
  { name: "Bundle", state: "In", detail: "Right-click with a bundle to stash the looked-at block. Press B to empty it." },
  { name: "Spear reach", state: "In", detail: "Spears hit from farther away than other tools, and hit harder in a fight." },
  { name: "Shelf", state: "In", detail: "Right-click a shelf to display whatever is in your hand." },
  { name: "Ocean and river", state: "In", detail: "The pond drains north, then east into an ocean with a sand beach. You can swim the whole way." },
  { name: "Village", state: "In", detail: "Two wool houses and a stone well on the new land east of camp." },
  { name: "Ruined portal", state: "In", detail: "A broken obsidian frame south of the village. It does not light." },
  { name: "Cave mouth", state: "In", detail: "A cobble shaft on the south of the new land, separate from the ice cave." },
  { name: "Music discs", state: "In", detail: "Right-click with Tears, Lava Chicken, or Bounce to play it." },
];

export function seedActors(): Actor[] {
  return [
    { kind: "golem", x: 23, y: 9, z: 18, homeX: 23, homeZ: 18, t: 0, dim: "overworld", hp: 1 },
    { kind: "ghast", x: 12, y: 12, z: 16, homeX: 12, homeZ: 16, t: 1, dim: "overworld", hp: 1 },
    { kind: "armadillo", x: 27, y: 9, z: 24, homeX: 27, homeZ: 24, t: 0, dim: "overworld", hp: 1 },
    { kind: "nautilus", x: 8.5, y: 8, z: 8.5, homeX: 8.5, homeZ: 8.5, t: 0, dim: "overworld", hp: 1 },
    { kind: "breeze", x: 7, y: 2.2, z: 15.5, homeX: 7, homeZ: 15.5, t: 0, dim: "overworld", hp: 6 },
    { kind: "dragon", x: 24, y: 11, z: 24, homeX: 24, homeZ: 24, t: 0, dim: "end", hp: 10 },
  ];
}

function standY(world: VoxelWorld, x: number, z: number) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const roof = world.dimension === "nether" ? 9 : 18;
  for (let y = roof; y >= 0; y--) {
    const id = world.get(ix, y, iz);
    if (id && id !== WATER) return y + 1;
  }
  return 8;
}

type Body = { x: number; y: number; z: number; vx: number; vy: number; vz: number };

export function tickActors(world: VoxelWorld, actors: Actor[], player: Body, dt: number) {
  const chests = new Set([
    blockId("copper_chest"),
    blockId("exposed_copper_chest"),
    blockId("weathered_copper_chest"),
    blockId("oxidized_copper_chest"),
  ]);
  for (const a of actors) {
    if (a.hp <= 0 || a.dim !== world.dimension) continue;
    a.t += dt;
    if (a.kind === "golem") {
      let best = 99;
      let tx = a.homeX;
      let tz = a.homeZ;
      const ax = Math.floor(a.x);
      const az = Math.floor(a.z);
      for (let x = ax - 7; x <= ax + 7; x++) {
        for (let z = az - 7; z <= az + 7; z++) {
          for (let y = 4; y <= 14; y++) {
            if (!chests.has(world.get(x, y, z))) continue;
            const d = Math.hypot(x + 0.5 - a.x, z + 0.5 - a.z);
            if (d < best) {
              best = d;
              tx = x + 0.5;
              tz = z + 0.5;
            }
          }
        }
      }
      const dx = tx - a.x;
      const dz = tz - a.z;
      const len = Math.hypot(dx, dz) || 1;
      if (best > 1.1) {
        a.x += (dx / len) * 1.6 * dt;
        a.z += (dz / len) * 1.6 * dt;
      }
      a.y = standY(world, a.x, a.z);
    } else if (a.kind === "ghast") {
      a.x = a.homeX + Math.sin(a.t * 0.35) * 3;
      a.z = a.homeZ + Math.cos(a.t * 0.28) * 2.2;
      a.y = 12 + Math.sin(a.t * 1.3) * 0.35;
    } else if (a.kind === "armadillo") {
      const near = Math.hypot(player.x - a.x, player.z - a.z) < 2.8;
      if (!near) {
        a.x = a.homeX + Math.sin(a.t * 0.7) * 2;
        a.z = a.homeZ + Math.cos(a.t * 0.55) * 1.4;
      }
      a.y = standY(world, a.x, a.z);
    } else if (a.kind === "breeze") {
      a.x = a.homeX + Math.sin(a.t * 1.4) * 1.2;
      a.z = a.homeZ + Math.cos(a.t * 1.1) * 1.2;
      a.y = 2.4 + Math.sin(a.t * 3) * 0.25;
      const dist = Math.hypot(player.x - a.x, player.z - a.z);
      if (dist < 7 && Math.floor(a.t / 1.8) !== Math.floor((a.t - dt) / 1.8)) {
        player.vx += (player.x - a.x) * 1.4;
        player.vz += (player.z - a.z) * 1.4;
        if (player.vy < 2) player.vy = 2;
      }
    } else if (a.kind === "dragon") {
      a.x = a.homeX + Math.cos(a.t * 0.45) * 7;
      a.z = a.homeZ + Math.sin(a.t * 0.45) * 7;
      a.y = 10 + Math.sin(a.t * 0.8) * 1.2;
      const dist = Math.hypot(player.x - a.x, player.z - a.z);
      if (dist < 5 && Math.floor(a.t / 2.2) !== Math.floor((a.t - dt) / 2.2)) {
        player.vx += (player.x - a.x) * 1.1;
        player.vz += (player.z - a.z) * 1.1;
        if (player.vy < 2.4) player.vy = 2.4;
      }
    } else {
      a.x = a.homeX + Math.cos(a.t * 0.7) * 1.5;
      a.z = a.homeZ + Math.sin(a.t * 0.7) * 1.5;
      const ix = Math.floor(a.x);
      const iz = Math.floor(a.z);
      let y = standY(world, a.x, a.z);
      for (let sy = SY - 1; sy >= 0; sy--) {
        if (world.get(ix, sy, iz) === WATER) {
          y = sy + 0.35;
          break;
        }
      }
      a.y = y;
    }
  }
}

export function foeInSight(
  world: VoxelWorld,
  actors: Actor[],
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  reach: number,
) {
  let best: Actor | null = null;
  let bestD = reach;
  for (const a of actors) {
    if (a.hp <= 0 || a.dim !== world.dimension) continue;
    if (a.kind !== "breeze" && a.kind !== "dragon") continue;
    const vx = a.x - ox;
    const vy = a.y + 0.4 - oy;
    const vz = a.z - oz;
    const dist = Math.hypot(vx, vy, vz);
    if (dist < 0.2 || dist > bestD) continue;
    const dot = (vx * dx + vy * dy + vz * dz) / dist;
    if (dot > 0.82) {
      best = a;
      bestD = dist;
    }
  }
  return best;
}

export function oxidizeNearby(world: VoxelWorld, px: number, pz: number) {
  const order = [
    blockId("copper_chest"),
    blockId("exposed_copper_chest"),
    blockId("weathered_copper_chest"),
    blockId("oxidized_copper_chest"),
  ];
  const ax = Math.floor(px);
  const az = Math.floor(pz);
  for (let x = ax - 10; x <= ax + 10; x++) {
    for (let z = az - 10; z <= az + 10; z++) {
      for (let y = 4; y <= 14; y++) {
        const id = world.get(x, y, z);
        const step = order.indexOf(id);
        if (step >= 0 && step < 3) {
          world.set(x, y, order[step + 1]!, z);
          return true;
        }
      }
    }
  }
  return false;
}
