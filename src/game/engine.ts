import { DROPS, TERRAIN, type DropItem } from "./catalog";

export const SX = 192;
export const SY = 20;
export const SZ = 192;
/** Blocks drawn around the player. The first map was 48 across. */
export const VIEW = 48;

export type Dimension = "overworld" | "nether" | "end";

export type Gate = {
  dim: Dimension;
  x: number;
  z: number;
  to: Dimension;
  sx: number;
  sy: number;
  sz: number;
};

const PLACEABLE = DROPS.filter((d) => d.kind === "block");

/** Not a catalog block. Rendered as a translucent surface. */
export const WATER = 65534;

/** 0 air, 1 grass, 2 dirt, 3 stone, 4+ placeable drop index */
export function blockColor(id: number): [number, number, number] {
  const hex =
    id === 1
      ? TERRAIN.grass
      : id === 2
        ? TERRAIN.dirt
        : id === 3
          ? TERRAIN.stone
          : id >= 4
            ? PLACEABLE[id - 4]?.color ?? "#888"
            : "#000";
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function placeableIndex(item: DropItem): number {
  return PLACEABLE.findIndex((d) => d.id === item.id);
}

export class VoxelWorld {
  layers: Record<Dimension, Uint16Array> = {
    overworld: new Uint16Array(SX * SY * SZ),
    nether: new Uint16Array(SX * SY * SZ),
    end: new Uint16Array(SX * SY * SZ),
  };
  blocks: Uint16Array;
  dimension: Dimension = "overworld";
  gates: Gate[] = [];
  entrance = { x: SX / 2, y: 12, z: SZ / 2 };
  readonly sky: Record<Dimension, number> = {
    overworld: 0x8ec5e8,
    nether: 0x4a1512,
    end: 0x160c22,
  };

  constructor() {
    this.blocks = this.layers.overworld;
    for (let x = 0; x < SX; x++) {
      for (let z = 0; z < SZ; z++) {
        const h =
          6 +
          Math.floor(
            Math.sin(x * 0.35) * 1.2 +
              Math.cos(z * 0.28) * 1.1 +
              Math.sin((x + z) * 0.15) * 0.6,
          );
        for (let y = 0; y <= h && y < SY; y++) {
          const id = y === h ? 1 : y > h - 3 ? 2 : 3;
          this.set(x, y, id, z);
        }
      }
    }
    this.entrance = stampCamp(this, 16, 10, {
      wall: "wool_stair_green",
      roof: "wool_stair_brown",
      floor: "wool_slab_brown",
      cushion: "cushion_red",
    });
    stampCamp(this, 30, 30, {
      wall: "wool_stair_orange",
      roof: "wool_stair_yellow",
      floor: "wool_slab_orange",
      cushion: "cushion_brown",
    });
    stampGrove(this);
    stampSulfurCave(this);
    const sea = stampPond(this);
    stampRiver(this, sea);
    stampOcean(this, sea);
    stampLake(this, 18, 40, 48, 66);
    stampVillage(this);
    stampWildGrove(this);
    stampRuins(this);
    stampCaveMouth(this);
    stampIceCave(this);
    stampTrial(this);
    const netherGate = stampGate(this, 12, 8, "wool_stair_black");
    const endGate = stampGate(this, 12, 26, "wool_stair_purple");

    this.blocks = this.layers.nether;
    fillNether(this);
    const netherBack = stampGate(this, 22, 16, "wool_stair_black", 9);

    this.blocks = this.layers.end;
    fillEnd(this);
    const endBack = stampGate(this, 24, 32, "wool_stair_purple");

    this.blocks = this.layers.overworld;
    this.dimension = "overworld";
    settleTerrain(this);
    this.gates = [
      { dim: "overworld", x: netherGate.x, z: netherGate.z, to: "nether", sx: 24.5, sy: netherBack.y, sz: 21.5 },
      { dim: "nether", x: netherBack.x, z: netherBack.z, to: "overworld", sx: netherGate.x, sy: netherGate.y, sz: netherGate.z + 3 },
      { dim: "overworld", x: endGate.x, z: endGate.z, to: "end", sx: 24.5, sy: endBack.y, sz: 28.5 },
      { dim: "end", x: endBack.x, z: endBack.z, to: "overworld", sx: endGate.x, sy: endGate.y, sz: endGate.z + 3 },
    ];
  }

  use(dim: Dimension) {
    this.dimension = dim;
    this.blocks = this.layers[dim]!;
  }

  idx(x: number, y: number, z: number) {
    return x + y * SX + z * SX * SY;
  }

  in(x: number, y: number, z: number) {
    return x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
  }

  get(x: number, y: number, z: number) {
    if (!this.in(x, y, z)) return 1;
    return this.blocks[this.idx(x, y, z)] ?? 0;
  }

  set(x: number, y: number, id: number, z: number) {
    if (!this.in(x, y, z)) return;
    this.blocks[this.idx(x, y, z)] = id;
  }

  solid(id: number) {
    return id !== 0 && id !== WATER;
  }

  /** Face-culled cube mesh, limited to a square around the player. */
  buildMesh(cx = SX / 2, cz = SZ / 2, radius = VIEW) {
    const pos: number[] = [];
    const nor: number[] = [];
    const col: number[] = [];
    const wpos: number[] = [];
    const wnor: number[] = [];
    const wcol: number[] = [];
    const uv: number[] = [];
    const wuv: number[] = [];
    const faces: [number, number, number, number, number, number][] = [
      [1, 0, 0, 0, 0, 1],
      [-1, 0, 0, 0, 0, -1],
      [0, 1, 0, 0, 1, 0],
      [0, -1, 0, 0, -1, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, -1, -1, 0, 0],
    ];
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(SX - 1, Math.ceil(cx + radius));
    const minZ = Math.max(0, Math.floor(cz - radius));
    const maxZ = Math.min(SZ - 1, Math.ceil(cz + radius));
    for (let z = minZ; z <= maxZ; z++) {
      for (let y = 0; y < SY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const id = this.get(x, y, z);
          if (!id) continue;
          if (id === WATER) {
            for (const [nx, ny, nz] of faces) {
              if (ny < 0) continue;
              const nid = this.get(x + nx, y + ny, z + nz);
              if (nid === WATER || this.solid(nid)) continue;
              pushFace(wpos, wnor, wcol, wuv, x, y, z, nx, ny, nz, 0.12, 0.42, 0.86, 1);
            }
            continue;
          }
          const [r, g, b] = blockColor(id);
          for (const [nx, ny, nz] of faces) {
            if (this.solid(this.get(x + nx, y + ny, z + nz))) continue;
            pushFace(pos, nor, col, uv, x, y, z, nx, ny, nz, r, g, b);
          }
        }
      }
    }
    return {
      pos: new Float32Array(pos),
      nor: new Float32Array(nor),
      col: new Float32Array(col),
      wpos: new Float32Array(wpos),
      wnor: new Float32Array(wnor),
      wcol: new Float32Array(wcol),
      uv: new Float32Array(uv),
      wuv: new Float32Array(wuv),
    };
  }
}

function bid(dropId: string) {
  const i = PLACEABLE.findIndex((d) => d.id === dropId);
  return i < 0 ? 3 : i + 4;
}

export function blockId(dropId: string) {
  return bid(dropId);
}

function terrainTop(world: VoxelWorld, x: number, z: number) {
  for (let y = SY - 1; y >= 0; y--) {
    const id = world.get(x, y, z);
    if (id === 1 || id === 2 || id === 3) return y;
  }
  return -1;
}

function columnTop(world: VoxelWorld, x: number, z: number) {
  for (let y = SY - 1; y >= 0; y--) if (world.get(x, y, z)) return y;
  return 0;
}

/** Wool tent camp: the only newer generated structure this version was missing. */
function settleTerrain(world: VoxelWorld) {
  const dims: Dimension[] = ["overworld", "nether", "end"];
  for (const dim of dims) {
    world.use(dim);
    let changed = true;
    while (changed) {
      changed = false;
      for (let z = 0; z < SZ; z++) {
        for (let x = 0; x < SX; x++) {
          for (let y = 1; y < SY; y++) {
            const id = world.get(x, y, z);
            if ((id === 1 || id === 2 || id === 3) && world.get(x, y - 1, z) === 0) {
              world.set(x, y, 0, z);
              changed = true;
            }
          }
        }
      }
    }
  }
  world.use("overworld");
}

function stampCamp(
  world: VoxelWorld,
  ox: number,
  oz: number,
  theme: { wall: string; roof: string; floor: string; cushion: string },
) {
  const W = 9;
  const D = 11;
  let floor = 0;
  for (let dz = 0; dz < D; dz++) {
    for (let dx = 0; dx < W; dx++) floor = Math.max(floor, columnTop(world, ox + dx, oz + dz));
  }
  const wall = bid(theme.wall);
  const roof = bid(theme.roof);
  const fl = bid(theme.floor);
  const log = bid("poplar_log");
  const bed = bid("straw_bed");
  const chest = bid("copper_chest");
  const secret = bid("oxidized_copper_chest");
  const statue = bid("copper_golem_statue");
  const cushion = bid(theme.cushion);
  const shelf = bid("shelf");

  for (let dz = 0; dz < D; dz++) {
    for (let dx = 0; dx < W; dx++) {
      for (let y = 0; y < floor; y++) {
        if (!world.get(ox + dx, y, oz + dz)) world.set(ox + dx, y, 2, oz + dz);
      }
      const yard = dz >= 7;
      world.set(ox + dx, floor, yard ? 1 : fl, oz + dz);
      for (let y = floor + 1; y < SY; y++) world.set(ox + dx, y, 0, oz + dz);
    }
  }

  const posts: [number, number][] = [
    [1, 1],
    [7, 1],
    [1, 6],
    [7, 6],
  ];
  for (const [dx, dz] of posts) {
    world.set(ox + dx, floor + 1, log, oz + dz);
    world.set(ox + dx, floor + 2, log, oz + dz);
  }
  for (let dx = 2; dx <= 6; dx++) {
    world.set(ox + dx, floor + 1, wall, oz + 1);
    world.set(ox + dx, floor + 2, wall, oz + 1);
  }
  for (let dz = 2; dz <= 5; dz++) {
    world.set(ox + 1, floor + 1, wall, oz + dz);
    world.set(ox + 1, floor + 2, wall, oz + dz);
    world.set(ox + 7, floor + 1, wall, oz + dz);
    world.set(ox + 7, floor + 2, wall, oz + dz);
  }
  for (let dz = 1; dz <= 6; dz++) {
    for (let dx = 2; dx <= 6; dx++) world.set(ox + dx, floor + 3, roof, oz + dz);
    for (let dx = 3; dx <= 5; dx++) world.set(ox + dx, floor + 4, roof, oz + dz);
    world.set(ox + 4, floor + 5, roof, oz + dz);
  }

  world.set(ox + 3, floor + 1, bed, oz + 3);
  world.set(ox + 5, floor + 1, cushion, oz + 3);
  world.set(ox + 2, floor + 1, chest, oz + 2);
  world.set(ox + 6, floor + 1, shelf, oz + 2);
  world.set(ox + 6, floor + 1, secret, oz + 5);
  world.set(ox + 8, floor + 1, statue, oz + 7);
  world.set(ox + 8, floor + 2, statue, oz + 7);
  world.set(ox + 2, floor + 1, log, oz + 8);
  world.set(ox + 2, floor + 2, bid("shelf_mushroom"), oz + 8);

  return { x: ox + 4.5, y: floor + 1, z: oz + 9.5 };
}

function stampGrove(world: VoxelWorld) {
  const log = bid("poplar_log");
  const leaves = [bid("poplar_leaves_red"), bid("poplar_leaves_orange"), bid("poplar_leaves_yellow")];
  const shrub = bid("red_shrub");
  const mushroom = bid("shelf_mushroom");
  const flower = bid("golden_dandelion");
  const spots: [number, number][] = [
    [41, 5],
    [45, 10],
    [41, 15],
    [46, 19],
  ];
  const trunks = new Set(spots.map(([x, z]) => `${x},${z}`));
  for (const [x, z] of spots) {
    const top = terrainTop(world, x, z);
    if (top < 0) continue;
    for (let y = top + 1; y <= top + 3 && y < SY; y++) world.set(x, y, log, z);
    const leaf = leaves[(x + z) % 3]!;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const lx = x + dx;
        const lz = z + dz;
        if (dx === 0 && dz === 0) {
          if (top + 4 < SY) world.set(x, top + 4, leaf, z);
          continue;
        }
        if (!world.in(lx, top + 3, lz)) continue;
        if (world.get(lx, top + 3, lz) === 0) world.set(lx, top + 3, leaf, lz);
      }
    }
    const mx = x + 2;
    const mt = terrainTop(world, mx, z);
    if (mt >= 0 && world.get(mx, mt + 1, z) === 0) world.set(mx, mt + 1, mushroom, z);
  }
  for (let x = 40; x < 47; x++) {
    for (let z = 4; z < 22; z++) {
      if (trunks.has(`${x},${z}`)) continue;
      const top = terrainTop(world, x, z);
      if (top < 0 || world.get(x, top + 1, z) !== 0) continue;
      if ((x * 3 + z) % 9 === 0) world.set(x, top + 1, shrub, z);
      else if ((x + z * 2) % 13 === 0) world.set(x, top + 1, flower, z);
    }
  }
}

function stampSulfurCave(world: VoxelWorld) {
  const sulfur = bid("sulfur_block");
  const bricks = bid("sulfur_bricks");
  const potent = bid("potent_sulfur");
  const spike = bid("sulfur_spike");
  const cinnabar = bid("cinnabar_block");
  for (let x = 2; x <= 8; x++) {
    for (let z = 22; z <= 36; z++) {
      for (let y = 1; y <= 4; y++) {
        const edge = x === 2 || x === 8 || z === 22 || z === 36 || y === 1;
        world.set(x, y, edge ? (y === 1 ? cinnabar : sulfur) : 0, z);
      }
      if ((x + z) % 4 === 0) world.set(x, 2, spike, z);
      if ((x + z) % 6 === 0) world.set(x, 3, potent, z);
      if ((x * z) % 5 === 0) world.set(x, 1, bricks, z);
    }
  }
  world.set(5, 5, 0, 29);
  world.set(5, 6, 0, 29);
  world.set(5, 7, 0, 29);
}

function dryColumn(x: number, z: number) {
  if (x >= 16 && x <= 26 && z >= 10 && z <= 22) return true;
  if (x >= 30 && x <= 40 && z >= 30 && z <= 42) return true;
  if (x >= 12 && x <= 16 && z >= 7 && z <= 9) return true;
  if (x >= 12 && x <= 16 && z >= 25 && z <= 27) return true;
  if (x >= 2 && x <= 12 && z >= 12 && z <= 20) return true;
  if (x >= 2 && x <= 9 && z >= 22 && z <= 36) return true;
  if (x >= 2 && x <= 13 && z >= 36 && z <= 46) return true;
  if (x >= 50 && x <= 76 && z >= 18 && z <= 32) return true;
  if (x >= 68 && x <= 76 && z >= 60 && z <= 70) return true;
  if (x >= 46 && x <= 55 && z >= 76 && z <= 86) return true;
  return false;
}

function fillChannel(world: VoxelWorld, x: number, z: number, line: number) {
  if (!world.in(x, line, z) || dryColumn(x, z)) return;
  const t = terrainTop(world, x, z);
  for (let y = line + 1; y <= t; y++) {
    const id = world.get(x, y, z);
    if (id === 1 || id === 2 || id === 3) world.set(x, y, 0, z);
  }
  const floor = Math.max(1, line - 2);
  if (world.get(x, floor, z) === 0) world.set(x, floor, 2, z);
  for (let y = floor + 1; y <= line; y++) {
    const id = world.get(x, y, z);
    if (id === 0 || id === 1 || id === 2 || id === 3) world.set(x, y, WATER, z);
  }
}

function stampRiver(world: VoxelWorld, line: number) {
  for (let z = 1; z <= 8; z++) {
    fillChannel(world, 7, z, line);
    fillChannel(world, 8, z, line);
  }
  for (let x = 9; x < SX - 24; x++) {
    for (let z = 1; z <= 3; z++) fillChannel(world, x, z, line);
  }
}

function stampLake(world: VoxelWorld, x0: number, x1: number, z0: number, z1: number) {
  const tops: number[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const t = terrainTop(world, x, z);
      if (t > 1) tops.push(t);
    }
  }
  tops.sort((a, b) => a - b);
  const line = tops[Math.floor(tops.length / 2)] ?? 6;
  for (let x = x0 + 1; x < x1; x++) {
    for (let z = z0 + 1; z < z1; z++) {
      if (dryColumn(x, z)) continue;
      const floor = Math.max(1, line - 4);
      if (!world.solid(world.get(x, floor, z))) world.set(x, floor, 2, z);
      for (let y = floor + 1; y <= line; y++) world.set(x, y, WATER, z);
      for (let y = line + 1; y < SY; y++) {
        const id = world.get(x, y, z);
        if (id === 1 || id === 2 || id === 3) world.set(x, y, 0, z);
      }
    }
  }
}

function stampOcean(world: VoxelWorld, line: number) {
  const sand = bid("sand");
  const oceanStart = SX - 28;
  for (let x = oceanStart; x < SX; x++) {
    for (let z = 0; z < SZ; z++) {
      if (dryColumn(x, z)) continue;
      const beach = x < oceanStart + 4;
      for (let y = line + 1; y < SY; y++) {
        const id = world.get(x, y, z);
        if (id === 1 || id === 2 || id === 3) world.set(x, y, 0, z);
      }
      if (beach) {
        for (let y = Math.max(1, line - 2); y < line; y++) world.set(x, y, sand, z);
        world.set(x, line, x >= oceanStart + 3 ? WATER : sand, z);
      } else {
        const floor = Math.max(1, line - 4);
        world.set(x, floor, sand, z);
        for (let y = floor + 1; y <= line; y++) world.set(x, y, WATER, z);
      }
    }
  }
}

function stampVillage(world: VoxelWorld) {
  stampCamp(world, 50, 18, {
    wall: "wool_stair_white",
    roof: "wool_stair_brown",
    floor: "wool_slab_brown",
    cushion: "cushion_red",
  });
  stampCamp(world, 66, 18, {
    wall: "wool_stair_red",
    roof: "wool_stair_orange",
    floor: "wool_slab_orange",
    cushion: "cushion_brown",
  });
  const brick = bid("stone_bricks");
  const wx = 62;
  const wz = 31;
  const top = terrainTop(world, wx, wz);
  const y0 = Math.max(2, top);
  for (let dx = 0; dx <= 2; dx++) {
    for (let dz = 0; dz <= 2; dz++) {
      const edge = dx === 0 || dz === 0 || dx === 2 || dz === 2;
      world.set(wx + dx, y0, edge ? brick : WATER, wz + dz);
      if (!edge) {
        world.set(wx + dx, y0 - 1, WATER, wz + dz);
        world.set(wx + dx, y0 + 1, 0, wz + dz);
      }
    }
  }
}

function stampWildGrove(world: VoxelWorld) {
  const log = bid("poplar_log");
  const leaves = [bid("poplar_leaves_red"), bid("poplar_leaves_orange"), bid("poplar_leaves_yellow")];
  const spots: [number, number][] = [
    [54, 58],
    [62, 66],
    [52, 74],
    [68, 72],
  ];
  for (const [x, z] of spots) {
    const top = terrainTop(world, x, z);
    if (top < 0) continue;
    for (let y = top + 1; y <= top + 3 && y < SY; y++) world.set(x, y, log, z);
    const leaf = leaves[(x + z) % 3]!;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) {
          if (top + 4 < SY) world.set(x, top + 4, leaf, z);
          continue;
        }
        const lx = x + dx;
        const lz = z + dz;
        if (world.in(lx, top + 3, lz) && world.get(lx, top + 3, lz) === 0) world.set(lx, top + 3, leaf, lz);
      }
    }
  }
}

function stampRuins(world: VoxelWorld) {
  const ob = bid("obsidian");
  const cry = bid("crying_obsidian");
  const x = 70;
  const z = 62;
  const top = Math.max(1, terrainTop(world, x, z));
  for (let dx = 0; dx <= 4; dx++) {
    for (let dz = 0; dz <= 1; dz++) world.set(x + dx, top, dz === 0 ? ob : cry, z + dz);
  }
  for (let dy = 1; dy <= 4; dy++) {
    world.set(x, top + dy, dy === 2 ? cry : ob, z);
    if (dy < 4) world.set(x + 4, top + dy, ob, z);
  }
  world.set(x + 1, top + 4, ob, z);
  world.set(x + 2, top + 4, cry, z);
}

function stampCaveMouth(world: VoxelWorld) {
  const cobble = bid("cobblestone");
  for (let x = 46; x <= 54; x++) {
    for (let z = 76; z <= 84; z++) {
      for (let y = 1; y <= 4; y++) {
        const edge = x === 46 || x === 54 || z === 76 || z === 84 || y === 1;
        world.set(x, y, edge ? (y === 1 ? 3 : cobble) : 0, z);
      }
    }
  }
  for (let y = 2; y < SY; y++) {
    world.set(49, y, 0, 80);
    world.set(50, y, 0, 80);
  }
  const lip = columnTop(world, 48, 80);
  world.set(48, lip, cobble, 80);
  world.set(51, lip, cobble, 80);
}

function stampPond(world: VoxelWorld) {
  const x0 = 3;
  const x1 = 11;
  const z0 = 3;
  const z1 = 10;
  const tops: number[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const t = terrainTop(world, x, z);
      if (t > 1) tops.push(t);
    }
  }
  tops.sort((a, b) => a - b);
  const line = tops[Math.floor(tops.length / 2)] ?? 6;
  for (let x = x0 + 1; x < x1; x++) {
    for (let z = z0 + 1; z < z1; z++) {
      const floor = Math.max(1, line - 3);
      if (!world.solid(world.get(x, floor, z))) world.set(x, floor, 2, z);
      for (let y = floor + 1; y <= line; y++) world.set(x, y, WATER, z);
      for (let y = line + 1; y < SY; y++) {
        const id = world.get(x, y, z);
        if (id === 1 || id === 2 || id === 3) world.set(x, y, 0, z);
      }
    }
  }
  return line;
}

function stampIceCave(world: VoxelWorld) {
  const ice = bid("wool_stair_white");
  const packed = bid("wool_stair_light_blue");
  const crystal = bid("wool_stair_cyan");
  for (let x = 2; x <= 12; x++) {
    for (let z = 38; z <= 46; z++) {
      for (let y = 1; y <= 4; y++) {
        const edge = x === 2 || x === 12 || z === 38 || z === 46 || y === 1;
        world.set(x, y, edge ? (y === 1 ? packed : ice) : 0, z);
      }
      if ((x + z) % 3 === 0) world.set(x, 2, crystal, z);
    }
  }
  for (let y = 2; y < SY; y++) {
    world.set(6, y, 0, 42);
    world.set(7, y, 0, 42);
  }
  const lip = columnTop(world, 5, 42);
  world.set(5, lip, ice, 42);
  world.set(8, lip, ice, 42);
}

function stampTrial(world: VoxelWorld) {
  const tuff = bid("wool_stair_gray");
  const copper = bid("wool_stair_orange");
  for (let x = 2; x <= 11; x++) {
    for (let z = 12; z <= 19; z++) {
      for (let y = 1; y <= 4; y++) {
        const edge = x === 2 || x === 11 || z === 12 || z === 19 || y === 1;
        world.set(x, y, edge ? (y === 1 ? tuff : copper) : 0, z);
      }
    }
  }
  for (let y = 2; y < SY; y++) {
    world.set(4, y, 0, 15);
    world.set(5, y, 0, 15);
  }
}

function stampGate(world: VoxelWorld, x: number, z: number, frame: string, maxY = SY - 1) {
  let top = 0;
  for (let y = 0; y <= maxY; y++) if (world.get(x, y, z)) top = y;
  const f = bid(frame);
  for (let dx = 0; dx <= 3; dx++) {
    for (let dy = 1; dy <= 4; dy++) world.set(x + dx, top + dy, 0, z);
  }
  for (let dy = 1; dy <= 4; dy++) {
    world.set(x, top + dy, f, z);
    world.set(x + 3, top + dy, f, z);
  }
  for (let dx = 0; dx <= 3; dx++) world.set(x + dx, top + 4, f, z);
  return { x: x + 1.5, y: top + 1, z: z + 0.5 };
}

function fillNether(world: VoxelWorld) {
  const nether = bid("wool_stair_red");
  const dark = bid("wool_stair_black");
  const lava = bid("wool_stair_orange");
  for (let x = 0; x < SX; x++) {
    for (let z = 0; z < SZ; z++) {
      const h = 4 + Math.floor(Math.sin(x * 0.4) + Math.cos(z * 0.33));
      for (let y = 0; y <= h && y < SY; y++) world.set(x, y, y === h ? nether : dark, z);
      if (h < 11) world.set(x, 11, dark, z);
      if ((x + z) % 9 === 0) world.set(x, h, lava, z);
    }
  }
}

function fillEnd(world: VoxelWorld) {
  const stone = bid("wool_stair_purple");
  const chorus = bid("wool_stair_magenta");
  const fruit = bid("wool_stair_yellow");
  for (let x = 0; x < SX; x++) {
    for (let z = 0; z < SZ; z++) {
      const dx = x - 24;
      const dz = z - 24;
      if (dx * dx + dz * dz > 420) continue;
      world.set(x, 6, stone, z);
      if ((x + z) % 8 === 0) {
        world.set(x, 7, chorus, z);
        world.set(x, 8, chorus, z);
        world.set(x, 9, fruit, z);
      }
    }
  }
  for (const [px, pz] of [
    [18, 18],
    [30, 18],
    [18, 30],
    [30, 30],
  ] as const) {
    for (let y = 7; y <= 12; y++) world.set(px, y, stone, pz);
    world.set(px, 13, fruit, pz);
  }
}

function pushFace(
  pos: number[],
  nor: number[],
  col: number[],
  uv: number[],
  x: number,
  y: number,
  z: number,
  nx: number,
  ny: number,
  nz: number,
  r: number,
  g: number,
  b: number,
  height = 1,
) {
  const shade = nx !== 0 ? 0.78 : nz !== 0 ? 0.88 : ny > 0 ? 1 : 0.62;
  const cr = r * shade;
  const cg = g * shade;
  const cb = b * shade;
  let corners: [number, number, number][];
  if (nx === 1)
    corners = [
      [x + 1, y, z],
      [x + 1, y + height, z],
      [x + 1, y + height, z + 1],
      [x + 1, y, z + 1],
    ];
  else if (nx === -1)
    corners = [
      [x, y, z + 1],
      [x, y + height, z + 1],
      [x, y + height, z],
      [x, y, z],
    ];
  else if (ny === 1)
    corners = [
      [x, y + height, z + 1],
      [x + 1, y + height, z + 1],
      [x + 1, y + height, z],
      [x, y + height, z],
    ];
  else if (ny === -1)
    corners = [
      [x, y, z],
      [x + 1, y, z],
      [x + 1, y, z + 1],
      [x, y, z + 1],
    ];
  else if (nz === 1)
    corners = [
      [x + 1, y, z + 1],
      [x + 1, y + height, z + 1],
      [x, y + height, z + 1],
      [x, y, z + 1],
    ];
  else
    corners = [
      [x, y, z],
      [x, y + height, z],
      [x + 1, y + height, z],
      [x + 1, y, z],
    ];
  const [a, c, d, e] = [corners[0]!, corners[1]!, corners[2]!, corners[3]!];
  for (const v of [a, c, d, a, d, e]) {
    pos.push(v[0], v[1], v[2]);
    nor.push(nx, ny, nz);
    col.push(cr, cg, cb);
  }
  uv.push(0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0);
}

export type Hit = { x: number; y: number; z: number; nx: number; ny: number; nz: number };

/** Grid DDA. Returns the solid cell and the face normal that was entered. */
export function raycast(
  world: VoxelWorld,
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist = 6,
): Hit | null {
  let x = Math.floor(ox);
  let y = Math.floor(oy);
  let z = Math.floor(oz);
  const stepX = dx >= 0 ? 1 : -1;
  const stepY = dy >= 0 ? 1 : -1;
  const stepZ = dz >= 0 ? 1 : -1;
  const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
  const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
  const tDeltaZ = dz === 0 ? Infinity : Math.abs(1 / dz);
  let tMaxX = dx === 0 ? Infinity : (dx > 0 ? x + 1 - ox : ox - x) * tDeltaX;
  let tMaxY = dy === 0 ? Infinity : (dy > 0 ? y + 1 - oy : oy - y) * tDeltaY;
  let tMaxZ = dz === 0 ? Infinity : (dz > 0 ? z + 1 - oz : oz - z) * tDeltaZ;
  let dist = 0;
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < 64 && dist <= maxDist; i++) {
    if (world.solid(world.get(x, y, z))) return { x, y, z, nx, ny, nz };
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX;
      dist = tMaxX;
      tMaxX += tDeltaX;
      nx = -stepX;
      ny = 0;
      nz = 0;
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      dist = tMaxY;
      tMaxY += tDeltaY;
      nx = 0;
      ny = -stepY;
      nz = 0;
    } else {
      z += stepZ;
      dist = tMaxZ;
      tMaxZ += tDeltaZ;
      nx = 0;
      ny = 0;
      nz = -stepZ;
    }
  }
  return null;
}

export type Player = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  onGround: boolean;
};

export function spawnPlayer(): Player {
  return { x: SX / 2, y: 14, z: SZ / 2, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, onGround: false };
}

const HW = 0.3;
const HH = 1.7;

export function inWater(world: VoxelWorld, x: number, y: number, z: number) {
  return world.get(Math.floor(x), Math.floor(y), Math.floor(z)) === WATER;
}

export function waterSurface(world: VoxelWorld, x: number, z: number) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  for (let y = SY - 1; y >= 0; y--) {
    if (world.get(ix, y, iz) === WATER) return y + 0.92;
  }
  return -1;
}

function blocked(world: VoxelWorld, x: number, y: number, z: number) {
  const minX = Math.floor(x - HW);
  const maxX = Math.floor(x + HW);
  const minY = Math.floor(y);
  const maxY = Math.floor(y + HH);
  const minZ = Math.floor(z - HW);
  const maxZ = Math.floor(z + HW);
  for (let iz = minZ; iz <= maxZ; iz++) {
    for (let iy = minY; iy <= maxY; iy++) {
      for (let ix = minX; ix <= maxX; ix++) {
        if (world.solid(world.get(ix, iy, iz))) return true;
      }
    }
  }
  return false;
}

/** FPS basis: yaw 0 faces −Z. A strafes −right. */
export function integrate(
  world: VoxelWorld,
  p: Player,
  keys: Set<string>,
  dt: number,
) {
  dt = Math.min(dt, 0.05);
  const forwardX = -Math.sin(p.yaw);
  const forwardZ = -Math.cos(p.yaw);
  const rightX = Math.cos(p.yaw);
  const rightZ = -Math.sin(p.yaw);
  let mx = 0;
  let mz = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) {
    mx += forwardX;
    mz += forwardZ;
  }
  if (keys.has("KeyS") || keys.has("ArrowDown")) {
    mx -= forwardX;
    mz -= forwardZ;
  }
  if (keys.has("KeyD") || keys.has("ArrowRight")) {
    mx += rightX;
    mz += rightZ;
  }
  if (keys.has("KeyA") || keys.has("ArrowLeft")) {
    mx -= rightX;
    mz -= rightZ;
  }
  const len = Math.hypot(mx, mz);
  const swimming = inWater(world, p.x, p.y + 0.05, p.z) || inWater(world, p.x, p.y + 0.9, p.z);
  const speed = swimming ? 2.8 : keys.has("ShiftLeft") || keys.has("ShiftRight") ? 3.1 : 5.4;
  if (len > 0) {
    mx = (mx / len) * speed;
    mz = (mz / len) * speed;
  }
  p.vx = mx;
  p.vz = mz;
  if (swimming) {
    const sneak = keys.has("ShiftLeft") || keys.has("ShiftRight");
    if (sneak) p.vy = -2.4;
    else if (keys.has("Space")) p.vy = 3.4;
    else if (len > 0) {
      p.vy = lookDir(p).y * 3.2;
    } else {
      const surface = waterSurface(world, p.x, p.z);
      const target = surface - 1.45;
      p.vy = Math.max(-1.4, Math.min(2.4, (target - p.y) * 4));
    }
  } else {
    p.vy -= 22 * dt;
    if (keys.has("Space") && p.onGround) {
      p.vy = 8.2;
      p.onGround = false;
    }
  }

  const nx = p.x + p.vx * dt;
  if (!blocked(world, nx, p.y, p.z)) p.x = nx;
  else p.vx = 0;

  const ny = p.y + p.vy * dt;
  if (!blocked(world, p.x, ny, p.z)) {
    p.y = ny;
    p.onGround = false;
  } else {
    if (p.vy < 0) p.onGround = true;
    p.vy = 0;
  }

  const nz = p.z + p.vz * dt;
  if (!blocked(world, p.x, p.y, nz)) p.z = nz;
  else p.vz = 0;

  if (p.y < 1) {
    const gate = world.gates.find((g) => g.to === world.dimension);
    p.x = gate ? gate.sx : world.entrance.x;
    p.y = gate ? gate.sy : world.entrance.y;
    p.z = gate ? gate.sz : world.entrance.z;
    p.vy = 0;
  }
}

export function lookDir(p: Player) {
  const cp = Math.cos(p.pitch);
  return {
    x: -Math.sin(p.yaw) * cp,
    y: Math.sin(p.pitch),
    z: -Math.cos(p.yaw) * cp,
  };
}

export function campHint(yaw: number, px: number, pz: number, tx: number, tz: number) {
  const dx = tx - px;
  const dz = tz - pz;
  if (Math.hypot(dx, dz) < 2) return "here";
  const lookA = Math.atan2(-Math.sin(yaw), -Math.cos(yaw));
  let diff = Math.atan2(dx, dz) - lookA;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) < 0.45) return "ahead";
  if (Math.abs(diff) > 2.2) return "behind you";
  return diff > 0 ? "to your left" : "to your right";
}

export function horizontalSpeed(p: Player) {
  return Math.hypot(p.vx, p.vz);
}
