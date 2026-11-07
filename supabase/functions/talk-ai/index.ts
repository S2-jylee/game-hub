// 영어놀이 회화 · AI 스피킹하기 — 비밀번호를 확인하고 Gemini 와 상황극 대화를 이어가요.
// 비밀 값은 Supabase 대시보드의 Edge Function Secrets 에만 둬요:
//   GEMINI_API_KEY : Google AI Studio 에서 만든 API 키
//   TALK_PASSWORD  : 🔑 에 넣는 비밀번호

const MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_TURNS = 40; // 한 번의 상황극에서 주고받는 최대 횟수 (사용료 안전장치)
const MAX_TEXT = 300; // 아이가 한 번에 말한 글자 수 제한

const ALLOWED_ORIGINS = ["https://s2-jylee.github.io", "http://localhost:8765", "http://127.0.0.1:8765"];

function cors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8" },
  });
}

// 길이가 달라도 시간 차이로 비밀번호를 짐작하기 어렵게 비교해요
function sameText(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

// 난이도: 상황극을 할수록 1 → 5 로 조금씩 올라가요 (화면에서 끝낸 상황극 수로 정해서 보내요)
const LEVELS: Record<number, string> = {
  1: "Level 1 (very first steps): only the easiest words (colors, numbers 1-10, animals, fruits, toys, family, feelings). Lines of at most about 6 words. Mostly yes/no and choice questions (\"Red or blue?\"). Example answers of 1-4 words.",
  2: "Level 2: easy everyday words. Lines of at most about 8 words. Simple patterns: I like ~, I want ~, I have ~, Can I ~?. Example answers of 2-5 words.",
  3: "Level 3: everyday words plus a few new ones (explain new words in Korean in \"hint\"). Lines of 1-2 short sentences. Ask simple what/where/how many questions. Example answers of 3-7 words.",
  4: "Level 4: 1-2 sentences, present and simple past (I went, I ate). Ask why/how questions now and then. Example answers of 4-9 words.",
  5: "Level 5: natural but still child-friendly English, 1-2 sentences, present/past/future (I will ~). Encourage longer answers with because. Example answers of 5-12 words.",
};

function systemFor(level: number) {
  return `You are a kind English TEACHER for a Korean elementary-school child (2nd grade, about 8 years old). Every day you run a NEW short role-play situation, and the child talks to you through a microphone. You teach by mixing Korean and English: the role-play itself is in English, and your explanations and help are in Korean. Speech recognition turns the child's voice into text, so expect missing punctuation and small recognition mistakes — guess the intended meaning generously and never comment on spelling or punctuation.

Today's difficulty — follow it closely:
${LEVELS[level] ?? LEVELS[1]}
Within one scene you may get a tiny bit harder toward the end if the child is doing well, but never jump far above today's level.

How to answer each time the child speaks (most important):
- If the child's answer is suitable (it fits the scene and is understandable English — short or one-word answers are fine at low levels): leave "fix" and "fix_ko" empty and simply continue the role-play in English in "say".
- If the child's answer is wrong, unsuitable for the situation, unclear, or in Korean: put the correct English sentence the child should have said in "fix", and in "fix_ko" say that same sentence again in Korean (a short, friendly Korean explanation, e.g. "'I want an apple.' 는 '사과 주세요.' 라는 뜻이에요. 따라 말해 볼까요?"). Then continue the role-play in English in "say" (it is fine to gently ask again).
- "praise" is a short, specific encouragement in Korean when the child did well; otherwise empty.

Role-play rules:
- You play a friendly character in a simple, familiar, cheerful scene a young child knows (ice cream shop, fruit market, pet shop, toy store, playground, birthday party, zoo, bakery, picnic, rainy day at home, classroom, doctor, bus, beach, etc.). The child plays the other role.
- Keep "say" short for today's level and end most lines with an easy question so the child knows what to say next.
- Aim for about 6-8 exchanges, then say a kind goodbye (set "end" to true on that line).
- "ko" is a natural Korean translation of your "say" line.
- "hint" is a short, easy Korean tip about what the child could say next; "example" is one English sentence the child could say next, matching today's level (empty when "end" is true).
- Content must always be safe and kind for young children. If the child says something unkind, unsafe or off-topic, gently steer back to the scene.`;
}

const TURN_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Korean title of today's scene (start only, else empty)" },
    scene: { type: "string", description: "1-2 Korean sentences telling the child the situation and who they are (start only, else empty)" },
    emoji: { type: "string", description: "one emoji for your character (start only, else empty)" },
    role: { type: "string", description: "your character's short English name, e.g. Zookeeper Sam (start only, else empty)" },
    say: { type: "string" },
    ko: { type: "string" },
    hint: { type: "string" },
    example: { type: "string" },
    fix: { type: "string", description: "correct English sentence when the child's answer was wrong/unsuitable, else empty" },
    fix_ko: { type: "string", description: "the same correct sentence said again in Korean (friendly explanation), else empty" },
    praise: { type: "string" },
    end: { type: "boolean" },
  },
  required: ["title", "scene", "emoji", "role", "say", "ko", "hint", "example", "fix", "fix_ko", "praise", "end"],
  additionalProperties: false,
};

const WRAP_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2-3 warm, easy Korean sentences for an 8-year-old about how they did today" },
    phrases: {
      type: "array",
      description: "3-4 short, easy English expressions (2-6 words) from today's scene",
      items: {
        type: "object",
        properties: { en: { type: "string" }, ko: { type: "string" } },
        required: ["en", "ko"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "phrases"],
  additionalProperties: false,
};

type Msg = { role: "user" | "assistant"; content: string };

// 답은 꼭 JSON 하나로: 스키마를 지시문에도 적어 두고, 지원되는 설정(JSON 스키마 · 생각 줄이기)도 같이 보내요.
// 혹시 설정 이름이 바뀌어 400 이 나면, 그 설정을 빼고 다시 시도해요.
async function ask(messages: Msg[], schema: unknown, level: number) {
  const key = Deno.env.get("GEMINI_API_KEY") ?? "";
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const sys = systemFor(level) + "\n\nAlways reply with ONE JSON object only (no markdown), matching this JSON schema:\n" + JSON.stringify(schema);
  const variants = [
    { responseMimeType: "application/json", responseJsonSchema: schema, thinkingConfig: { thinkingLevel: "LOW" } },
    { responseMimeType: "application/json", responseJsonSchema: schema },
    { responseMimeType: "application/json" },
  ];
  let lastErr = "";
  for (const generationConfig of variants) {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents, generationConfig }),
    });
    if (res.status === 400) { lastErr = await res.text(); console.warn("gemini 400, retrying simpler config:", lastErr.slice(0, 300)); continue; }
    if (res.status === 429) throw Object.assign(new Error("rate"), { status: 429 });
    if (!res.ok) throw Object.assign(new Error("gemini " + res.status + " " + (await res.text()).slice(0, 300)), { status: res.status });
    const data = await res.json();
    if (data.promptFeedback?.blockReason) return null;
    const cand = data.candidates?.[0];
    if (!cand || ["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(cand.finishReason)) return null;
    const text = (cand.content?.parts ?? []).filter((p: any) => typeof p.text === "string" && !p.thought).map((p: any) => p.text).join("");
    const m = text.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : text);
  }
  throw new Error("gemini 400: " + lastErr.slice(0, 300));
}

function fillTurn(t: any) {
  // 빠진 칸이 있어도 화면이 깨지지 않게 기본값을 채워요
  const o: any = {};
  for (const k of ["title", "scene", "emoji", "role", "say", "ko", "hint", "example", "fix", "fix_ko", "praise"]) o[k] = typeof t?.[k] === "string" ? t[k] : "";
  o.end = t?.end === true;
  return o;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "method" }, 405, origin);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400, origin); }

  const password = Deno.env.get("TALK_PASSWORD") ?? "";
  if (!password || typeof body.password !== "string" || !sameText(body.password, password)) {
    await new Promise((r) => setTimeout(r, 600)); // 마구 넣어 보기 어렵게 조금 기다려요
    return json({ error: "wrong_password" }, 401, origin);
  }
  if (body.action === "verify") return json({ ok: true }, 200, origin);
  if (!Deno.env.get("GEMINI_API_KEY")) return json({ error: "no_api_key" }, 500, origin);

  // 대화 기록: 아이가 말한 것(user) / AI 가 한 말(assistant, JSON 그대로) 을 번갈아 받아요
  const history: Msg[] = Array.isArray(body.history) ? body.history : [];
  const clean = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, m.role === "user" ? MAX_TEXT : 2000) }));
  if (clean.length > MAX_TURNS * 2) return json({ error: "too_long" }, 400, origin);

  const today = typeof body.date === "string" ? body.date.slice(0, 20) : "";
  const level = Math.max(1, Math.min(5, Math.round(Number(body.level) || 1)));
  const recent: string[] = Array.isArray(body.recent) ? body.recent.filter((t: unknown) => typeof t === "string").slice(-20) : [];

  try {
    if (body.action === "start") {
      const kickoff =
        `Today is ${today}. Choose today's role-play scene yourself — simple, familiar and fun, at today's level.` +
        (recent.length ? ` Do NOT repeat these recent scenes: ${recent.map((t) => t.slice(0, 60)).join(" / ")}.` : "") +
        ` Fill title, scene, emoji and role, then say your first line in character.`;
      const out = await ask([{ role: "user", content: kickoff }], TURN_SCHEMA, level);
      if (!out) return json({ error: "refused" }, 200, origin);
      return json({ turn: fillTurn(out), kickoff }, 200, origin);
    }
    if (body.action === "reply") {
      if (!clean.length || clean[clean.length - 1].role !== "user") return json({ error: "bad_history" }, 400, origin);
      const out = await ask(clean, TURN_SCHEMA, level);
      if (!out) return json({ error: "refused" }, 200, origin);
      return json({ turn: fillTurn(out) }, 200, origin);
    }
    if (body.action === "wrapup") {
      const msgs: Msg[] = [...clean];
      const note = "(The role-play is over. Now step out of character and review today's conversation for the child and their parent.)";
      if (msgs.length && msgs[msgs.length - 1].role === "user") msgs[msgs.length - 1] = { role: "user", content: msgs[msgs.length - 1].content + "\n\n" + note };
      else msgs.push({ role: "user", content: note });
      const out = await ask(msgs, WRAP_SCHEMA, level);
      if (!out) return json({ error: "refused" }, 200, origin);
      return json({ wrap: out }, 200, origin);
    }
    return json({ error: "bad_action" }, 400, origin);
  } catch (e) {
    console.error(e);
    const status = (e as any)?.status;
    return json({ error: status === 429 ? "busy" : "ai_error" }, 502, origin);
  }
});
