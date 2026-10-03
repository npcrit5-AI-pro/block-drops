import { vanillaItems } from "./vanilla";

export type DropKind = "block" | "gear";

export type DropItem = {
  id: string;
  name: string;
  group: string;
  color: string;
  kind: DropKind;
  blurb: string;
};

const DYE = [
  ["white", "#e8e6e1"],
  ["light gray", "#9a9a93"],
  ["gray", "#4d4d4d"],
  ["black", "#1c1c1c"],
  ["brown", "#7a4a28"],
  ["red", "#b02a2a"],
  ["orange", "#e07a2f"],
  ["yellow", "#e6c84a"],
  ["lime", "#70b83a"],
  ["green", "#3d7a32"],
  ["cyan", "#158a8a"],
  ["light blue", "#6eb6e0"],
  ["blue", "#2f4fa0"],
  ["purple", "#6b3a9a"],
  ["magenta", "#b84a9a"],
  ["pink", "#e08aaa"],
] as const;

function dyeSet(prefix: string, group: string, kind: DropKind, blurb: string): DropItem[] {
  return DYE.map(([name, color]) => ({
    id: `${prefix}_${name.replace(" ", "_")}`,
    name: `${cap(name)} ${prefix.replaceAll("_", " ")}`,
    group,
    color,
    kind,
    blurb,
  }));
}

function cap(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

const SPEARS = ["wooden", "stone", "copper", "iron", "gold", "diamond", "netherite"] as const;
const SPEAR_COLORS: Record<(typeof SPEARS)[number], string> = {
  wooden: "#a0743a",
  stone: "#8d8d8d",
  copper: "#c46a3a",
  iron: "#d8d8d8",
  gold: "#f0c84a",
  diamond: "#4fd0c4",
  netherite: "#3a3038",
};

const NAUT = ["copper", "iron", "gold", "diamond", "netherite"] as const;

export const TERRAIN = {
  grass: "#5d9a3c",
  dirt: "#8a5a32",
  stone: "#7d7d7d",
  log: "#6b4a2a",
  leaves: "#3f7a34",
} as const;

export const BASE_DROPS: DropItem[] = [
  ...SPEARS.map((m) => ({
    id: `${m}_spear`,
    name: `${cap(m)} Spear`,
    group: "Weapons",
    color: SPEAR_COLORS[m],
    kind: "gear" as const,
    blurb: "Thrust weapon. Reach is longer than a sword. Copper, iron, and gold spears smelt into nuggets.",
  })),
  ...NAUT.map((m) => ({
    id: `${m}_nautilus_armor`,
    name: `${cap(m)} Nautilus Armor`,
    group: "Mounts",
    color: SPEAR_COLORS[m],
    kind: "gear" as const,
    blurb: "Fits a nautilus. Found in underwater chests, except netherite which is smithied.",
  })),
  {
    id: "netherite_horse_armor",
    name: "Netherite Horse Armor",
    group: "Mounts",
    color: "#3a3038",
    kind: "gear",
    blurb: "Smith a diamond horse armor with a netherite upgrade.",
  },
  {
    id: "wolf_armor",
    name: "Wolf Armor",
    group: "Mounts",
    color: "#c4a06a",
    kind: "gear",
    blurb: "Crafted from armadillo scutes. Dyeable. Protects a tamed wolf.",
  },
  {
    id: "armadillo_scute",
    name: "Armadillo Scute",
    group: "Mounts",
    color: "#c9a36a",
    kind: "gear",
    blurb: "Dropped when an armadillo curls. Used for wolf armor.",
  },
  ...dyeSet("harness", "Mounts", "gear", "Leather, glass, and wool. Equip it to ride a happy ghast."),
  {
    id: "dried_ghast",
    name: "Dried Ghast",
    group: "Mounts",
    color: "#c8b7a2",
    kind: "block",
    blurb: "Soul sand and ghast tears, or a nether fossil. Waterlog it and it grows into a ghastling.",
  },
  {
    id: "bundle",
    name: "Bundle",
    group: "Storage",
    color: "#c4a574",
    kind: "gear",
    blurb: "String and leather. Holds a mixed stack of up to 64 items in one slot.",
  },
  ...dyeSet("bundle", "Storage", "gear", "A dyed bundle. Same capacity, different color."),
  {
    id: "copper_chest",
    name: "Copper Chest",
    group: "Copper",
    color: "#c46a3a",
    kind: "block",
    blurb: "Chest wrapped in copper ingots. Oxidizes. Copper golems sort into it.",
  },
  {
    id: "exposed_copper_chest",
    name: "Exposed Copper Chest",
    group: "Copper",
    color: "#a87858",
    kind: "block",
    blurb: "First oxidation stage.",
  },
  {
    id: "weathered_copper_chest",
    name: "Weathered Copper Chest",
    group: "Copper",
    color: "#6a8a62",
    kind: "block",
    blurb: "Second oxidation stage.",
  },
  {
    id: "oxidized_copper_chest",
    name: "Oxidized Copper Chest",
    group: "Copper",
    color: "#4f7a62",
    kind: "block",
    blurb: "Fully oxidized. Wax it to freeze the color.",
  },
  {
    id: "copper_golem_statue",
    name: "Copper Golem Statue",
    group: "Copper",
    color: "#b8734a",
    kind: "block",
    blurb: "What is left when a copper golem oxidizes. Scrape it with an axe to wake it.",
  },
  {
    id: "shelf",
    name: "Shelf",
    group: "Storage",
    color: "#c4a06a",
    kind: "block",
    blurb: "Six stripped logs. Displays three item stacks.",
  },
  {
    id: "poplar_log",
    name: "Poplar Log",
    group: "Poplar",
    color: "#d9c7a6",
    kind: "block",
    blurb: "Pale wood from the dappled forest.",
  },
  {
    id: "poplar_planks",
    name: "Poplar Planks",
    group: "Poplar",
    color: "#e6d3b1",
    kind: "block",
    blurb: "Full poplar set: stairs, slabs, doors, fences, boats, signs.",
  },
  {
    id: "poplar_leaves_red",
    name: "Red Poplar Leaves",
    group: "Poplar",
    color: "#c45a3a",
    kind: "block",
    blurb: "One of three poplar leaf colors.",
  },
  {
    id: "poplar_leaves_orange",
    name: "Orange Poplar Leaves",
    group: "Poplar",
    color: "#e08a3a",
    kind: "block",
    blurb: "Autumn poplar canopy.",
  },
  {
    id: "poplar_leaves_yellow",
    name: "Yellow Poplar Leaves",
    group: "Poplar",
    color: "#e6c24a",
    kind: "block",
    blurb: "Bright poplar canopy.",
  },
  {
    id: "poplar_sapling",
    name: "Poplar Sapling",
    group: "Poplar",
    color: "#8fbf6a",
    kind: "block",
    blurb: "Grows a poplar tree.",
  },
  {
    id: "straw_bed",
    name: "Straw Bed",
    group: "Soft blocks",
    color: "#d8b85a",
    kind: "block",
    blurb: "A bed made of straw. Found in abandoned camps.",
  },
  ...dyeSet("cushion", "Soft blocks", "block", "Three matching wool slabs. A low seat."),
  ...dyeSet("wool_stair", "Soft blocks", "block", "Stairs cut from wool."),
  ...dyeSet("wool_slab", "Soft blocks", "block", "Slabs cut from wool. Three make a cushion."),
  ...dyeSet("concrete_stair", "Soft blocks", "block", "Stairs cut from concrete."),
  ...dyeSet("concrete_slab", "Soft blocks", "block", "Slabs cut from concrete."),
  {
    id: "sulfur_block",
    name: "Sulfur Block",
    group: "Sulfur caves",
    color: "#e6d24a",
    kind: "block",
    blurb: "Storage block from sulfur caves.",
  },
  {
    id: "sulfur_bricks",
    name: "Sulfur Bricks",
    group: "Sulfur caves",
    color: "#cbb83a",
    kind: "block",
    blurb: "Brick form of sulfur.",
  },
  {
    id: "potent_sulfur",
    name: "Potent Sulfur",
    group: "Sulfur caves",
    color: "#f0e070",
    kind: "block",
    blurb: "A charged sulfur block.",
  },
  {
    id: "sulfur_spike",
    name: "Sulfur Spike",
    group: "Sulfur caves",
    color: "#efe27a",
    kind: "block",
    blurb: "Pointed sulfur. Hurts if you land on it.",
  },
  {
    id: "cinnabar_block",
    name: "Cinnabar Block",
    group: "Sulfur caves",
    color: "#c43a3a",
    kind: "block",
    blurb: "Red ore block from the same caves.",
  },
  {
    id: "cinnabar_bricks",
    name: "Cinnabar Bricks",
    group: "Sulfur caves",
    color: "#a83232",
    kind: "block",
    blurb: "Brick form of cinnabar.",
  },
  {
    id: "golden_dandelion",
    name: "Golden Dandelion",
    group: "Plants",
    color: "#f0d24a",
    kind: "block",
    blurb: "A dandelion and eight gold nuggets. Feeding it pauses a baby's growth.",
  },
  {
    id: "shelf_mushroom",
    name: "Shelf Mushroom",
    group: "Plants",
    color: "#c47a3a",
    kind: "block",
    blurb: "Grows on the side of logs in dappled forests.",
  },
  {
    id: "red_shrub",
    name: "Red Shrub",
    group: "Plants",
    color: "#b84a3a",
    kind: "block",
    blurb: "Ground cover in the dappled forest.",
  },
  {
    id: "disc_tears",
    name: "Music Disc — Tears",
    group: "Music",
    color: "#6eb6e0",
    kind: "gear",
    blurb: "Kill a ghast with its own deflected fireball.",
  },
  {
    id: "disc_lava_chicken",
    name: "Music Disc — Lava Chicken",
    group: "Music",
    color: "#e07a2f",
    kind: "gear",
    blurb: "Dropped by a chicken jockey.",
  },
  {
    id: "disc_bounce",
    name: "Music Disc — Bounce",
    group: "Music",
    color: "#70b83a",
    kind: "gear",
    blurb: "From the sulfur-cave drop.",
  },
  {
    id: "pattern_field_masoned",
    name: "Field Masoned Banner Pattern",
    group: "Patterns",
    color: "#c45a3a",
    kind: "gear",
    blurb: "Paper and bricks.",
  },
  {
    id: "pattern_bordure_indented",
    name: "Bordure Indented Banner Pattern",
    group: "Patterns",
    color: "#3d7a32",
    kind: "gear",
    blurb: "Paper and vines.",
  },
  {
    id: "camp_map",
    name: "Abandoned Camp Map",
    group: "Maps",
    color: "#e6d3b1",
    kind: "gear",
    blurb: "Explorer map that points at an abandoned camp.",
  },
];

const taken = new Set(BASE_DROPS.map((d) => d.id));
export const DROPS: DropItem[] = [...BASE_DROPS, ...vanillaItems().filter((d) => !taken.has(d.id))];

export const GROUPS = [...new Set(DROPS.map((d) => d.group))];

export function itemById(id: string) {
  return DROPS.find((d) => d.id === id);
}
