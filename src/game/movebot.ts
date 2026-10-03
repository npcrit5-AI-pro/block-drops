/** The only model Movebot calls. Priced at $0 on OpenRouter. No image or video payload. */
export const FREE_MOVE_MODEL = "nvidia/nemotron-3.5-lightning:free";

export type MoveScene = {
  request: string;
  playerDoing: string;
  botDoing: string;
  blockedSides: number;
  distance: number;
};

export function chooseModel(scene: MoveScene) {
  const q = scene.request.toLowerCase();
  if (/see|look|watch|video|show|camera|view/.test(q)) {
    return { why: "you asked it to look" };
  }
  if (scene.playerDoing === "fighting" || scene.playerDoing === "swimming" || scene.playerDoing === "building") {
    return { why: `you are ${scene.playerDoing}` };
  }
  if (/plan|why|careful|puzzle|think|how/.test(q) || scene.botDoing === "stuck" || scene.blockedSides >= 3) {
    return { why: scene.botDoing === "stuck" ? "it is stuck" : "the way is tight" };
  }
  if (scene.distance > 20 || scene.playerDoing === "running") {
    return { why: scene.distance > 20 ? "you are far away" : "you are moving fast" };
  }
  return { why: "open ground" };
}

export function stepToward(px: number, pz: number, bx: number, bz: number) {
  const dx = px - bx;
  const dz = pz - bz;
  if (Math.hypot(dx, dz) < 2.2) return "stay";
  if (Math.abs(dx) > Math.abs(dz)) return dx > 0 ? "east" : "west";
  return dz > 0 ? "south" : "north";
}

export async function askMovebot(key: string, state: string, scene: MoveScene, signal?: AbortSignal) {
  if (!FREE_MOVE_MODEL.endsWith(":free")) throw new Error("Movebot refused a paid model");
  const pick = chooseModel(scene);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": typeof location !== "undefined" ? location.origin : "https://localhost",
      "X-Title": "Movebot",
    },
    body: JSON.stringify({
      model: FREE_MOVE_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are Movebot in a block world. Reply with only one word: north, south, east, west, jump, or stay.",
        },
        { role: "user", content: state },
      ],
      max_tokens: 4,
      temperature: 0,
      reasoning: { enabled: false, effort: "none" },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 120) || `OpenRouter ${res.status}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const reply = data.choices?.[0]?.message?.content ?? "stay";
  const action = reply.toLowerCase().match(/north|south|east|west|jump|stay/)?.[0] ?? "stay";
  return { action, model: "Lightning", why: pick.why };
}
