// 영어놀이 회화 · AI 스피킹하기 — 비밀번호를 확인하고 Gemini 와 상황극 대화를 이어가요.
// 비밀 값은 Supabase 대시보드의 Edge Function Secrets 에만 둬요:
//   GEMINI_API_KEY : Google AI Studio 에서 만든 API 키
//   TALK_PASSWORD  : 🔑 에 넣는 비밀번호

const MODEL = "gemini-3.6-flash";
const MAX_TURNS = 40; // 한 번의 상황극에서 주고받는 최대 횟수 (사용료 안전장치)
const MAX_TEXT = 300; // 아이가 한 번에 말한 글자 수 제한
const MAX_TTS = 1500; // 브리핑 읽어 주기 글자 수 제한

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
  1: "Level 1 (very first steps): only the easiest words (colors, numbers 1-10, animals, fruits, toys, family, feelings). Lines of at most about 7 words. Simple what/which questions and choice questions (\"Red or blue?\"). Example answers of 1-4 words.",
  2: "Level 2: easy everyday words. Lines of at most about 9 words. Simple patterns: I like ~, I want ~, I have ~, I see ~, Can I ~?. Example answers of 2-6 words.",
  3: "Level 3: everyday words plus a few new ones. Lines of 1-2 short sentences. Ask what/where/how many/what color questions. Example answers of 3-7 words.",
  4: "Level 4: 1-2 sentences, present and simple past (I went, I ate). Ask why/how questions now and then. Example answers of 4-9 words.",
  5: "Level 5: natural but still child-friendly English, 1-2 sentences, present/past/future (I will ~). Encourage longer answers with because. Example answers of 5-12 words.",
};

function systemFor(level: number) {
  return `You are a warm, playful English conversation partner and teacher for a Korean elementary-school child (2nd grade, about 8 years old). Every day you run a NEW role-play situation, and the child talks to you through a microphone. Speech recognition turns the child's voice into text, so expect missing punctuation and small recognition mistakes — guess the intended meaning generously and never comment on spelling or punctuation.

Today's difficulty — follow it closely:
${LEVELS[level] ?? LEVELS[1]}
Within one scene you may get a little harder toward the end if the child is doing well, but never jump far above today's level.

During the role-play you speak ONLY ENGLISH in "say" — never Korean, never explanations in Korean, never stop to teach. Just keep the conversation flowing naturally like a real friend in the scene.

Make it a real conversation (most important):
- Do NOT ask questions that can only be answered with "yes", "no", "please" or "thank you". Prefer open questions the child can answer in their own way: What ...? Which ...? Where ...? How many ...? What do you like ...? Tell me about ... . Why ...? (At level 1 a simple choice question like "Red or blue?" is fine now and then.)
- React to what the child actually said with interest (repeat a word they used, add a small fun detail), then move the story forward with something new happening (a surprise, a problem to solve, a new person or thing, a choice to make).
- Vary your questions — never ask the same kind of question twice in a row.

When the child answers:
- If the answer fits your question and the scene (short answers are fine at low levels): set "retry" false and continue the role-play in "say".
- If the answer does not fit your question, is unclear, unrelated, or in Korean: set "retry" true and, in English only, say kindly that the answer doesn't seem to fit and ask again, e.g. "Hmm, I don't think that answers my question. Can you answer one more time?" then repeat your question in simpler words. Do not move the story forward.
- If you already used "retry" on the same question once, do not ask a third time: say in English "You can say, '...'." with a simple good answer, set "retry" false, and continue.

Role-play rules:
- You play a friendly character in a simple, familiar, cheerful scene a young child knows (ice cream shop, fruit market, pet shop, toy store, playground, birthday party, zoo, bakery, picnic, rainy day at home, classroom, doctor, bus, beach, space trip, camping, etc.). The child plays the other role.
- Keep "say" short for today's level and end each line with ONE clear question.
- Aim for about 10-12 exchanges, then say a kind goodbye (set "end" to true on that line).
- "ko" is a natural Korean translation of your "say" line (shown only if the child taps a button; it is never spoken).
- "example" is one natural English sentence the child could say next (matching today's level, and not just "Yes, please"); "example_ko" is its Korean meaning. Both empty when "end" is true.
- Content must always be safe and kind for young children. If the child says something unkind, unsafe or off-topic, gently steer back to the scene.`;
}

const TURN_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Korean title of today's scene (start only, else empty)" },
    scene: { type: "string", description: "1-2 Korean sentences telling the child the situation and who they are (start only, else empty)" },
    emoji: { type: "string", description: "one emoji for your character (start only, else empty)" },
    role: { type: "string", description: "your character's short English name, e.g. Zookeeper Sam (start only, else empty)" },
    say: { type: "string", description: "your line, English only" },
    ko: { type: "string", description: "Korean translation of say" },
    example: { type: "string", description: "an English sentence the child could say next" },
    example_ko: { type: "string", description: "Korean meaning of example" },
    retry: { type: "boolean", description: "true when the child's answer did not fit and you are asking again" },
    end: { type: "boolean" },
  },
  required: ["title", "scene", "emoji", "role", "say", "ko", "example", "example_ko", "retry", "end"],
  additionalProperties: false,
};

const WRAP_SCHEMA = {
  type: "object",
  properties: {
    briefing: { type: "string", description: "teacher-mode spoken briefing in Korean (see instructions)" },
    phrases: {
      type: "array",
      description: "3-4 useful English expressions from today's conversation",
      items: {
        type: "object",
        properties: { en: { type: "string" }, ko: { type: "string" } },
        required: ["en", "ko"],
        additionalProperties: false,
      },
    },
    fixes: {
      type: "array",
      description: "up to 3 moments where the child's answer did not fit: what the child said, a better English answer, and its Korean meaning",
      items: {
        type: "object",
        properties: { said: { type: "string" }, better: { type: "string" }, ko: { type: "string" } },
        required: ["said", "better", "ko"],
        additionalProperties: false,
      },
    },
  },
  required: ["briefing", "phrases", "fixes"],
  additionalProperties: false,
};

const WRAP_NOTE = `(The role-play is over. Now step out of character and become the child's kind TEACHER. Write "briefing": a spoken briefing in natural, warm Korean for an 8-year-old, about 6-9 short sentences, that will be read aloud by a voice. Recap what happened in today's conversation, praise one or two specific things the child said well, then go over the moments where the child's answer did not fit (say the better English sentence, then what it means in Korean), teach the 2-3 most useful expressions from today, and finish with an encouraging line. English sentences may appear inside the Korean. Plain sentences only: no emojis, no lists, no markdown. Also fill "phrases" and "fixes" (fixes may be empty if every answer fit).)`;

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
  // 모델이 바쁘면(503 · 429) 잠깐 기다렸다 한 번 더, 그래도 안 되면 다른 flash 모델로 바꿔서 물어봐요
  const models = [MODEL, ...(await textModels(key)).filter((m) => m !== MODEL)].slice(0, 4);
  let mi = 0, busyTries = 0;
  for (let vi = 0; vi < variants.length;) {
    const generationConfig = variants[vi];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${models[mi]}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents, generationConfig }),
    });
    if (res.status === 400) { lastErr = await res.text(); console.warn("gemini 400, retrying simpler config:", lastErr.slice(0, 300)); vi++; continue; }
    if (res.status === 429 || res.status === 503 || res.status === 500) {
      console.warn("gemini busy", models[mi], res.status);
      busyTries++;
      if (busyTries % 2 === 1) { await new Promise((r) => setTimeout(r, 1200)); continue; }
      if (mi + 1 < models.length) { mi++; continue; }
      throw Object.assign(new Error("busy"), { status: 429 });
    }
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
  for (const k of ["title", "scene", "emoji", "role", "say", "ko", "example", "example_ko"]) o[k] = typeof t?.[k] === "string" ? t[k] : "";
  o.retry = t?.retry === true;
  o.end = t?.end === true;
  return o;
}

// ---- 브리핑 읽어 주기: Gemini 음성(TTS) — Gemini 실시간 대화와 같은 목소리 모음이에요 ----
const VOICE = "Aoede";
let allModels: string[] | null = null;
async function listModels(key: string) {
  if (allModels) return allModels;
  const found: string[] = [];
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", { headers: { "x-goog-api-key": key } });
    const data = await res.json();
    for (const m of data.models ?? []) {
      if ((m.supportedGenerationMethods ?? []).includes("generateContent")) found.push(String(m.name ?? "").replace(/^models\//, ""));
    }
  } catch (e) { console.warn("list models failed", e); }
  if (found.length) allModels = found;
  return found;
}
// 숫자가 큰(새) 모델 먼저
const ver = (n: string) => parseFloat((n.match(/(\d+(?:\.\d+)?)/) ?? ["0", "0"])[1]);
// 대화용 예비 모델: gemini-숫자-flash / flash-lite (음성 · 그림 · 실시간 모델은 빼요)
async function textModels(key: string) {
  const list = (await listModels(key)).filter((n) => /^gemini-\d+(\.\d+)?-flash(-lite)?(-preview)?$/.test(n));
  list.sort((a, b) => (Number(/lite/.test(a)) - Number(/lite/.test(b))) || (ver(b) - ver(a)));
  return list;
}
let ttsModels: string[] | null = null;
async function listTtsModels(key: string) {
  if (ttsModels) return ttsModels;
  const found = (await listModels(key)).filter((n) => /tts/i.test(n));
  // flash 먼저, 새 모델 먼저
  found.sort((a, b) => (Number(/flash/.test(b)) - Number(/flash/.test(a))) || (ver(b) - ver(a)));
  if (!found.length) return ["gemini-2.5-flash-preview-tts"];
  ttsModels = found;
  console.log("tts models", ttsModels.join(", "));
  return ttsModels;
}
async function tts(text: string) {
  const key = Deno.env.get("GEMINI_API_KEY") ?? "";
  const prompt = "다정하고 밝은 초등학교 선생님처럼, 아이에게 말하듯 천천히 또박또박 읽어 주세요. 영어 문장은 원어민 발음으로 읽어 주세요:\n" + text;
  for (const model of await listTtsModels(key)) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
      }),
    });
    if (!res.ok) { console.warn("tts", model, res.status, (await res.text()).slice(0, 300)); continue; }
    const data = await res.json();
    const part = (data.candidates?.[0]?.content?.parts ?? []).find((p: any) => p.inlineData?.data);
    if (part) return { audio: part.inlineData.data, mime: part.inlineData.mimeType ?? "audio/L16;rate=24000", model };
  }
  return null;
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
      if (msgs.length && msgs[msgs.length - 1].role === "user") msgs[msgs.length - 1] = { role: "user", content: msgs[msgs.length - 1].content + "\n\n" + WRAP_NOTE };
      else msgs.push({ role: "user", content: WRAP_NOTE });
      const out = await ask(msgs, WRAP_SCHEMA, level);
      if (!out) return json({ error: "refused" }, 200, origin);
      return json({ wrap: out }, 200, origin);
    }
    if (body.action === "tts") {
      const text = typeof body.text === "string" ? body.text.slice(0, MAX_TTS) : "";
      if (!text) return json({ error: "bad_text" }, 400, origin);
      const audio = await tts(text);
      if (!audio) return json({ error: "tts_error" }, 502, origin);
      return json(audio, 200, origin);
    }
    return json({ error: "bad_action" }, 400, origin);
  } catch (e) {
    console.error(e);
    const status = (e as any)?.status;
    return json({ error: status === 429 ? "busy" : "ai_error" }, 502, origin);
  }
});
