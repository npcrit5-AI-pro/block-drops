export type VanillaItem = {
  id: string;
  name: string;
  group: string;
  color: string;
  kind: "block" | "gear";
  blurb: string;
};

const DYE: [string, string][] = [
  ["white", "#e8e6e1"],
  ["light_gray", "#9a9a93"],
  ["gray", "#4d4d4d"],
  ["black", "#1c1c1c"],
  ["brown", "#7a4a28"],
  ["red", "#b02a2a"],
  ["orange", "#e07a2f"],
  ["yellow", "#e6c84a"],
  ["lime", "#70b83a"],
  ["green", "#3d7a32"],
  ["cyan", "#158a8a"],
  ["light_blue", "#6eb6e0"],
  ["blue", "#2f4fa0"],
  ["purple", "#6b3a9a"],
  ["magenta", "#b84a9a"],
  ["pink", "#e08aaa"],
];

function title(id: string) {
  return id.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.min(255, Math.max(0, (s * k) | 0));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function push(
  out: VanillaItem[],
  id: string,
  group: string,
  color: string,
  kind: "block" | "gear",
  blurb: string,
  name = title(id),
) {
  out.push({ id, name, group, color, kind, blurb });
}

export function vanillaItems(): VanillaItem[] {
  const out: VanillaItem[] = [];

  const woods: [string, string, "tree" | "nether" | "bamboo"][] = [
    ["oak", "#b8945f", "tree"],
    ["spruce", "#6b4f32", "tree"],
    ["birch", "#d7cb8d", "tree"],
    ["jungle", "#b8874a", "tree"],
    ["acacia", "#ba6337", "tree"],
    ["dark_oak", "#3f2a1a", "tree"],
    ["mangrove", "#6e3424", "tree"],
    ["cherry", "#e4b4b0", "tree"],
    ["pale_oak", "#e4ddd0", "tree"],
    ["bamboo", "#c8b45a", "bamboo"],
    ["crimson", "#8a3048", "nether"],
    ["warped", "#3a8a82", "nether"],
  ];
  const woodParts = [
    ["planks", "Planks", 1.12, "block"],
    ["stairs", "Stairs", 1.05, "block"],
    ["slab", "Slab", 0.94, "block"],
    ["fence", "Fence", 0.86, "block"],
    ["fence_gate", "Fence Gate", 0.9, "block"],
    ["door", "Door", 1, "block"],
    ["trapdoor", "Trapdoor", 0.88, "block"],
    ["button", "Button", 1.16, "block"],
    ["pressure_plate", "Pressure Plate", 0.98, "block"],
    ["sign", "Sign", 1.02, "block"],
    ["hanging_sign", "Hanging Sign", 0.92, "block"],
  ] as const;

  for (const [wood, color, style] of woods) {
    const label = title(wood);
    if (style === "nether") {
      push(out, `${wood}_stem`, "Building", color, "block", `${label} stem from the Nether.`);
      push(out, `${wood}_hyphae`, "Building", shade(color, 0.9), "block", `${label} hyphae.`);
      push(out, `stripped_${wood}_stem`, "Building", shade(color, 1.15), "block", `Stripped ${label.toLowerCase()} stem.`);
      push(out, `stripped_${wood}_hyphae`, "Building", shade(color, 1.05), "block", `Stripped ${label.toLowerCase()} hyphae.`);
      push(out, `${wood}_fungus`, "Nature", shade(color, 1.2), "block", `A ${label.toLowerCase()} fungus.`);
      push(out, `${wood}_roots`, "Nature", shade(color, 0.75), "block", `${label} roots.`);
    } else if (style === "bamboo") {
      push(out, "bamboo", "Nature", "#7a9a3a", "block", "A bamboo stalk.");
      push(out, "bamboo_block", "Building", color, "block", "A block of bamboo.");
      push(out, "stripped_bamboo_block", "Building", shade(color, 1.12), "block", "Stripped bamboo.");
      push(out, "bamboo_mosaic", "Building", shade(color, 1.08), "block", "Bamboo mosaic.");
      push(out, "bamboo_mosaic_stairs", "Building", shade(color, 1.02), "block", "Bamboo mosaic stairs.");
      push(out, "bamboo_mosaic_slab", "Building", shade(color, 0.96), "block", "Bamboo mosaic slab.");
      push(out, "bamboo_raft", "Transport", shade(color, 1.05), "gear", "A bamboo raft.");
      push(out, "bamboo_chest_raft", "Transport", shade(color, 0.92), "gear", "A bamboo raft with a chest.");
    } else {
      push(out, `${wood}_log`, "Building", color, "block", `${label} log.`);
      push(out, `${wood}_wood`, "Building", shade(color, 0.92), "block", `${label} wood, bark on all sides.`);
      push(out, `stripped_${wood}_log`, "Building", shade(color, 1.16), "block", `Stripped ${label.toLowerCase()} log.`);
      push(out, `stripped_${wood}_wood`, "Building", shade(color, 1.06), "block", `Stripped ${label.toLowerCase()} wood.`);
      push(out, `${wood}_sapling`, "Nature", "#6ea84a", "block", `Grows a ${label.toLowerCase()} tree.`);
      push(out, `${wood}_leaves`, "Nature", style === "tree" && wood === "cherry" ? "#e7a0b0" : "#3f7a34", "block", `${label} leaves.`);
      push(out, `${wood}_boat`, "Transport", shade(color, 1.04), "gear", `A ${label.toLowerCase()} boat.`);
      push(out, `${wood}_chest_boat`, "Transport", shade(color, 0.9), "gear", `A ${label.toLowerCase()} boat with a chest.`);
    }
    for (const [part, partName, k, kind] of woodParts) {
      push(out, `${wood}_${part}`, "Building", shade(color, k), kind, `${label} ${partName.toLowerCase()}.`, `${label} ${partName}`);
    }
  }
  push(out, "mangrove_roots", "Building", "#5a4030", "block", "Mangrove roots.");
  push(out, "muddy_mangrove_roots", "Building", "#4a4034", "block", "Muddy mangrove roots.");
  push(out, "nether_wart_block", "Nether", "#6e1018", "block", "A block of nether wart.");
  push(out, "warped_wart_block", "Nether", "#16867a", "block", "A block of warped wart.");
  push(out, "nether_sprouts", "Nature", "#149080", "block", "Small warped sprouts.");
  push(out, "pink_petals", "Nature", "#e7a0b4", "block", "Leaf litter of cherry petals.");

  const masonry: [string, string, string][] = [
    ["cobblestone", "Cobblestone", "#7a7a7a"],
    ["mossy_cobblestone", "Mossy Cobblestone", "#6a7a58"],
    ["stone", "Stone", "#7d7d7d"],
    ["smooth_stone", "Smooth Stone", "#9a9a9a"],
    ["stone_bricks", "Stone Bricks", "#7a7a7a"],
    ["mossy_stone_bricks", "Mossy Stone Bricks", "#6d7a58"],
    ["cracked_stone_bricks", "Cracked Stone Bricks", "#6e6e6e"],
    ["chiseled_stone_bricks", "Chiseled Stone Bricks", "#727272"],
    ["cobbled_deepslate", "Cobbled Deepslate", "#4a4e54"],
    ["polished_deepslate", "Polished Deepslate", "#484c52"],
    ["deepslate_bricks", "Deepslate Bricks", "#3e4248"],
    ["deepslate_tiles", "Deepslate Tiles", "#363a40"],
    ["tuff", "Tuff", "#6b6a62"],
    ["polished_tuff", "Polished Tuff", "#6e6c64"],
    ["tuff_bricks", "Tuff Bricks", "#646258"],
    ["bricks", "Bricks", "#8d4a3a"],
    ["mud_bricks", "Mud Bricks", "#8a6a48"],
    ["sandstone", "Sandstone", "#d8c48a"],
    ["red_sandstone", "Red Sandstone", "#b85a32"],
    ["prismarine", "Prismarine", "#5a9a8a"],
    ["dark_prismarine", "Dark Prismarine", "#2f5a4e"],
    ["nether_bricks", "Nether Bricks", "#2c1218"],
    ["red_nether_bricks", "Red Nether Bricks", "#6a1820"],
    ["end_stone_bricks", "End Stone Bricks", "#d8d6a0"],
    ["purpur_block", "Purpur Block", "#a45a8a"],
    ["quartz_block", "Block of Quartz", "#ece6dc"],
    ["andesite", "Andesite", "#8a8a8a"],
    ["diorite", "Diorite", "#d0d0d0"],
    ["granite", "Granite", "#9a6a5a"],
    ["blackstone", "Blackstone", "#2a2428"],
    ["polished_blackstone", "Polished Blackstone", "#322c30"],
    ["polished_blackstone_bricks", "Polished Blackstone Bricks", "#2e282c"],
    ["deepslate", "Deepslate", "#50545c"],
  ];
  for (const [id, name, color] of masonry) {
    push(out, id, "Building", color, "block", name + ".", name);
    if (!id.endsWith("_block") && id !== "smooth_stone" && id !== "chiseled_stone_bricks" && id !== "cracked_stone_bricks") {
      push(out, `${id}_stairs`, "Building", shade(color, 1.04), "block", `${name} stairs.`, `${name} Stairs`);
      push(out, `${id}_slab`, "Building", shade(color, 0.94), "block", `${name} slab.`, `${name} Slab`);
      if (id !== "stone" && id !== "deepslate") {
        push(out, `${id}_wall`, "Building", shade(color, 0.88), "block", `${name} wall.`, `${name} Wall`);
      }
    }
  }
  push(out, "smooth_stone_slab", "Building", "#8e8e8e", "block", "Smooth stone slab.");
  push(out, "cut_sandstone", "Building", "#d4c080", "block", "Cut sandstone.");
  push(out, "cut_red_sandstone", "Building", "#b05430", "block", "Cut red sandstone.");
  push(out, "chiseled_sandstone", "Building", "#c8b878", "block", "Chiseled sandstone.");
  push(out, "chiseled_red_sandstone", "Building", "#a84e2c", "block", "Chiseled red sandstone.");
  push(out, "smooth_sandstone", "Building", "#e0cc94", "block", "Smooth sandstone.");
  push(out, "smooth_red_sandstone", "Building", "#c06038", "block", "Smooth red sandstone.");
  push(out, "smooth_quartz", "Building", "#f4f0e8", "block", "Smooth quartz.");
  push(out, "chiseled_quartz_block", "Building", "#e4ddd2", "block", "Chiseled quartz.");
  push(out, "quartz_pillar", "Building", "#e8e2d8", "block", "Quartz pillar.");
  push(out, "purpur_pillar", "Building", "#b06898", "block", "Purpur pillar.");
  push(out, "purpur_stairs", "Building", "#a45a8a", "block", "Purpur stairs.");
  push(out, "purpur_slab", "Building", "#984880", "block", "Purpur slab.");

  const ox = ["", "exposed_", "weathered_", "oxidized_"] as const;
  const oxColor = ["#c46a3a", "#a87858", "#6a8a62", "#4f7a62"];
  const copperForms: [string, string][] = [
    ["copper_block", "Copper Block"],
    ["cut_copper", "Cut Copper"],
    ["cut_copper_stairs", "Cut Copper Stairs"],
    ["cut_copper_slab", "Cut Copper Slab"],
    ["chiseled_copper", "Chiseled Copper"],
    ["copper_grate", "Copper Grate"],
    ["copper_bulb", "Copper Bulb"],
    ["copper_door", "Copper Door"],
    ["copper_trapdoor", "Copper Trapdoor"],
    ["copper_bars", "Copper Bars"],
  ];
  ox.forEach((stage, i) => {
    for (const [id, name] of copperForms) {
      const real = id === "copper_block" && stage ? `${stage}copper` : `${stage}${id}`;
      const label = (stage ? title(stage) + " " : "") + name;
      push(out, real, "Building", oxColor[i]!, "block", label + ".");
      push(out, `waxed_${real}`, "Building", shade(oxColor[i]!, 0.92), "block", `Waxed ${label.toLowerCase()}. Won't oxidize.`, `Waxed ${label}`);
    }
  });

  for (const [dye, color] of DYE) {
    const label = title(dye);
    push(out, `${dye}_dye`, "Materials", color, "gear", `${label} dye.`);
    push(out, `${dye}_wool`, "Building", color, "block", `${label} wool.`);
    push(out, `${dye}_carpet`, "Building", shade(color, 0.92), "block", `${label} carpet.`);
    push(out, `${dye}_terracotta`, "Building", shade(color, 0.72), "block", `${label} terracotta.`);
    push(out, `${dye}_glazed_terracotta`, "Building", shade(color, 0.84), "block", `${label} glazed terracotta.`);
    push(out, `${dye}_concrete`, "Building", color, "block", `${label} concrete.`);
    push(out, `${dye}_concrete_powder`, "Building", shade(color, 1.12), "block", `${label} concrete powder.`);
    push(out, `${dye}_stained_glass`, "Building", shade(color, 1.05), "block", `${label} stained glass.`);
    push(out, `${dye}_stained_glass_pane`, "Building", shade(color, 1.08), "block", `${label} stained glass pane.`);
    push(out, `${dye}_bed`, "Soft blocks", shade(color, 0.95), "block", `${label} bed. Sets your spawn when you sleep.`);
    push(out, `${dye}_banner`, "Decor", color, "block", `${label} banner.`);
    push(out, `${dye}_candle`, "Decor", shade(color, 1.05), "block", `${label} candle.`);
    push(out, `${dye}_shulker_box`, "Storage", shade(color, 0.8), "block", `${label} shulker box. Keeps its contents.`);
  }
  push(out, "terracotta", "Building", "#9a5a42", "block", "Plain terracotta.");
  push(out, "glass", "Building", "#c5e4ea", "block", "Glass.");
  push(out, "glass_pane", "Building", "#d0eef2", "block", "A glass pane.");
  push(out, "tinted_glass", "Building", "#3a3a42", "block", "Tinted glass. Blocks light.");
  push(out, "shulker_box", "Storage", "#7a4a7a", "block", "A shulker box.");

  const ores: [string, string][] = [
    ["coal_ore", "#3a3a3a"],
    ["deepslate_coal_ore", "#2e3238"],
    ["iron_ore", "#c4a07a"],
    ["deepslate_iron_ore", "#8a7058"],
    ["copper_ore", "#c46a3a"],
    ["deepslate_copper_ore", "#8a4e32"],
    ["gold_ore", "#f0c84a"],
    ["deepslate_gold_ore", "#b09030"],
    ["redstone_ore", "#b02020"],
    ["deepslate_redstone_ore", "#7a1818"],
    ["emerald_ore", "#1ea84a"],
    ["deepslate_emerald_ore", "#147838"],
    ["lapis_ore", "#2f4fa0"],
    ["deepslate_lapis_ore", "#243878"],
    ["diamond_ore", "#4fd0c4"],
    ["deepslate_diamond_ore", "#2a8a82"],
    ["nether_gold_ore", "#c4a040"],
    ["nether_quartz_ore", "#e8d8cc"],
    ["ancient_debris", "#5a3828"],
  ];
  for (const [id, color] of ores) push(out, id, "Materials", color, "block", title(id) + ".");

  const metal: [string, string, string][] = [
    ["coal", "Coal", "#2a2a2a"],
    ["charcoal", "Charcoal", "#2e261e"],
    ["raw_iron", "Raw Iron", "#c4a88a"],
    ["iron_ingot", "Iron Ingot", "#d8d8d8"],
    ["iron_nugget", "Iron Nugget", "#c8c8c8"],
    ["iron_block", "Block of Iron", "#d0d0d0"],
    ["raw_copper", "Raw Copper", "#c46a3a"],
    ["copper_ingot", "Copper Ingot", "#e08a4a"],
    ["raw_gold", "Raw Gold", "#e6c24a"],
    ["gold_ingot", "Gold Ingot", "#f0c84a"],
    ["gold_nugget", "Gold Nugget", "#f4d46a"],
    ["gold_block", "Block of Gold", "#f0c040"],
    ["diamond", "Diamond", "#4fd0c4"],
    ["diamond_block", "Block of Diamond", "#5ae0d4"],
    ["emerald", "Emerald", "#1ea84a"],
    ["emerald_block", "Block of Emerald", "#17c050"],
    ["lapis_lazuli", "Lapis Lazuli", "#2f4fa0"],
    ["lapis_block", "Block of Lapis Lazuli", "#2a48a0"],
    ["redstone", "Redstone Dust", "#c02020"],
    ["redstone_block", "Block of Redstone", "#a01818"],
    ["netherite_scrap", "Netherite Scrap", "#4a3838"],
    ["netherite_ingot", "Netherite Ingot", "#3a3038"],
    ["netherite_block", "Block of Netherite", "#2e262c"],
    ["amethyst_shard", "Amethyst Shard", "#b07ad0"],
    ["quartz", "Nether Quartz", "#e8e0d8"],
    ["netherite_upgrade_smithing_template", "Netherite Upgrade", "#4a3838"],
    ["echo_shard", "Echo Shard", "#0e5a58"],
    ["breeze_rod", "Breeze Rod", "#b7e6f5"],
    ["wind_charge", "Wind Charge", "#d8f4f8"],
    ["heavy_core", "Heavy Core", "#6a6460"],
    ["trial_key", "Trial Key", "#e6c84a"],
    ["ominous_trial_key", "Ominous Trial Key", "#c46a3a"],
    ["ominous_bottle", "Ominous Bottle", "#6b3a9a"],
  ];
  for (const [id, name, color] of metal) {
    const kind = id.endsWith("_block") ? "block" : "gear";
    push(out, id, "Materials", color, kind, name + ".", name);
  }

  const toolMat: [string, string][] = [
    ["wooden", "#a0743a"],
    ["stone", "#8d8d8d"],
    ["copper", "#c46a3a"],
    ["iron", "#d8d8d8"],
    ["golden", "#f0c84a"],
    ["diamond", "#4fd0c4"],
    ["netherite", "#3a3038"],
  ];
  for (const [mat, color] of toolMat) {
    for (const tool of ["pickaxe", "axe", "shovel", "hoe"]) {
      push(out, `${mat}_${tool}`, "Tools", color, "gear", `${title(mat)} ${tool}.`);
    }
    push(out, `${mat}_sword`, "Weapons", shade(color, 0.9), "gear", `${title(mat)} sword.`);
  }
  const armorMat: [string, string][] = [
    ["leather", "#a06840"],
    ["copper", "#c46a3a"],
    ["chainmail", "#a8b0b4"],
    ["iron", "#d8d8d8"],
    ["golden", "#f0c84a"],
    ["diamond", "#4fd0c4"],
    ["netherite", "#3a3038"],
  ];
  for (const [mat, color] of armorMat) {
    for (const piece of ["helmet", "chestplate", "leggings", "boots"]) {
      push(out, `${mat}_${piece}`, "Armor", color, "gear", `${title(mat)} ${piece}.`);
    }
  }
  for (const [id, name, color] of [
    ["turtle_helmet", "Turtle Shell", "#3d7a32"],
    ["elytra", "Elytra", "#6a5a7a"],
    ["shield", "Shield", "#8a5a32"],
    ["bow", "Bow", "#a0743a"],
    ["crossbow", "Crossbow", "#6b4a2a"],
    ["trident", "Trident", "#3a9aaa"],
    ["mace", "Mace", "#8a8a92"],
    ["fishing_rod", "Fishing Rod", "#a0743a"],
    ["shears", "Shears", "#d0d0d0"],
    ["flint_and_steel", "Flint and Steel", "#6a6a6a"],
    ["brush", "Brush", "#c4a06a"],
    ["spyglass", "Spyglass", "#c4a06a"],
    ["clock", "Clock", "#f0c84a"],
    ["compass", "Compass", "#c04040"],
    ["recovery_compass", "Recovery Compass", "#3a3038"],
    ["goat_horn", "Goat Horn", "#e8d8c0"],
    ["totem_of_undying", "Totem of Undying", "#e6c84a"],
    ["carrot_on_a_stick", "Carrot on a Stick", "#e07a2f"],
    ["warped_fungus_on_a_stick", "Warped Fungus on a Stick", "#149080"],
    ["lead", "Lead", "#c4a06a"],
    ["name_tag", "Name Tag", "#e6d3b1"],
    ["saddle", "Saddle", "#8a4a2a"],
  ] as const) {
    const group = ["bow", "crossbow", "trident", "mace"].includes(id) ? "Weapons" : id === "elytra" || id.endsWith("helmet") ? "Armor" : "Tools";
    push(out, id, group, color, "gear", name + ".", name);
  }
  for (const mat of ["leather", "copper", "iron", "golden", "diamond"] as const) {
    const color = toolMat.find((m) => m[0] === mat)?.[1] ?? "#c4a06a";
    push(out, `${mat}_horse_armor`, "Mounts", color, "gear", `${title(mat)} horse armor.`);
  }

  const foods: [string, string, string][] = [
    ["apple", "Apple", "#c04040"],
    ["golden_apple", "Golden Apple", "#f0c84a"],
    ["enchanted_golden_apple", "Enchanted Golden Apple", "#e6d24a"],
    ["bread", "Bread", "#c4944a"],
    ["cookie", "Cookie", "#c48a4a"],
    ["cake", "Cake", "#f0e0e8"],
    ["pumpkin_pie", "Pumpkin Pie", "#e08a3a"],
    ["beef", "Raw Beef", "#a84848"],
    ["cooked_beef", "Steak", "#8a4030"],
    ["porkchop", "Raw Porkchop", "#e0a0a0"],
    ["cooked_porkchop", "Cooked Porkchop", "#c07050"],
    ["chicken", "Raw Chicken", "#e8c8b0"],
    ["cooked_chicken", "Cooked Chicken", "#d0a070"],
    ["mutton", "Raw Mutton", "#c06060"],
    ["cooked_mutton", "Cooked Mutton", "#8a4840"],
    ["rabbit", "Raw Rabbit", "#e0b0a0"],
    ["cooked_rabbit", "Cooked Rabbit", "#c08060"],
    ["cod", "Raw Cod", "#c8b89a"],
    ["cooked_cod", "Cooked Cod", "#d0a870"],
    ["salmon", "Raw Salmon", "#e07060"],
    ["cooked_salmon", "Cooked Salmon", "#c06048"],
    ["tropical_fish", "Tropical Fish", "#e07a2f"],
    ["pufferfish", "Pufferfish", "#e6c84a"],
    ["rotten_flesh", "Rotten Flesh", "#6a4030"],
    ["spider_eye", "Spider Eye", "#8a2028"],
    ["baked_potato", "Baked Potato", "#c4944a"],
    ["poisonous_potato", "Poisonous Potato", "#8aaa40"],
    ["carrot", "Carrot", "#e07a2f"],
    ["golden_carrot", "Golden Carrot", "#f0c84a"],
    ["potato", "Potato", "#c4a06a"],
    ["beetroot", "Beetroot", "#a02040"],
    ["beetroot_soup", "Beetroot Soup", "#8a1830"],
    ["mushroom_stew", "Mushroom Stew", "#8a4030"],
    ["rabbit_stew", "Rabbit Stew", "#a06040"],
    ["suspicious_stew", "Suspicious Stew", "#6a8a40"],
    ["honey_bottle", "Honey Bottle", "#e6b030"],
    ["dried_kelp", "Dried Kelp", "#2a5a30"],
    ["chorus_fruit", "Chorus Fruit", "#9a68a0"],
    ["sweet_berries", "Sweet Berries", "#c03040"],
    ["glow_berries", "Glow Berries", "#e6a040"],
    ["melon_slice", "Melon Slice", "#e05060"],
    ["glow_berries_pie", "Pumpkin Seeds", "#e6c84a"],
  ];
  for (const [id, name, color] of foods) {
    if (id === "glow_berries_pie") {
      push(out, "pumpkin_seeds", "Nature", color, "block", "Pumpkin seeds.", "Pumpkin Seeds");
      continue;
    }
    push(out, id, "Food", color, "gear", `${name}. Eat to fill hunger.`, name);
  }

  const nature: [string, string, string, "block" | "gear"][] = [
    ["wheat", "Wheat", "#d8c060", "gear"],
    ["wheat_seeds", "Wheat Seeds", "#8aaa40", "block"],
    ["beetroot_seeds", "Beetroot Seeds", "#8a3040", "block"],
    ["melon", "Melon", "#6a9a3a", "block"],
    ["pumpkin", "Pumpkin", "#e07a2f", "block"],
    ["carved_pumpkin", "Carved Pumpkin", "#d07028", "block"],
    ["jack_o_lantern", "Jack o'Lantern", "#e88820", "block"],
    ["torchflower", "Torchflower", "#e07a2f", "block"],
    ["torchflower_seeds", "Torchflower Seeds", "#c06020", "block"],
    ["pitcher_plant", "Pitcher Plant", "#3a6a8a", "block"],
    ["pitcher_pod", "Pitcher Pod", "#2a4a6a", "block"],
    ["cocoa_beans", "Cocoa Beans", "#6a3a20", "gear"],
    ["sugar_cane", "Sugar Cane", "#8fbf6a", "block"],
    ["cactus", "Cactus", "#2f7a32", "block"],
    ["bamboo", "Bamboo", "#7a9a3a", "block"],
    ["kelp", "Kelp", "#2a6a38", "block"],
    ["seagrass", "Seagrass", "#3a8a48", "block"],
    ["vine", "Vines", "#2f6a32", "block"],
    ["lily_pad", "Lily Pad", "#3a7a32", "block"],
    ["dead_bush", "Dead Bush", "#8a6840", "block"],
    ["short_grass", "Short Grass", "#5d9a3c", "block"],
    ["tall_grass", "Tall Grass", "#4e8a32", "block"],
    ["fern", "Fern", "#3d7a32", "block"],
    ["large_fern", "Large Fern", "#346c2c", "block"],
    ["dandelion", "Dandelion", "#f0d24a", "block"],
    ["poppy", "Poppy", "#c03030", "block"],
    ["blue_orchid", "Blue Orchid", "#4aa0d0", "block"],
    ["allium", "Allium", "#b07ad0", "block"],
    ["azure_bluet", "Azure Bluet", "#e8eef0", "block"],
    ["red_tulip", "Red Tulip", "#c04040", "block"],
    ["orange_tulip", "Orange Tulip", "#e07a2f", "block"],
    ["white_tulip", "White Tulip", "#f4f0e8", "block"],
    ["pink_tulip", "Pink Tulip", "#e08aaa", "block"],
    ["oxeye_daisy", "Oxeye Daisy", "#f4f0d8", "block"],
    ["cornflower", "Cornflower", "#4a6ad0", "block"],
    ["lily_of_the_valley", "Lily of the Valley", "#e8f0e0", "block"],
    ["sunflower", "Sunflower", "#f0c84a", "block"],
    ["lilac", "Lilac", "#c090d0", "block"],
    ["rose_bush", "Rose Bush", "#c04040", "block"],
    ["peony", "Peony", "#e8a0c0", "block"],
    ["wither_rose", "Wither Rose", "#2a2428", "block"],
    ["spore_blossom", "Spore Blossom", "#e07aaa", "block"],
    ["open_eyeblossom", "Open Eyeblossom", "#e8d0c8", "block"],
    ["closed_eyeblossom", "Closed Eyeblossom", "#c8b0a8", "block"],
    ["moss_block", "Moss Block", "#4a7a32", "block"],
    ["moss_carpet", "Moss Carpet", "#3e6a2a", "block"],
    ["azalea", "Azalea", "#5a8a48", "block"],
    ["flowering_azalea", "Flowering Azalea", "#d090b0", "block"],
    ["azalea_leaves", "Azalea Leaves", "#4a7a40", "block"],
    ["flowering_azalea_leaves", "Flowering Azalea Leaves", "#6a8a50", "block"],
    ["hay_block", "Hay Bale", "#d8b85a", "block"],
    ["bone_meal", "Bone Meal", "#e8e6e1", "gear"],
    ["bone", "Bone", "#e4e0d4", "gear"],
    ["string", "String", "#e8e6e1", "gear"],
    ["feather", "Feather", "#f4f0e8", "gear"],
    ["leather", "Leather", "#a06840", "gear"],
    ["rabbit_hide", "Rabbit Hide", "#c4a080", "gear"],
    ["ink_sac", "Ink Sac", "#1c1c1c", "gear"],
    ["glow_ink_sac", "Glow Ink Sac", "#6ec8c0", "gear"],
    ["gunpowder", "Gunpowder", "#6a6a6a", "gear"],
    ["flint", "Flint", "#4a4a4a", "gear"],
    ["slime_ball", "Slimeball", "#70b83a", "gear"],
    ["honeycomb", "Honeycomb", "#e6a020", "gear"],
  ];
  for (const [id, name, color, kind] of nature) {
    const group = kind === "gear" ? "Materials" : "Nature";
    push(out, id, group, color, kind, name + ".", name);
  }

  const ground: [string, string, string][] = [
    ["grass_block", "Grass Block", "#5d9a3c"],
    ["dirt", "Dirt", "#8a5a32"],
    ["coarse_dirt", "Coarse Dirt", "#6e4a2a"],
    ["rooted_dirt", "Rooted Dirt", "#7a5434"],
    ["podzol", "Podzol", "#5a4030"],
    ["mycelium", "Mycelium", "#6a6070"],
    ["dirt_path", "Dirt Path", "#8a6840"],
    ["farmland", "Farmland", "#6a4020"],
    ["mud", "Mud", "#3a322c"],
    ["packed_mud", "Packed Mud", "#6a5844"],
    ["clay", "Clay", "#9aa4b0"],
    ["gravel", "Gravel", "#7a7a78"],
    ["sand", "Sand", "#e0d0a0"],
    ["red_sand", "Red Sand", "#c06030"],
    ["stone", "Stone", "#7d7d7d"],
    ["bedrock", "Bedrock", "#3a3a3a"],
    ["obsidian", "Obsidian", "#1a1028"],
    ["ice", "Ice", "#a0d4e8"],
    ["packed_ice", "Packed Ice", "#8ec4e0"],
    ["blue_ice", "Blue Ice", "#6eb6e0"],
    ["snow_block", "Snow Block", "#f4f8fc"],
    ["snow", "Snow", "#eef4f8"],
    ["powder_snow", "Powder Snow", "#e4eef4"],
  ];
  for (const [id, name, color] of ground) push(out, id, "Building", color, "block", name + ".", name);

  const netherEnd: [string, string, string][] = [
    ["netherrack", "Netherrack", "#6a2018"],
    ["soul_sand", "Soul Sand", "#4a3828"],
    ["soul_soil", "Soul Soil", "#3a2c22"],
    ["basalt", "Basalt", "#4a4a4e"],
    ["polished_basalt", "Polished Basalt", "#545458"],
    ["smooth_basalt", "Smooth Basalt", "#48484c"],
    ["glowstone", "Glowstone", "#e6c070"],
    ["shroomlight", "Shroomlight", "#e08040"],
    ["magma_block", "Magma Block", "#c04010"],
    ["nether_wart", "Nether Wart", "#8a1018"],
    ["end_stone", "End Stone", "#d8d6a0"],
    ["chorus_plant", "Chorus Plant", "#6a3a6a"],
    ["chorus_flower", "Chorus Flower", "#9a68a0"],
    ["dragon_egg", "Dragon Egg", "#1a1218"],
    ["end_rod", "End Rod", "#e8e0c8"],
    ["dragon_head", "Dragon Head", "#2a2430"],
    ["gilded_blackstone", "Gilded Blackstone", "#4a3a20"],
    ["crying_obsidian", "Crying Obsidian", "#2a1048"],
  ];
  for (const [id, name, color] of netherEnd) push(out, id, "Nether", color, "block", name + ".", name);
  push(out, "end_crystal", "Nether", "#c8a0e0", "gear", "An end crystal.", "End Crystal");

  const redstone: [string, string, string, "block" | "gear"][] = [
    ["redstone_torch", "Redstone Torch", "#c02020", "block"],
    ["repeater", "Redstone Repeater", "#a02020", "block"],
    ["comparator", "Redstone Comparator", "#b03030", "block"],
    ["piston", "Piston", "#8a7a58", "block"],
    ["sticky_piston", "Sticky Piston", "#70b83a", "block"],
    ["observer", "Observer", "#6a6a6a", "block"],
    ["hopper", "Hopper", "#5a5a5a", "block"],
    ["dropper", "Dropper", "#6a6a6a", "block"],
    ["dispenser", "Dispenser", "#5e5e5e", "block"],
    ["lever", "Lever", "#8a6840", "block"],
    ["note_block", "Note Block", "#6b4a2a", "block"],
    ["daylight_detector", "Daylight Detector", "#b0a080", "block"],
    ["tripwire_hook", "Tripwire Hook", "#8a8a8a", "block"],
    ["tnt", "TNT", "#c04040", "block"],
    ["target", "Target", "#e8e0d0", "block"],
    ["lectern", "Lectern", "#8a5a32", "block"],
    ["crafter", "Crafter", "#6a6a72", "block"],
    ["sculk", "Sculk", "#0e2428", "block"],
    ["sculk_vein", "Sculk Vein", "#123038", "block"],
    ["sculk_catalyst", "Sculk Catalyst", "#0e3030", "block"],
    ["sculk_shrieker", "Sculk Shrieker", "#143038", "block"],
    ["sculk_sensor", "Sculk Sensor", "#146060", "block"],
    ["calibrated_sculk_sensor", "Calibrated Sculk Sensor", "#1a7070", "block"],
    ["slime_block", "Slime Block", "#70b83a", "block"],
    ["honey_block", "Honey Block", "#e6a020", "block"],
    ["lightning_rod", "Lightning Rod", "#c46a3a", "block"],
  ];
  for (const [id, name, color, kind] of redstone) push(out, id, "Redstone", color, kind, name + ".", name);

  const utility: [string, string, string, string][] = [
    ["crafting_table", "Crafting Table", "#8a5a32", "Building"],
    ["furnace", "Furnace", "#6a6a6a", "Building"],
    ["blast_furnace", "Blast Furnace", "#4a4a52", "Building"],
    ["smoker", "Smoker", "#5a4030", "Building"],
    ["chest", "Chest", "#a0743a", "Storage"],
    ["trapped_chest", "Trapped Chest", "#8a5a28", "Storage"],
    ["ender_chest", "Ender Chest", "#1a3a32", "Storage"],
    ["barrel", "Barrel", "#8a6840", "Storage"],
    ["anvil", "Anvil", "#6a6a6a", "Building"],
    ["chipped_anvil", "Chipped Anvil", "#5e5e5e", "Building"],
    ["damaged_anvil", "Damaged Anvil", "#525252", "Building"],
    ["enchanting_table", "Enchanting Table", "#6a2040", "Building"],
    ["bookshelf", "Bookshelf", "#8a5a32", "Building"],
    ["chiseled_bookshelf", "Chiseled Bookshelf", "#7a4e2c", "Building"],
    ["grindstone", "Grindstone", "#8a8a8a", "Building"],
    ["smithing_table", "Smithing Table", "#5a4038", "Building"],
    ["cartography_table", "Cartography Table", "#c4b090", "Building"],
    ["fletching_table", "Fletching Table", "#c4a070", "Building"],
    ["loom", "Loom", "#8a6848", "Building"],
    ["stonecutter", "Stonecutter", "#7a7a7a", "Building"],
    ["brewing_stand", "Brewing Stand", "#8a6840", "Brewing"],
    ["cauldron", "Cauldron", "#4a4a4a", "Brewing"],
    ["composter", "Composter", "#6a4a28", "Building"],
    ["beehive", "Beehive", "#c4a040", "Nature"],
    ["bee_nest", "Bee Nest", "#c4a060", "Nature"],
    ["lodestone", "Lodestone", "#6a6a72", "Building"],
    ["respawn_anchor", "Respawn Anchor", "#4a2048", "Nether"],
    ["end_portal_frame", "End Portal Frame", "#2a4a3a", "Nether"],
    ["conduit", "Conduit", "#4aa0b0", "Building"],
    ["beacon", "Beacon", "#7ad0e0", "Building"],
    ["jukebox", "Jukebox", "#6b4a2a", "Decor"],
    ["bell", "Bell", "#f0c84a", "Decor"],
    ["campfire", "Campfire", "#e07a2f", "Building"],
    ["soul_campfire", "Soul Campfire", "#4aa0c0", "Building"],
    ["lantern", "Lantern", "#c4a06a", "Building"],
    ["soul_lantern", "Soul Lantern", "#4aa0c0", "Building"],
    ["torch", "Torch", "#e6c070", "Building"],
    ["soul_torch", "Soul Torch", "#4aa0c0", "Building"],
    ["ladder", "Ladder", "#a0743a", "Building"],
    ["scaffolding", "Scaffolding", "#c4a85a", "Building"],
    ["chain", "Chain", "#6a6a72", "Building"],
    ["iron_bars", "Iron Bars", "#b0b0b0", "Building"],
    ["sea_lantern", "Sea Lantern", "#c8e8e0", "Building"],
    ["amethyst_block", "Block of Amethyst", "#9a5ab0", "Building"],
    ["budding_amethyst", "Budding Amethyst", "#8a4aa0", "Building"],
    ["amethyst_cluster", "Amethyst Cluster", "#c090d8", "Building"],
    ["calcite", "Calcite", "#e0dcd4", "Building"],
    ["dripstone_block", "Dripstone Block", "#8a6a52", "Building"],
    ["pointed_dripstone", "Pointed Dripstone", "#a08068", "Building"],
    ["sea_pickle", "Sea Pickle", "#6aaa40", "Nature"],
    ["sponge", "Sponge", "#c4b050", "Building"],
    ["wet_sponge", "Wet Sponge", "#a09030", "Building"],
  ];
  for (const [id, name, color, group] of utility) push(out, id, group, color, "block", name + ".", name);

  const transport: [string, string, string][] = [
    ["rail", "Rail", "#8a6840"],
    ["powered_rail", "Powered Rail", "#c46a3a"],
    ["detector_rail", "Detector Rail", "#a04040"],
    ["activator_rail", "Activator Rail", "#c04040"],
    ["minecart", "Minecart", "#8a8a8a"],
    ["chest_minecart", "Minecart with Chest", "#a0743a"],
    ["furnace_minecart", "Minecart with Furnace", "#6a6a6a"],
    ["hopper_minecart", "Minecart with Hopper", "#5a5a5a"],
    ["tnt_minecart", "Minecart with TNT", "#c04040"],
  ];
  for (const [id, name, color] of transport) {
    const kind = id.includes("rail") ? "block" : "gear";
    push(out, id, "Transport", color, kind, name + ".", name);
  }

  const buckets: [string, string, string][] = [
    ["bucket", "Bucket", "#8a8a8a"],
    ["water_bucket", "Water Bucket", "#2f6fbe"],
    ["lava_bucket", "Lava Bucket", "#e05010"],
    ["milk_bucket", "Milk Bucket", "#f4f4f4"],
    ["powder_snow_bucket", "Powder Snow Bucket", "#e4eef4"],
    ["axolotl_bucket", "Bucket of Axolotl", "#e090b0"],
    ["cod_bucket", "Bucket of Cod", "#c8b89a"],
    ["salmon_bucket", "Bucket of Salmon", "#e07060"],
    ["tropical_fish_bucket", "Bucket of Tropical Fish", "#e07a2f"],
    ["pufferfish_bucket", "Bucket of Pufferfish", "#e6c84a"],
    ["tadpole_bucket", "Bucket of Tadpole", "#6a8a40"],
  ];
  for (const [id, name, color] of buckets) push(out, id, "Tools", color, "gear", name + ".", name);

  const potions = [
    "water",
    "awkward",
    "mundane",
    "thick",
    "healing",
    "strong_healing",
    "harming",
    "regeneration",
    "swiftness",
    "strength",
    "poison",
    "night_vision",
    "invisibility",
    "fire_resistance",
    "slow_falling",
    "leaping",
    "water_breathing",
    "turtle_master",
    "slow_falling_long",
  ];
  const potionColor: Record<string, string> = {
    water: "#3a6ad0",
    healing: "#e04060",
    harming: "#6a2040",
    regeneration: "#d070a0",
    swiftness: "#c8d8f0",
    strength: "#c04040",
    poison: "#4a8a20",
    night_vision: "#2a3a8a",
    invisibility: "#8a90a0",
    fire_resistance: "#e07020",
    slow_falling: "#e8e0c0",
    leaping: "#70b83a",
    water_breathing: "#3a8aaa",
    turtle_master: "#3d7a32",
  };
  for (const p of potions) {
    const key = p.replace("strong_", "").replace("_long", "");
    push(out, `potion_${p}`, "Brewing", potionColor[key] ?? "#c46a8a", "gear", `Potion of ${title(p).toLowerCase()}.`, `Potion of ${title(p)}`);
    if (!p.startsWith("strong") && p !== "water" && p !== "awkward" && p !== "mundane" && p !== "thick" && !p.endsWith("_long")) {
      push(out, `splash_${p}`, "Brewing", shade(potionColor[key] ?? "#c46a8a", 0.85), "gear", `Splash potion of ${title(p).toLowerCase()}.`, `Splash Potion of ${title(p)}`);
      push(out, `lingering_${p}`, "Brewing", shade(potionColor[key] ?? "#c46a8a", 0.7), "gear", `Lingering potion of ${title(p).toLowerCase()}.`, `Lingering Potion of ${title(p)}`);
    }
  }
  for (const extra of ["blaze_rod", "blaze_powder", "ghast_tear", "magma_cream", "fermented_spider_eye", "glistering_melon_slice", "phantom_membrane", "rabbit_foot", "dragon_breath", "glass_bottle", "nether_wart"] as const) {
    push(out, extra === "nether_wart" ? "nether_wart_item" : extra, "Brewing", "#c46a3a", "gear", title(extra) + ".", extra === "nether_wart" ? "Nether Wart" : title(extra));
  }

  const discs = ["13", "cat", "blocks", "chirp", "far", "mall", "mellohi", "stal", "strad", "ward", "11", "wait", "otherside", "5", "pigstep", "relic", "precipice", "creator", "creator_music_box"];
  discs.forEach((d, i) => {
    push(out, `music_disc_${d}`, "Music", shade("#6eb6e0", 0.7 + (i % 5) * 0.08), "gear", `Music disc ${title(d)}.`, `Music Disc ${title(d)}`);
  });

  const trims = ["coast", "dune", "eye", "host", "raiser", "rib", "sentry", "shaper", "silence", "snout", "spire", "tide", "vex", "ward", "wayfinder", "bolt", "flow", "wild"];
  for (const t of trims) {
    push(out, `${t}_armor_trim_smithing_template`, "Decor", "#c4a06a", "gear", `${title(t)} armor trim.`, `${title(t)} Armor Trim`);
  }
  const sherds = ["angler", "archer", "arms_up", "blade", "brewer", "burn", "danger", "explorer", "friend", "heart", "heartbreak", "howl", "miner", "mourner", "plenty", "prize", "sheaf", "shelter", "skull", "snort", "flow", "guster", "scrape"];
  for (const s of sherds) push(out, `${s}_pottery_sherd`, "Decor", "#c47a4a", "gear", `${title(s)} pottery sherd.`, `${title(s)} Pottery Sherd`);

  const patterns = ["creeper", "skull", "flower", "mojang", "thing", "globe", "piglin", "flow", "guster"];
  for (const p of patterns) push(out, `${p}_banner_pattern`, "Patterns", "#c45a3a", "gear", `${title(p)} banner pattern.`, `${title(p)} Banner Pattern`);

  const mobs = [
    "allay", "armadillo", "axolotl", "bat", "bee", "blaze", "bogged", "breeze", "camel", "cat", "cave_spider", "chicken", "cod", "cow", "creeper", "dolphin", "donkey", "drowned", "elder_guardian", "ender_dragon", "enderman", "endermite", "evoker", "fox", "frog", "ghast", "glow_squid", "goat", "guardian", "hoglin", "horse", "husk", "iron_golem", "llama", "magma_cube", "mooshroom", "mule", "ocelot", "panda", "parrot", "phantom", "pig", "piglin", "piglin_brute", "pillager", "polar_bear", "pufferfish", "rabbit", "ravager", "salmon", "sheep", "shulker", "silverfish", "skeleton", "skeleton_horse", "slime", "sniffer", "snow_golem", "spider", "squid", "stray", "strider", "tadpole", "trader_llama", "tropical_fish", "turtle", "vex", "villager", "vindicator", "wandering_trader", "warden", "witch", "wither", "wither_skeleton", "wolf", "zoglin", "zombie", "zombie_horse", "zombified_piglin", "creaking", "happy_ghast", "copper_golem", "nautilus",
  ];
  for (const m of mobs) push(out, `${m}_spawn_egg`, "Spawn eggs", "#e8e0c8", "gear", `Spawns a ${title(m).toLowerCase()}.`, `${title(m)} Spawn Egg`);

  const misc: [string, string, string, string][] = [
    ["book", "Book", "#c4a06a", "Materials"],
    ["writable_book", "Book and Quill", "#e6d3b1", "Materials"],
    ["written_book", "Written Book", "#d8c4a0", "Materials"],
    ["enchanted_book", "Enchanted Book", "#b07ad0", "Materials"],
    ["paper", "Paper", "#f4f0e8", "Materials"],
    ["map", "Map", "#c4b090", "Maps"],
    ["empty_map", "Empty Map", "#e6d3b1", "Maps"],
    ["item_frame", "Item Frame", "#a0743a", "Decor"],
    ["glow_item_frame", "Glow Item Frame", "#e6c070", "Decor"],
    ["painting", "Painting", "#8a5a32", "Decor"],
    ["armor_stand", "Armor Stand", "#a0743a", "Decor"],
    ["flower_pot", "Flower Pot", "#a06040", "Decor"],
    ["decorated_pot", "Decorated Pot", "#a06040", "Decor"],
    ["end_crystal", "End Crystal", "#d0b0e8", "Nether"],
    ["nether_star", "Nether Star", "#e8e8f0", "Materials"],
    ["ender_pearl", "Ender Pearl", "#1a6a58", "Materials"],
    ["ender_eye", "Eye of Ender", "#3a9a78", "Materials"],
    ["heart_of_the_sea", "Heart of the Sea", "#2a8aaa", "Materials"],
    ["nautilus_shell", "Nautilus Shell", "#e8d0b0", "Materials"],
    ["prismarine_shard", "Prismarine Shard", "#4a9a8a", "Materials"],
    ["prismarine_crystals", "Prismarine Crystals", "#b0e0d0", "Materials"],
    ["phantom_membrane", "Phantom Membrane", "#c8c0a8", "Materials"],
    ["turtle_scute", "Turtle Scute", "#3d7a32", "Materials"],
    ["arrow", "Arrow", "#c4b090", "Weapons"],
    ["spectral_arrow", "Spectral Arrow", "#e6d24a", "Weapons"],
    ["tipped_arrow", "Tipped Arrow", "#b07ad0", "Weapons"],
    ["firework_rocket", "Firework Rocket", "#e04040", "Decor"],
    ["firework_star", "Firework Star", "#e07a2f", "Decor"],
    ["experience_bottle", "Bottle o' Enchanting", "#70e060", "Brewing"],
    ["clay_ball", "Clay Ball", "#9aa4b0", "Materials"],
    ["brick", "Brick", "#8d4a3a", "Materials"],
    ["nether_brick", "Nether Brick", "#2c1218", "Materials"],
    ["stick", "Stick", "#a0743a", "Materials"],
    ["bowl", "Bowl", "#a0743a", "Materials"],
    ["sugar", "Sugar", "#f4f4f4", "Materials"],
    ["egg", "Egg", "#e8dcc8", "Materials"],
    ["snowball", "Snowball", "#f4f8fc", "Weapons"],
    ["ender_pearl_item", "Ender Pearl", "#1a6a58", "Materials"],
  ];
  for (const [id, name, color, group] of misc) {
    if (id === "ender_pearl_item" || id === "end_crystal") continue;
    const kind = ["item_frame", "glow_item_frame", "flower_pot", "armor_stand", "decorated_pot"].includes(id) ? "block" : "gear";
    push(out, id, group, color, kind, name + ".", name);
  }

  const seen = new Set<string>();
  return out.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
