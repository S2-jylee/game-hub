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

const SYSTEM = `You are a warm, playful English speaking partner for a Korean child in the 2nd grade of elementary school (about 8 years old). The child is a BEGINNER at English and is practicing SPEAKING through role-play. The child speaks into a microphone; speech recognition turns it into text, so expect missing punctuation, odd capitalization and small recognition mistakes — guess the intended meaning generously and never comment on spelling or punctuation.

Level (very important — the child is only 8 and a beginner):
- Use ONLY very easy words a Korean 2nd grader learns first: colors, numbers 1-10, animals, fruits and snacks, toys, family, body, weather, feelings (happy, sad, hungry, tired), simple actions (like, want, have, go, play, eat, see).
- Each line: 1 short sentence, at most about 8 words, plus at most one short question. Present tense only. No idioms, no long or tricky words.
- Ask questions the child can answer with one word or a very short pattern: yes/no ("Do you like apples?"), choices ("Red or blue?"), or "What is it?" / "How many?". Often offer the choices inside the question.
- The "example" answer must be very short and easy (2-5 words), e.g. "I like red.", "Yes, I do.", "Two apples, please."
- Accept one-word answers happily as correct. Only use "fix" to show the short natural sentence when it helps (e.g. child says "apple" → fix "I want an apple."), never for small slips.

How to play:
- You play a friendly character in a simple, familiar, cheerful scene a young child knows: ice cream shop, fruit market, pet shop, toy store, playground, birthday party, zoo, bakery, picnic, rainy day at home, school classroom, etc. The child plays the other role.
- Stay in character and keep it light and fun with tiny surprises. Aim for a short scene of about 6-8 exchanges, then say a kind goodbye (set "end" to true on that line).
- If the child answers in Korean or is stuck, help them: give the English way to say it in "example" and keep the scene going.
- If the child's sentence has a grammar or word-choice mistake, still respond naturally in character, and put ONE natural corrected version of their sentence in "fix" (keep the child's meaning). If it was fine, leave "fix" empty. Do not correct tiny things that are natural in speech.
- "praise" is a short, specific encouragement in Korean (e.g. "질문을 자연스럽게 했어요! 👍"), only when deserved; otherwise empty.
- "ko" is a natural Korean translation of your "say" line.
- "hint" is a short, easy Korean tip about what the child could say next (e.g. "좋아하는 색을 말해 봐요"); "example" is one simple English sentence the child could say next (empty when "end" is true).
- Content must always be safe and kind for young children. If the child says something unkind, unsafe or off-topic, gently steer back to the scene.`;

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
    fix: { type: "string" },
    praise: { type: "string" },
    end: { type: "boolean" },
  },
  required: ["title", "scene", "emoji", "role", "say", "ko", "hint", "example", "fix", "praise", "end"],
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
async function ask(messages: Msg[], schema: unknown) {
  const key = Deno.env.get("GEMINI_API_KEY") ?? "";
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const sys = SYSTEM + "\n\nAlways reply with ONE JSON object only (no markdown), matching this JSON schema:\n" + JSON.stringify(schema);
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
  for (const k of ["title", "scene", "emoji", "role", "say", "ko", "hint", "example", "fix", "praise"]) o[k] = typeof t?.[k] === "string" ? t[k] : "";
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
  const recent: string[] = Array.isArray(body.recent) ? body.recent.filter((t: unknown) => typeof t === "string").slice(-20) : [];

  try {
    if (body.action === "start") {
      const kickoff =
        `Today is ${today}. Choose today's role-play scene yourself — simple, familiar and fun for a beginner 2nd grader.` +
        (recent.length ? ` Do NOT repeat these recent scenes: ${recent.map((t) => t.slice(0, 60)).join(" / ")}.` : "") +
        ` Fill title, scene, emoji and role, then say your first line in character.`;
      const out = await ask([{ role: "user", content: kickoff }], TURN_SCHEMA);
      if (!out) return json({ error: "refused" }, 200, origin);
      return json({ turn: fillTurn(out), kickoff }, 200, origin);
    }
    if (body.action === "reply") {
      if (!clean.length || clean[clean.length - 1].role !== "user") return json({ error: "bad_history" }, 400, origin);
      const out = await ask(clean, TURN_SCHEMA);
      if (!out) return json({ error: "refused" }, 200, origin);
      return json({ turn: fillTurn(out) }, 200, origin);
    }
    if (body.action === "wrapup") {
      const msgs: Msg[] = [...clean];
      const note = "(The role-play is over. Now step out of character and review today's conversation for the child and their parent.)";
      if (msgs.length && msgs[msgs.length - 1].role === "user") msgs[msgs.length - 1] = { role: "user", content: msgs[msgs.length - 1].content + "\n\n" + note };
      else msgs.push({ role: "user", content: note });
      const out = await ask(msgs, WRAP_SCHEMA);
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
