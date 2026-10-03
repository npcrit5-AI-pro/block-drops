# Block Drops

**A 3D block world in your browser, with camps, caves, water, portals, an item pack, and Movebot, a robot companion.**

Block Drops is a first-person voxel game that runs entirely in the browser (React + three.js on TanStack Start). Walk around a 192 × 192 world, break and place blocks, swim from a pond down a river to the ocean, explore caves, step through portals to the Nether and the End, and fight a dragon. Movebot, a little robot, follows you around. If you give it a free OpenRouter key, it can also take simple orders from a free AI model.

---

## Features

- **Big open world:** 192 × 192 blocks, with about 48 blocks of view distance
- **Places to explore** (open the **Plan** button in-game for the full list):
  - abandoned camps with wool tents, straw beds, copper chests, and golem statues
  - a dappled grove, a sulfur cave, an ice cave, and a separate cave mouth
  - a pond that drains into a river and an ocean with a sand beach (you can swim the whole way)
  - a village with two houses and a well, and a ruined portal
  - a **trial combat** pit where you spear a breeze
  - a **Nether** portal (red cavern, lava) and an **End** portal (island, chorus plants, and a dragon)
- **Creatures:** a copper golem, a happy ghast you can ride, a nautilus, an armadillo, the breeze, and the dragon
- **Item pack:** search every item, with tabs for Blocks, Tools, Nature, Food, and Gear. Includes armor, an off-hand slot, a bundle, shelves, maps, and music discs.
- **Two modes:** Creative (hearts and food shown) and Survival (no hearts or food)
- **Movebot:** a companion that walks toward you. With an optional free OpenRouter key it can follow typed orders using `nvidia/nemotron-3.5-lightning:free` (a $0 model).
- **Keyboard + mouse, or touch:** on-screen W/A/S/D and jump buttons for phones and tablets

---

## Tutorial

### 1. What you need

- **Node.js 22.12 or newer** (TanStack Start requires it). Check with `node --version`. Get it from <https://nodejs.org/>.
- **npm** (comes with Node.js)
- A desktop browser with a mouse is best. Touch devices work for moving around.

### 2. Install

```bash
git clone https://github.com/npcrit5-AI-pro/block-drops.git
cd block-drops
npm install
```

### 3. Run

```bash
npm run dev
```

Open **<http://localhost:8080>**. Press **Ctrl + C** in the terminal to stop the server.

### 4. Start a game

The start card lets you set things up:

1. **Pick a mode:** **Creative** (hearts and food are shown) or **Survival** (no hearts and no food).
2. **OpenRouter key (optional):** paste a key that starts with `sk-or-...` if you want Movebot to use AI. Leave it empty and Movebot still follows you. See [Movebot](#7-movebot) below.
3. Click **Start** (or press **Enter**). Then **click the game view** to capture the mouse so you can look around.

### 5. Controls

| Action | Keyboard / mouse |
|---|---|
| Move | `W` `A` `S` `D` or arrow keys |
| Look around | Move the mouse (click the game first to lock the pointer) |
| Jump / swim up | `Space` |
| Sneak / walk slowly / sink in water | `Shift` |
| Break a block | Left-click |
| Place a block / use the held item | Right-click (maps, compass, clock, food, bucket, bundle, shelf, music discs, statues...) |
| Pick a hotbar slot | `1` to `9`, or the mouse wheel |
| Open / close the item pack | `E`, or the **Items** button (top-right) |
| Swap with off-hand | `F` |
| Ride / leave the happy ghast | Hold a harness, stand near the ghast, press `F` |
| Empty the bundle | `B` |
| Talk to Movebot | `M` (type an order, press **Enter** to go back to the game) |
| Release the mouse | `Esc` |

On touch screens, use the on-screen **W/A/S/D** buttons and the jump button.

### 6. Things to try

- **Get items:** press `E` (or **Items**). Search or browse the tabs (**All, Blocks, Tools, Nature, Food, Gear**) and click an item to put it in your selected hotbar slot. Clicking armor equips it instead.
- **See the map:** take a map from the pack and right-click with it. The white dot is you.
- **Find water:** the pond is northwest of where you start, and the ocean is east. `Space` swims up, `Shift` sinks.
- **Go to the Nether:** the black portal is west of the camp. Walk into it. Walk back into the portal there to come home.
- **Go to the End:** the purple portal is south of the Nether one. The dragon circles the island.
- **Trial combat:** the pit beside the pond. Spears hit from farther away and harder. When the breeze falls, a chest opens.
- **Wake a golem:** right-click a copper golem statue.
- **Grow a happy ghast:** right-click a dried ghast. Ride it with a harness and `F`.
- **Check what's in the game:** the **Plan** button (top-right) lists every feature area and where to find it.

### 7. Movebot

Movebot is the small robot that follows you in the overworld. An on-screen status line shows what it's doing (`Movebot: … · M to talk`).

- **Without a key:** Movebot simply walks toward you.
- **With an OpenRouter key:** about every 8 seconds Movebot sends a short text description of the scene (and your typed order, if any) to OpenRouter and gets back one word: north, south, east, west, jump, or stay. It only ever calls the free `nvidia/nemotron-3.5-lightning:free` model, and the code refuses to call any model that isn't `:free`.
- **Give it an order:** press `M`, type something like `follow me` or `go east`, and press **Enter**.

Get a free key at <https://openrouter.ai/keys>. The key is saved **in your browser only** (localStorage) and sent **directly from your browser to OpenRouter**. It never goes to a Block Drops server. Only use a key you're comfortable keeping in this browser.

### 8. Build for production (optional)

```bash
npm run build      # builds the app
npm run preview    # serves the build at http://127.0.0.1:8081
```

A `vercel.json` is included for deploying to [Vercel](https://vercel.com/).

---

## Configuration

Block Drops needs **no server environment variables**.

| Setting | Where | Notes |
|---|---|---|
| OpenRouter key (optional) | Start card, saved in browser `localStorage` as `movebot-openrouter` | Only used by Movebot |
| Hotbar, selected slot, armor, off-hand | Saved in browser `localStorage` as `blockdrops-v1` | |
| `VITE_AUTH_ENABLED` | `.env` (optional) | Template plumbing the game doesn't use. Set to `false` to switch it fully off. |
| `DATABASE_URL` | environment (optional) | Template build-time migrations. Skipped when unset. |

World size and view distance (`SX`, `SZ`, `VIEW`) are in `src/game/engine.ts`. The Movebot model is in `src/game/movebot.ts`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `EBADENGINE ... required: { node: '>=22.12.0' }` or the dev server won't start | Install Node.js 22.12+ and run `npm install` again. |
| `Port 8080 is already in use` | Stop the other app, or run `npx vite dev --port 3000` and open `http://localhost:3000`. |
| I can't look around | Click the game view to lock the pointer. Press `Esc` to get the mouse back. |
| Keys stop working | The Movebot box or the item pack may be open. Press **Enter** to close Movebot, or `E` / **Close** for the pack. Then click the game again. |
| Movebot shows an error | Check the key is a valid OpenRouter key (`sk-or-...`). OpenRouter's free models have rate limits, so wait a bit. Movebot keeps walking toward you either way. |
| Blocks I placed are gone after a reload | Only your hotbar, selected slot, armor, and off-hand are saved. The world itself (and the mode) resets each time the page loads. |
| It's slow | Close other heavy tabs, use a desktop browser with hardware acceleration on, or make the window smaller. |

### Developer checks

```bash
npm run typecheck   # TypeScript
npm run build       # production build
npm run lint        # ESLint (currently reports a couple of pre-existing errors)
npm test            # template tests
```

`npm test` runs the Grok Build template's own tests. About 16 of them read files from a `.grok/` folder that only exists in the Grok Build workspace (it's git-ignored), so they fail in a fresh clone. That doesn't affect the game.

---

## Project structure

```
src/
  game/GameView.tsx   # Rendering (three.js), input, HUD, start card, item pack, Movebot UI
  game/engine.ts      # Voxel world, blocks, movement physics
  game/vanilla.ts     # World generation
  game/features.ts    # Creatures and feature list (the in-game Plan)
  game/catalog.ts     # Item catalog
  game/icons.ts       # Item icons
  game/movebot.ts     # Movebot's OpenRouter call (free model only)
  routes/             # TanStack Start routes (the game is the home page)
scripts/, server/, src/lib/   # Grok Build template plumbing (dev wrapper, PWA, optional auth/db)
```
