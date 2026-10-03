import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DROPS, type DropItem } from "./catalog";
import { blockId } from "./engine";
import { foeInSight, oxidizeNearby, PLAN, seedActors, tickActors } from "./features";
import { armorPoints, armorSlotOf, iconFor } from "./icons";
import { askMovebot, stepToward } from "./movebot";
import {
  VoxelWorld,
  blockColor,
  campHint,
  horizontalSpeed,
  integrate,
  inWater,
  lookDir,
  placeableIndex,
  raycast,
  spawnPlayer,
  SX,
  SY,
  SZ,
  VIEW,
  WATER,
  type Player,
} from "./engine";

const HOTBAR = 9;
const ARMOR_LABELS = ["Head", "Chest", "Legs", "Feet"];

type Save = { hotbar: string[]; slot: number; armor?: (string | null)[]; offhand?: string | null };

function loadSave(): Save {
  try {
    const raw = localStorage.getItem("blockdrops-v1");
    if (raw) {
      const p = JSON.parse(raw) as Save;
      if (Array.isArray(p.hotbar) && p.hotbar.length === HOTBAR) return p;
    }
  } catch {
    /* ignore */
  }
  return {
    hotbar: [
      "wooden_spear",
      "bundle",
      "copper_chest",
      "poplar_log",
      "straw_bed",
      "golden_dandelion",
      "sulfur_block",
      "shelf_mushroom",
      "disc_tears",
    ],
    slot: 0,
    armor: [null, null, null, null],
    offhand: null,
  };
}

const TABS: { id: string; label: string; groups: string[] | null }[] = [
  { id: "All", label: "All", groups: null },
  { id: "Blocks", label: "Blocks", groups: ["Building", "Soft blocks", "Copper", "Poplar", "Sulfur caves", "Storage"] },
  { id: "Tools", label: "Tools", groups: ["Tools", "Weapons", "Armor", "Redstone", "Transport"] },
  { id: "Nature", label: "Nature", groups: ["Nature", "Plants", "Nether"] },
  { id: "Food", label: "Food", groups: ["Food", "Brewing"] },
  { id: "Gear", label: "Gear", groups: ["Materials", "Decor", "Music", "Patterns", "Maps", "Mounts", "Spawn eggs"] },
];

export function GameView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const icons = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of DROPS) map.set(item.id, iconFor(item));
    return map;
  }, []);
  const keysRef = useRef(new Set<string>());
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [slot, setSlot] = useState(0);
  const [hotbar, setHotbar] = useState<string[]>(() => loadSave().hotbar);
  const [armor, setArmor] = useState<(string | null)[]>(() => loadSave().armor ?? [null, null, null, null]);
  const [offhand, setOffhand] = useState<string | null>(() => loadSave().offhand ?? null);
  const [hearts, setHearts] = useState(10);
  const [hunger, setHunger] = useState(8);
  const [mode, setMode] = useState<"creative" | "survival">("creative");
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem("movebot-openrouter") ?? "";
    } catch {
      return "";
    }
  });
  const [botStatus, setBotStatus] = useState("waiting for a key");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapUrl, setMapUrl] = useState("");
  const [inventory, setInventory] = useState(false);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("Pond is northwest. Ocean is east. Space swims. F swaps off-hand.");
  const [heldName, setHeldName] = useState("Wooden Spear");
  const [planOpen, setPlanOpen] = useState(false);
  const [bundle, setBundle] = useState<string[]>([]);
  const playerRef = useRef<Player>(spawnPlayer());
  const worldRef = useRef<VoxelWorld | null>(null);
  const slotRef = useRef(0);
  const hotbarRef = useRef(hotbar);
  const armorRef = useRef(armor);
  const offhandRef = useRef(offhand);
  const heartsRef = useRef(10);
  const hungerRef = useRef(8);
  const blockUntil = useRef(0);
  const modeRef = useRef(mode);
  const keyRef = useRef(apiKey);
  const keyDraft = useRef<HTMLInputElement>(null);
  const orderRef = useRef("");
  const orderInputRef = useRef<HTMLInputElement>(null);
  const talkingRef = useRef(false);
  const [talking, setTalking] = useState(false);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    keyRef.current = apiKey;
    localStorage.setItem("movebot-openrouter", apiKey);
  }, [apiKey]);
  useEffect(() => {
    talkingRef.current = talking;
    if (talking) orderInputRef.current?.focus();
  }, [talking]);

  useEffect(() => {
    slotRef.current = slot;
  }, [slot]);
  useEffect(() => {
    hotbarRef.current = hotbar;
    armorRef.current = armor;
    offhandRef.current = offhand;
    const held = DROPS.find((d) => d.id === hotbar[slot]);
    if (held) setHeldName(held.name);
    localStorage.setItem("blockdrops-v1", JSON.stringify({ hotbar, slot, armor, offhand }));
  }, [hotbar, slot, armor, offhand]);

  useEffect(() => {
    const saved = loadSave();
    setHotbar(saved.hotbar);
    setSlot(saved.slot);
    if (saved.armor) setArmor(saved.armor);
    if (saved.offhand !== undefined) setOffhand(saved.offhand);
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const world = new VoxelWorld();
    worldRef.current = world;
    const player = playerRef.current;
    player.x = world.entrance.x;
    player.y = world.entrance.y;
    player.z = world.entrance.z;
    player.yaw = 0;
    player.pitch = -0.12;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x8ec5e8);
    el.appendChild(renderer.domElement);
    const veil = document.createElement("div");
    veil.style.cssText =
      "position:absolute;inset:0;pointer-events:none;opacity:0;background:rgba(16,90,170,0.45);transition:opacity 80ms linear";
    el.appendChild(veil);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x8ec5e8, 24, VIEW);
    scene.add(new THREE.HemisphereLight(0xfff4dd, 0x3d5a32, 1.05));
    const sun = new THREE.DirectionalLight(0xfff1d0, 1.15);
    sun.position.set(20, 40, 10);
    scene.add(sun);

    const pixel = new Uint8Array(8 * 8 * 4);
    const steps = [0.55, 0.78, 1, 0.66, 0.9, 0.72, 1.05, 0.6];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const k = Math.min(1, steps[(x + y * 3) % 8]! / 1.05);
        const i = (y * 8 + x) * 4;
        const v = (k * 255) | 0;
        pixel[i] = v;
        pixel[i + 1] = v;
        pixel[i + 2] = v;
        pixel[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(pixel, 8, 8);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.NoColorSpace;
    tex.needsUpdate = true;
    const geo = new THREE.BufferGeometry();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, map: tex });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    const waterGeo = new THREE.BufferGeometry();
    const waterMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      map: tex,
      transparent: true,
      opacity: 0.82,
      depthWrite: true,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.renderOrder = 2;
    scene.add(waterMesh);

    const box = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(box),
      new THREE.LineBasicMaterial({ color: 0xffffff }),
    );
    wire.visible = false;
    scene.add(wire);

    const actors = seedActors();
    const actorColor = (kind: string) =>
      kind === "golem" ? 0xb8734a : kind === "ghast" ? 0xf4efe4 : kind === "armadillo" ? 0xc9a36a : kind === "breeze" ? 0xb7e6f5 : kind === "dragon" ? 0x3a2458 : 0x2f6f86;
    function makeActorMesh(kind: string) {
      const big = kind === "ghast" || kind === "dragon";
      return new THREE.Mesh(
        new THREE.BoxGeometry(big ? 1.6 : 0.7, kind === "dragon" ? 0.7 : big ? 1.2 : 0.7, big ? 2.2 : 0.9),
        new THREE.MeshLambertMaterial({ color: actorColor(kind) }),
      );
    }
    const actorMeshes = actors.map((a) => {
      const meshA = makeActorMesh(a.kind);
      scene.add(meshA);
      return meshA;
    });
    const movebot = new THREE.Group();
    const part = (w: number, h: number, d: number, color: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      return mesh;
    };
    movebot.add(
      part(0.64, 0.7, 0.36, 0xb7c0c7, 0, 0.88, 0),
      part(0.3, 0.16, 0.06, 0x1f8f6a, 0, 0.96, -0.2),
      part(0.46, 0.38, 0.4, 0xd7dee4, 0, 1.5, 0),
      part(0.3, 0.1, 0.06, 0x39e7ff, 0, 1.52, -0.22),
      part(0.04, 0.26, 0.04, 0x2c3338, 0, 1.82, 0),
      part(0.08, 0.08, 0.08, 0xff5a36, 0, 1.98, 0),
      part(0.14, 0.52, 0.14, 0x2c3338, -0.42, 0.86, 0),
      part(0.14, 0.52, 0.14, 0x2c3338, 0.42, 0.86, 0),
      part(0.16, 0.4, 0.16, 0x3a4248, -0.16, 0.28, 0),
      part(0.16, 0.4, 0.16, 0x3a4248, 0.16, 0.28, 0),
      part(0.2, 0.08, 0.26, 0x1a1e22, -0.16, 0.06, 0),
      part(0.2, 0.08, 0.26, 0x1a1e22, 0.16, 0.06, 0),
    );
    const tag = document.createElement("canvas");
    tag.width = 256;
    tag.height = 64;
    const tagCtx = tag.getContext("2d");
    if (tagCtx) {
      tagCtx.fillStyle = "#e9fff4";
      tagCtx.font = "bold 36px sans-serif";
      tagCtx.fillText("Movebot", 16, 44);
    }
    const tagTex = new THREE.CanvasTexture(tag);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex, transparent: true }));
    label.position.y = 2.25;
    label.scale.set(1.8, 0.45, 1);
    movebot.add(label);
    scene.add(movebot);
    const bot = { x: 22, y: 10, z: 14, action: "stay", hop: 0, acc: 0, pending: false, nagged: false, lastX: 22, lastZ: 14, stuck: 0 };
    let lastFight = 0;
    let lastBuild = 0;
    const riding = { ghast: -1 };
    let oxidizeAcc = 0;
    let portalLock = 0;
    const audio = { ctx: null as AudioContext | null };

    function paintSky() {
      const c = world.sky[world.dimension];
      renderer.setClearColor(c);
      scene.fog = new THREE.Fog(c, world.dimension === "overworld" ? 24 : 12, world.dimension === "overworld" ? VIEW : 36);
    }

    function playDisc(id: string) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audio.ctx) audio.ctx = new Ctx();
      const ctx = audio.ctx;
      void ctx.resume();
      const notes = id.includes("lava") ? [196, 247, 294, 247] : id.includes("bounce") ? [330, 392, 494, 392] : [440, 523, 659, 523];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.type = "triangle";
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.28);
        osc.stop(ctx.currentTime + i * 0.28 + 0.24);
      });
    }

    let meshX = player.x;
    let meshZ = player.z;
    function rebuild() {
      const m = world.buildMesh(player.x, player.z, VIEW);
      meshX = player.x;
      meshZ = player.z;
      const next = new THREE.BufferGeometry();
      next.setAttribute("position", new THREE.BufferAttribute(m.pos, 3));
      next.setAttribute("normal", new THREE.BufferAttribute(m.nor, 3));
      next.setAttribute("color", new THREE.BufferAttribute(m.col, 3));
      next.setAttribute("uv", new THREE.BufferAttribute(m.uv, 2));
      const prev = mesh.geometry;
      mesh.geometry = next;
      prev.dispose();
      const wet = new THREE.BufferGeometry();
      wet.setAttribute("position", new THREE.BufferAttribute(m.wpos, 3));
      wet.setAttribute("normal", new THREE.BufferAttribute(m.wnor, 3));
      wet.setAttribute("color", new THREE.BufferAttribute(m.wcol, 3));
      wet.setAttribute("uv", new THREE.BufferAttribute(m.wuv, 2));
      const prevWet = waterMesh.geometry;
      waterMesh.geometry = wet;
      prevWet.dispose();
    }
    rebuild();

    const camera = new THREE.PerspectiveCamera(72, el.clientWidth / el.clientHeight, 0.08, VIEW + 8);

    const keys = keysRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "KeyB" && e.type === "keydown" && !e.repeat) {
        setBundle((items) => {
          setToast(items.length ? `Bundle emptied: ${items.join(", ")}` : "Bundle is empty.");
          return [];
        });
        return;
      }
      if (e.code === "KeyF" && e.type === "keydown" && !e.repeat) {
        const held = hotbarRef.current[slotRef.current] ?? "";
        if (held.includes("harness")) {
          const p = playerRef.current;
          const near = actors.findIndex((a) => a.kind === "ghast" && Math.hypot(a.x - p.x, a.z - p.z) < 4);
          if (near >= 0 || riding.ghast >= 0) {
            riding.ghast = riding.ghast === near ? -1 : near;
            setToast(riding.ghast >= 0 ? "Riding the happy ghast. F to get off." : "Dismounted.");
            return;
          }
        }
        const off = offhandRef.current;
        setHotbar((h) => {
          const next = [...h];
          next[slotRef.current] = off ?? "";
          return next;
        });
        setOffhand(held || null);
        setToast("Swapped off-hand.");
        return;
      }
      if (e.code === "KeyM" && e.type === "keydown" && !e.repeat && playingRef.current) {
        keys.clear();
        setTalking(true);
        if (document.pointerLockElement) document.exitPointerLock();
        return;
      }
      if (e.code === "KeyE") {
        if (e.type === "keydown" && !e.repeat) {
          setInventory((v) => !v);
          setMapOpen(false);
          if (document.pointerLockElement) document.exitPointerLock();
        }
        return;
      }
      if (e.code.startsWith("Digit")) {
        const n = Number(e.code.slice(5));
        if (n >= 1 && n <= 9 && e.type === "keydown") setSlot(n - 1);
      }
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.type === "keydown") keys.add(e.code);
      else keys.delete(e.code);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    const onBlur = () => {
      keys.clear();
      breakShot = false;
      placeShot = false;
    };
    window.addEventListener("blur", onBlur);

    const canvas = renderer.domElement;
    canvas.addEventListener("click", () => {
      if (playingRef.current && !talkingRef.current) canvas.requestPointerLock();
    });
    const onMouse = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      player.yaw -= e.movementX * 0.0022;
      player.pitch -= e.movementY * 0.0022;
      player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch));
    };
    window.addEventListener("mousemove", onMouse);

    let breakShot = false;
    let placeShot = false;
    const releaseShots = () => {
      breakShot = false;
      placeShot = false;
    };
    const onDown = (e: PointerEvent) => {
      if (document.pointerLockElement !== canvas) return;
      if (e.button === 0) breakShot = true;
      if (e.button === 2) placeShot = true;
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointercancel", releaseShots);
    document.addEventListener("pointerlockchange", releaseShots);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    const onWheel = (e: WheelEvent) => {
      if (!playingRef.current) return;
      setSlot((s) => (s + (e.deltaY > 0 ? 1 : HOTBAR - 1)) % HOTBAR);
    };
    canvas.addEventListener("wheel", onWheel, { passive: true });

    let last = performance.now();
    let hurtAt = 0;
    let hungerAcc = 0;

    window.__controlsTest = {
      getYaw: () => player.yaw,
      getSpeed: () => horizontalSpeed(player),
      getX: () => player.x,
      getZ: () => player.z,
      setKeys: (codes) => {
        keys.clear();
        for (const c of codes) keys.add(c);
        playingRef.current = true;
      },
      setPose: (x: number, y: number, z: number, yaw: number, pitch: number) => {
        player.x = x;
        player.y = y;
        player.z = z;
        player.yaw = yaw;
        player.pitch = pitch;
        playingRef.current = true;
      },
    };

    function drawMap() {
      const canvas = document.createElement("canvas");
      canvas.width = SX;
      canvas.height = SZ;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      const img = ctx.createImageData(SX, SZ);
      for (let z = 0; z < SZ; z++) {
        for (let x = 0; x < SX; x++) {
          let r = 18;
          let g = 28;
          let b = 22;
          for (let y = SY - 1; y >= 0; y--) {
            const id = world.get(x, y, z);
            if (id === WATER) {
              r = 42;
              g = 120;
              b = 196;
              break;
            }
            if (id !== 0) {
              const [cr, cg, cb] = blockColor(id);
              r = (cr * 255) | 0;
              g = (cg * 255) | 0;
              b = (cb * 255) | 0;
              break;
            }
          }
          const p = (z * SX + x) * 4;
          img.data[p] = r;
          img.data[p + 1] = g;
          img.data[p + 2] = b;
          img.data[p + 3] = 255;
        }
      }
      const px = Math.max(0, Math.min(SX - 1, Math.floor(player.x)));
      const pz = Math.max(0, Math.min(SZ - 1, Math.floor(player.z)));
      const p = (pz * SX + px) * 4;
      img.data[p] = 255;
      img.data[p + 1] = 255;
      img.data[p + 2] = 255;
      ctx.putImageData(img, 0, 0);
      return canvas.toDataURL();
    }

    function waterAlong(dx: number, dy: number, dz: number) {
      for (let t = 0.35; t < 6; t += 0.2) {
        const x = Math.floor(player.x + dx * t);
        const y = Math.floor(player.y + 1.62 + dy * t);
        const z = Math.floor(player.z + dz * t);
        const id = world.get(x, y, z);
        if (id === WATER) return { x, y, z };
        if (world.solid(id)) return null;
      }
      return null;
    }

    function useHeld(item: DropItem, dx: number, dy: number, dz: number, hit: { x: number; y: number; z: number; nx: number; ny: number; nz: number } | null) {
      if (item.id === "map" || item.id.endsWith("_map")) {
        setMapUrl(drawMap());
        setMapOpen(true);
        if (document.pointerLockElement) document.exitPointerLock();
        setToast("Map of this world. The white dot is you.");
        return true;
      }
      if (item.id.includes("compass")) {
        setToast(`Camp is ${campHint(player.yaw, player.x, player.z, world.entrance.x, world.entrance.z)}.`);
        return true;
      }
      if (item.id === "clock") {
        const names = ["dawn", "morning", "noon", "afternoon", "dusk", "night"];
        const name = names[Math.floor(((performance.now() / 1000 / 90) % 1) * 6)] ?? "noon";
        setToast(`The clock reads ${name}.`);
        return true;
      }
      if (item.group === "Food") {
        hungerRef.current = Math.min(10, hungerRef.current + 2);
        setHunger(hungerRef.current);
        setToast(`Ate ${item.name}.`);
        return true;
      }
      if (item.id === "shield") {
        blockUntil.current = performance.now() + 900;
        setToast("Shield raised.");
        return true;
      }
      if (item.id === "bucket") {
        const cell = waterAlong(dx, dy, dz);
        if (!cell) {
          setToast("Point the bucket at water.");
          return true;
        }
        world.set(cell.x, cell.y, 0, cell.z);
        rebuild();
        setHotbar((h) => {
          const next = [...h];
          next[slotRef.current] = "water_bucket";
          return next;
        });
        setToast("Filled the bucket.");
        return true;
      }
      if (item.id === "water_bucket") {
        const px = hit ? hit.x + hit.nx : Math.floor(player.x + dx * 2);
        const py = hit ? hit.y + hit.ny : Math.floor(player.y);
        const pz = hit ? hit.z + hit.nz : Math.floor(player.z + dz * 2);
        if (world.get(px, py, pz) === 0) {
          world.set(px, py, WATER, pz);
          rebuild();
          setHotbar((h) => {
            const next = [...h];
            next[slotRef.current] = "bucket";
            return next;
          });
          setToast("Poured a water source.");
        } else setToast("Point at an open block.");
        return true;
      }
      if (item.id.includes("bucket")) {
        setToast(item.blurb);
        return true;
      }
      if (item.id.startsWith("disc_") || item.id.startsWith("music_disc_")) {
        playDisc(item.id);
        setToast(`Playing ${item.name}.`);
        return true;
      }
      return false;
    }

    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (playingRef.current && !talkingRef.current) {
        integrate(world, player, keys, dt);
        if (riding.ghast >= 0) {
          const g = actors[riding.ghast];
          if (g) {
            player.x = g.x;
            player.y = g.y - 0.2;
            player.z = g.z;
            player.vy = 0;
          }
        }
        tickActors(world, actors, player, dt);
        if (portalLock > 0) portalLock -= dt;
        else {
          const gate = world.gates.find(
            (g) => g.dim === world.dimension && Math.hypot(player.x - g.x, player.z - g.z) < 1.2 && Math.abs(player.y - g.sy) < 3,
          );
          if (gate) {
            world.use(gate.to);
            player.x = gate.sx;
            player.y = gate.sy;
            player.z = gate.sz;
            player.vx = 0;
            player.vz = 0;
            player.vy = 0;
            portalLock = 1.4;
            rebuild();
            paintSky();
            setToast(gate.to === "nether" ? "The Nether. Walk back into the portal to leave." : gate.to === "end" ? "The End. The dragon circles the island." : "Back on the surface.");
          }
        }
        actors.forEach((a, i) => {
          const meshA = actorMeshes[i];
          if (!meshA) return;
          meshA.visible = a.dim === world.dimension && a.hp > 0;
          meshA.position.set(a.x, a.y + (a.kind === "ghast" || a.kind === "dragon" ? 0.6 : 0.35), a.z);
          const near = Math.hypot(a.x - player.x, a.z - player.z) < 2.8;
          const curl = a.kind === "armadillo" && near ? 0.45 : 1;
          meshA.scale.set(curl, a.kind === "armadillo" && near ? 0.45 : 1, curl);
        });
        oxidizeAcc += dt;
        if (oxidizeAcc > 14) {
          oxidizeAcc = 0;
          if (oxidizeNearby(world, player.x, player.z)) rebuild();
        }
        if (world.dimension === "overworld" && playingRef.current) {
          bot.acc += dt;
          const key = keyRef.current.trim();
          if (!key || (bot.action === "stay" && !orderRef.current.trim())) {
            bot.action = stepToward(player.x, player.z, bot.x, bot.z);
          }
          if (key && bot.acc > 8 && !bot.pending) {
            bot.acc = 0;
            bot.pending = true;
            const feet = (x: number, z: number) => {
              const id = world.get(Math.floor(bot.x + x), Math.floor(bot.y), Math.floor(bot.z + z));
              if (id === WATER) return "water";
              if (world.solid(id)) return "blocked";
              return "open";
            };
            const around = [feet(0, -2), feet(0, 2), feet(2, 0), feet(-2, 0)];
            const blockedSides = around.filter((s) => s === "blocked").length;
            const distance = Math.hypot(player.x - bot.x, player.z - bot.z);
            const moved = Math.hypot(bot.x - bot.lastX, bot.z - bot.lastZ);
            if (bot.action !== "stay" && moved < 0.25) bot.stuck += 1;
            else bot.stuck = 0;
            bot.lastX = bot.x;
            bot.lastZ = bot.z;
            const swimming = inWater(world, player.x, player.y + 1, player.z);
            const speed = Math.hypot(player.vx, player.vz);
            const playerDoing =
              lastFight > 0 && now - lastFight < 4000
                ? "fighting"
                : swimming
                  ? "swimming"
                  : lastBuild > 0 && now - lastBuild < 4000
                    ? "building"
                    : speed > 3
                      ? "running"
                      : "idle";
            const botDoing = bot.stuck >= 2 ? "stuck" : around.some((s) => s === "water") ? "in water" : distance > 20 ? "following" : "wandering";
            const request = orderRef.current.trim();
            const scene = { request, playerDoing, botDoing, blockedSides, distance };
            bot.action = stepToward(player.x, player.z, bot.x, bot.z);
            const state = `Request: ${request || "none"}. Movebot is ${botDoing} at ${bot.x.toFixed(0)}, ${bot.z.toFixed(0)}. Player is ${playerDoing} at ${player.x.toFixed(0)}, ${player.z.toFixed(0)}, ${distance.toFixed(0)} blocks away. North ${around[0]}. South ${around[1]}. East ${around[2]}. West ${around[3]}. Walk toward the player unless the request says otherwise. Do not walk into blocked ground.`;
            const ctrl = new AbortController();
            const timer = window.setTimeout(() => ctrl.abort(), 2000);
            askMovebot(key, state, scene, ctrl.signal)
              .then((step) => {
                bot.pending = false;
                if (step.action === "jump") {
                  bot.hop = 0.45;
                  bot.action = stepToward(player.x, player.z, bot.x, bot.z);
                } else bot.action = step.action;
                setBotStatus(`${step.action} · ${step.model} · free · ${step.why}`);
              })
              .catch(() => {
                bot.pending = false;
                bot.action = stepToward(player.x, player.z, bot.x, bot.z);
                setBotStatus("walking · Lightning · free");
              })
              .finally(() => window.clearTimeout(timer));
          }
          const step = 2.6 * dt;
          let nx = bot.x;
          let nz = bot.z;
          if (bot.action === "north") nz -= step;
          if (bot.action === "south") nz += step;
          if (bot.action === "east") nx += step;
          if (bot.action === "west") nx -= step;
          const groundAt = (x: number, z: number) => {
            for (let y = SY - 1; y >= 0; y--) {
              const id = world.get(Math.floor(x), y, Math.floor(z));
              if (id && id !== WATER) return y + 1;
            }
            return 8;
          };
          const gy = groundAt(nx, nz);
          if (!world.solid(world.get(Math.floor(nx), Math.floor(gy), Math.floor(nz)))) {
            bot.x = Math.max(1, Math.min(SX - 2, nx));
            bot.z = Math.max(1, Math.min(SZ - 2, nz));
          }
          if (bot.hop > 0) bot.hop -= dt;
          bot.y = groundAt(bot.x, bot.z);
          movebot.visible = true;
          movebot.position.set(bot.x, bot.y + (bot.hop > 0 ? 0.7 : 0), bot.z);
          movebot.rotation.y = bot.action === "south" ? Math.PI : bot.action === "west" ? Math.PI / 2 : bot.action === "east" ? -Math.PI / 2 : 0;
        } else {
          movebot.visible = false;
        }
        if (Math.hypot(player.x - meshX, player.z - meshZ) > 10) rebuild();
      }
      const eyeY = player.y + 1.62;
      const dir = lookDir(player);
      if (veil) veil.style.opacity = inWater(world, player.x, eyeY, player.z) ? "1" : "0";
      camera.position.set(player.x, eyeY, player.z);
      camera.lookAt(player.x + dir.x, eyeY + dir.y, player.z + dir.z);

      const heldId = hotbarRef.current[slotRef.current] ?? "";
      const reach = heldId.includes("spear") || heldId === "trident" ? 8 : 5;
      const hit = raycast(world, player.x, eyeY, player.z, dir.x, dir.y, dir.z, reach);
      const hitDist = hit ? Math.hypot(hit.x + 0.5 - player.x, hit.y + 0.5 - eyeY, hit.z + 0.5 - player.z) : 99;
      if (hit && hit.nx + hit.ny + hit.nz !== 0 && hitDist > 1.15) {
        wire.visible = true;
        wire.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
      } else wire.visible = false;

      const breaking = breakShot;
      const placing = placeShot;
      breakShot = false;
      placeShot = false;

      if (playingRef.current && modeRef.current === "creative") {
        for (const a of actors) {
          if (a.hp <= 0 || a.dim !== world.dimension) continue;
          if (a.kind !== "breeze" && a.kind !== "dragon") continue;
          const dist = Math.hypot(player.x - a.x, player.z - a.z);
          const range = a.kind === "dragon" ? 4.2 : 2.5;
          if (dist >= range || now / 1000 - hurtAt < 1.6) continue;
          hurtAt = now / 1000;
          const raw = a.kind === "dragon" ? 4 : 2;
          const guard = Math.min(0.72, armorPoints(armorRef.current) * 0.036);
          const shielding = (offhandRef.current === "shield" || heldId === "shield") && performance.now() < blockUntil.current;
          let dmg = Math.max(0, Math.round(raw * (1 - guard)));
          if (shielding) dmg = Math.max(0, dmg - 2);
          if (dmg <= 0) {
            setToast("Blocked.");
            continue;
          }
          heartsRef.current = Math.max(0, heartsRef.current - dmg);
          setHearts(heartsRef.current);
          if (heartsRef.current <= 0) {
            heartsRef.current = 10;
            setHearts(10);
            player.x = world.entrance.x;
            player.y = world.entrance.y;
            player.z = world.entrance.z;
            player.vx = 0;
            player.vy = 0;
            player.vz = 0;
            setToast("You wake up at camp.");
          } else {
            setToast(`${a.kind === "dragon" ? "Dragon" : "Breeze"} hit you. ${heartsRef.current} hearts.`);
          }
        }
        hungerAcc += dt;
        if (hungerAcc > 30) {
          hungerAcc = 0;
          if (hungerRef.current > 0) {
            hungerRef.current -= 1;
            setHunger(hungerRef.current);
          }
        }
      }

      if (playingRef.current && breaking) {
        const foe = foeInSight(world, actors, player.x, eyeY, player.z, dir.x, dir.y, dir.z, reach);
        if (foe) {
          const power = heldId.includes("netherite_sword")
            ? 5
            : heldId.includes("diamond_sword")
              ? 4
              : heldId.endsWith("_sword")
                ? 3
                : heldId.endsWith("_axe")
                  ? 2
                  : heldId.includes("spear") || heldId === "trident"
                    ? 2
                    : 1;
          foe.hp -= power;
          lastFight = performance.now();
          if (foe.hp <= 0) {
            foe.hp = 0;
            world.set(Math.floor(foe.homeX), foe.kind === "dragon" ? 7 : 2, blockId(foe.kind === "dragon" ? "oxidized_copper_chest" : "copper_chest"), Math.floor(foe.homeZ));
            rebuild();
            setToast(foe.kind === "dragon" ? "The dragon drops. A chest is on the island." : "Trial cleared. A copper chest opened in the pit.");
          } else {
            setToast(`${foe.kind === "dragon" ? "Dragon" : "Breeze"} has ${foe.hp} left.`);
          }
        } else if (hit && world.get(hit.x, hit.y, hit.z) > 3) {
          world.set(hit.x, hit.y, 0, hit.z);
          rebuild();
        }
      }

      if (playingRef.current && placing) {
        const item = DROPS.find((d) => d.id === hotbarRef.current[slotRef.current]);
        const used = item ? useHeld(item, dir.x, dir.y, dir.z, hit) : false;
        if (!used && item?.id.includes("bundle") && hit) {
          const looked = DROPS[world.get(hit.x, hit.y, hit.z) - 4];
          if (looked) {
            setBundle((items) => [...items, looked.name].slice(-8));
            setToast(`Bundled ${looked.name}. Press B to empty.`);
          }
        } else if (!used && hit && item?.kind === "block") {
          const looked = world.get(hit.x, hit.y, hit.z);
          if (looked === blockId("dried_ghast")) {
            world.set(hit.x, hit.y, 0, hit.z);
            actors.push({ kind: "ghast", x: hit.x + 0.5, y: hit.y + 3, z: hit.z + 0.5, homeX: hit.x, homeZ: hit.z, t: 0, dim: world.dimension, hp: 1 });
            const meshA = makeActorMesh("ghast");
            scene.add(meshA);
            actorMeshes.push(meshA);
            rebuild();
            setToast("The dried ghast soaked up and grew.");
          } else if (looked === blockId("copper_golem_statue")) {
            world.set(hit.x, hit.y, 0, hit.z);
            actors.push({ kind: "golem", x: hit.x + 0.5, y: hit.y, z: hit.z + 0.5, homeX: hit.x, homeZ: hit.z, t: 0, dim: world.dimension, hp: 1 });
            const meshA = makeActorMesh("golem");
            scene.add(meshA);
            actorMeshes.push(meshA);
            rebuild();
            setToast("The statue woke up and is looking for a copper chest.");
          } else if (looked === blockId("shelf")) {
            setToast(`Shelf now displays ${item.name}.`);
          } else {
          const px = hit.x + hit.nx;
          const py = hit.y + hit.ny;
          const pz = hit.z + hit.nz;
          const idx = placeableIndex(item);
          const occupied = world.get(px, py, pz);
          const overlaps =
            Math.abs(px + 0.5 - player.x) < 0.6 &&
            py < player.y + 1.7 &&
            py + 1 > player.y + 0.2 &&
            Math.abs(pz + 0.5 - player.z) < 0.6;
          if (idx >= 0 && (occupied === 0 || occupied === WATER) && !overlaps) {
            world.set(px, py, idx + 4, pz);
            lastBuild = performance.now();
            rebuild();
          } else if (idx >= 0) {
            setToast(occupied !== 0 && occupied !== WATER ? "Can't place there." : "Move back a little to place.");
          }
          }
        } else if (!used && item) {
          setToast(item.blurb);
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("pointercancel", releaseShots);
      document.removeEventListener("pointerlockchange", releaseShots);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("wheel", onWheel);
      geo.dispose();
      mesh.geometry.dispose();
      mat.dispose();
      waterMesh.geometry.dispose();
      waterMat.dispose();
      tex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      veil.remove();
      delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  function begin() {
    const next = (keyDraft.current?.value ?? keyRef.current).trim();
    keyRef.current = next;
    setApiKey(next);
    setPlaying(true);
    playingRef.current = true;
    mountRef.current?.querySelector("canvas")?.requestPointerLock();
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = TABS.find((t) => t.id === tab)?.groups ?? null;
    return DROPS.filter(
      (d) =>
        (!groups || groups.includes(d.group)) &&
        (!q || d.name.toLowerCase().includes(q) || d.id.includes(q)),
    );
  }, [tab, query]);

  function pick(item: DropItem) {
    const piece = armorSlotOf(item.id);
    if (piece >= 0) {
      setArmor((worn) => {
        const next = [...worn];
        next[piece] = item.id;
        return next;
      });
      setToast(`Equipped ${item.name}.`);
      return;
    }
    setHotbar((h) => {
      const next = [...h];
      next[slot] = item.id;
      return next;
    });
    setHeldName(item.name);
    setToast(item.kind === "block" ? `Right click places ${item.name}.` : item.blurb);
  }

  function touchKey(code: string, down: boolean) {
    if (down) keysRef.current.add(code);
    else keysRef.current.delete(code);
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0e1812] select-none">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-white/90" />
        <div className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-white/90" />
      </div>

      <div className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-md bg-black/45 px-3 py-2 text-sm text-[#f4efe4]">
        <div className="text-[11px] tracking-wide text-[#e6d3b1]/80 uppercase">Holding</div>
        <div className="font-semibold">{heldName}</div>
        <div className="mt-1 text-xs text-white/80">{toast}</div>
        {mode === "creative" && (
          <div className="mt-1 flex items-center gap-3 text-xs">
            <span className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={i < hearts ? "h-2 w-2 bg-[#e07070]" : "h-2 w-2 bg-white/20"} />
              ))}
            </span>
            <span className="text-[#e6c84a]">Food {hunger}/10</span>
          </div>
        )}
        <div className="mt-1 text-xs text-[#7ddec0]">Movebot: {botStatus} · M to talk</div>
        {bundle.length > 0 && <div className="mt-1 text-xs text-[#e6d3b1]">Bundle: {bundle.join(", ")}</div>}
      </div>

      {talking && (
        <form
          className="absolute inset-x-0 bottom-24 z-40 mx-auto w-full max-w-lg px-3"
          onSubmit={(e) => {
            e.preventDefault();
            orderRef.current = orderInputRef.current?.value ?? "";
            setTalking(false);
            if (playingRef.current) mountRef.current?.querySelector("canvas")?.requestPointerLock();
          }}
        >
          <label className="block rounded-md border border-[#7ddec0]/40 bg-black/80 p-3 text-sm text-[#f4efe4]">
            <span className="text-xs text-[#7ddec0]">Movebot. Enter puts you back in the game.</span>
            <input
              ref={orderInputRef}
              defaultValue={orderRef.current}
              onChange={(e) => {
                orderRef.current = e.target.value;
              }}
              placeholder="Tell Movebot what to do"
              className="mt-2 w-full rounded border border-white/20 bg-black/50 px-3 py-2 text-sm outline-none"
            />
          </label>
        </form>
      )}

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-2">
        <div className="flex flex-col gap-1">
          {armor.map((id, i) => {
            const item = id ? DROPS.find((d) => d.id === id) : undefined;
            return (
              <button
                key={ARMOR_LABELS[i]}
                type="button"
                title={item?.name ?? ARMOR_LABELS[i]}
                onClick={() =>
                  setArmor((worn) => {
                    const next = [...worn];
                    next[i] = null;
                    return next;
                  })
                }
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/25 bg-black/50"
              >
                {item ? (
                  <span
                    className="h-6 w-6"
                    style={{ backgroundImage: icons.get(item.id), backgroundSize: "100% 100%", imageRendering: "pixelated" }}
                  />
                ) : (
                  <span className="text-[8px] text-white/40">{ARMOR_LABELS[i]}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1">
        {hotbar.map((id, i) => {
          const item = DROPS.find((d) => d.id === id);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSlot(i)}
              className={
                "flex h-14 w-14 flex-col items-center justify-end rounded-md border pb-1 text-[9px] leading-tight " +
                (i === slot ? "border-[#e6d3b1] bg-black/70" : "border-white/20 bg-black/50")
              }
            >
              <span
                className="mb-1 h-8 w-8 rounded-sm border border-black/40"
                style={{
                  backgroundImage: item ? icons.get(item.id) : undefined,
                  backgroundSize: "100% 100%",
                  imageRendering: "pixelated",
                }}
              />
              <span className="px-0.5 text-center text-white">{i + 1}</span>
            </button>
          );
        })}
        </div>
        <button
          type="button"
          title={offhand ? DROPS.find((d) => d.id === offhand)?.name : "Off hand"}
          onClick={() => {
            const held = hotbar[slot];
            setHotbar((h) => {
              const next = [...h];
              next[slot] = offhand ?? "";
              return next;
            });
            setOffhand(held || null);
          }}
          className="flex h-14 w-14 flex-col items-center justify-end rounded-md border border-[#8eb4d4]/50 bg-black/50 pb-1"
        >
          {offhand ? (
            <span
              className="mb-1 h-8 w-8"
              style={{
                backgroundImage: icons.get(offhand),
                backgroundSize: "100% 100%",
                imageRendering: "pixelated",
              }}
            />
          ) : (
            <span className="mb-1 text-[9px] text-white/50">Off</span>
          )}
          <span className="text-[9px] text-white/70">F</span>
        </button>
      </div>

      <div className="absolute right-3 top-3 z-20 flex gap-2">
        <button
          type="button"
          onClick={() => setPlanOpen(true)}
          className="rounded-md bg-[#1b3a2a] px-3 py-2 text-sm font-semibold text-[#e6d3b1]"
        >
          Plan
        </button>
        <button
          type="button"
          onClick={() => {
            setInventory(true);
            if (document.pointerLockElement) document.exitPointerLock();
          }}
          className="rounded-md bg-[#c46a3a] px-3 py-2 text-sm font-semibold text-[#1b120c]"
        >
          Items
        </button>
      </div>

      {!playing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0e1812]/75 p-6">
          <div className="max-w-md rounded-xl border border-[#e6d3b1]/30 bg-[#14261c] p-6 shadow-xl">
            <p className="text-xs tracking-[0.2em] text-[#c46a3a] uppercase">Three worlds</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#f4efe4]">Ice, trials, Nether, End</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#e6d3b1]">
              The world is {SX} by {SZ}. You only see {VIEW} blocks ahead, the width of the first map. Creative shows hearts and food. Survival does not. Movebot walks on the free Lightning model only.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("creative")}
                className={
                  "rounded-md px-3 py-2 text-sm font-semibold " +
                  (mode === "creative" ? "bg-[#c46a3a] text-[#1b120c]" : "bg-white/10 text-[#f4efe4]")
                }
              >
                Creative
              </button>
              <button
                type="button"
                onClick={() => setMode("survival")}
                className={
                  "rounded-md px-3 py-2 text-sm font-semibold " +
                  (mode === "survival" ? "bg-[#c46a3a] text-[#1b120c]" : "bg-white/10 text-[#f4efe4]")
                }
              >
                Survival
              </button>
            </div>
            <p className="mt-2 text-xs text-white/70">
              {mode === "creative" ? "Hearts and food are on." : "No hearts and no food."}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                begin();
              }}
            >
              <label className="mt-3 block text-xs text-white/70">
                OpenRouter key. Movebot only calls nvidia/nemotron-3.5-lightning:free, which is $0. Press Enter to start.
                <input
                  ref={keyDraft}
                  type="password"
                  defaultValue={apiKey}
                  autoComplete="off"
                  placeholder="sk-or-..."
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-[#f4efe4] outline-none"
                />
              </label>
              <ul className="mt-3 space-y-1 text-sm text-white/80">
                <li>WASD move, mouse look, space jump. In water, space rises and sneak sinks.</li>
                <li>M opens the Movebot text window. Enter closes it and puts you back in the game.</li>
              </ul>
              <button type="submit" className="mt-5 rounded-md bg-[#c46a3a] px-4 py-2 font-semibold text-[#1b120c]">
                Start
              </button>
            </form>
          </div>
        </div>
      )}

      {planOpen && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="flex max-h-[86dvh] w-full max-w-lg flex-col rounded-xl border border-white/10 bg-[#14261c] p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">What the newer game has</h2>
              <button type="button" className="rounded-md bg-white/10 px-3 py-1" onClick={() => setPlanOpen(false)}>
                Close
              </button>
            </div>
            <ul className="space-y-2 overflow-y-auto">
              {PLAN.map((row) => (
                <li key={row.name} className="rounded-md bg-black/30 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{row.name}</span>
                    <span className={row.state === "In" ? "text-xs text-[#8fbf6a]" : "text-xs text-[#e6c84a]"}>{row.state}</span>
                  </div>
                  <p className="text-xs text-white/70">{row.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {mapOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-xl border border-[#c4b090]/40 bg-[#1a140e] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-[#f4efe4]">Map</h2>
              <button type="button" className="rounded-md bg-white/10 px-3 py-1" onClick={() => setMapOpen(false)}>
                Close
              </button>
            </div>
            <img
              src={mapUrl}
              alt="Top-down map of the world"
              className="h-72 w-72 border border-black"
              style={{ imageRendering: "pixelated" }}
            />
            <p className="mt-2 text-xs text-white/70">White dot is you. Blue is water, green is grass.</p>
          </div>
        </div>
      )}
      {inventory && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="flex max-h-[86dvh] w-full max-w-3xl flex-col rounded-xl border border-white/10 bg-[#14261c] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Items — {DROPS.length}</h2>
              <button type="button" className="rounded-md bg-white/10 px-3 py-1" onClick={() => setInventory(false)}>
                Close
              </button>
            </div>
            <p className="mb-2 text-xs text-white/60">
              Armor equips when you click it. Off-hand is the slot beside the hotbar. F swaps it. Right-click a map, compass, clock, food, or bucket.
            </p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search every item"
              className="mb-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-[#f4efe4] outline-none placeholder:text-white/40"
            />
            <div className="mb-2 grid grid-cols-3 gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={
                    "rounded-md px-2 py-2 text-sm font-semibold " +
                    (tab === t.id ? "bg-[#c46a3a] text-[#1b120c]" : "bg-white/10 text-[#f4efe4]")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="grid flex-1 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
              {shown.length === 0 && <p className="col-span-2 px-2 py-6 text-sm text-white/60 sm:col-span-3">No matches.</p>}
              {shown.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pick(item)}
                  className="flex items-center gap-2 rounded-md bg-black/30 px-2 py-2 text-left hover:bg-black/50"
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-sm"
                    style={{
                      backgroundImage: icons.get(item.id),
                      backgroundSize: "100% 100%",
                      imageRendering: "pixelated",
                    }}
                  />
                  <span>
                    <span className="block text-sm leading-tight">{item.name}</span>
                    <span className="block text-[10px] text-white/50">
                      {item.kind === "block" ? "Placeable" : "Held"} · {item.group}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-20 left-3 flex flex-col gap-2 sm:hidden">
        {(
          [
            ["W", "KeyW"],
            ["A", "KeyA"],
            ["S", "KeyS"],
            ["D", "KeyD"],
          ] as const
        ).map(([label, code]) => (
          <button
            key={code}
            type="button"
            className="h-12 w-12 rounded-md bg-black/50 text-sm"
            onPointerDown={() => touchKey(code, true)}
            onPointerUp={() => touchKey(code, false)}
            onPointerLeave={() => touchKey(code, false)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="absolute right-3 bottom-24 flex flex-col gap-2 sm:hidden">
        <button
          type="button"
          className="h-12 rounded-md bg-black/50 px-3 text-sm"
          onPointerDown={() => touchKey("Space", true)}
          onPointerUp={() => touchKey("Space", false)}
        >
          Jump
        </button>
      </div>
      <p className="sr-only">
        World is {SX} by {SZ} blocks. {DROPS.length} items.
      </p>
    </div>
  );
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getZ: () => number;
      setKeys?: (codes: string[]) => void;
      setPose?: (x: number, y: number, z: number, yaw: number, pitch: number) => void;
    };
  }
}
