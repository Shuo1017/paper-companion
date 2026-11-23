/* 用户自带 API Key 的 AI 客户端 —— OpenAI 兼容协议（DeepSeek / 通义 / Moonshot / OpenAI / 自定义）。
 * 密钥只存在本机浏览器 localStorage，不上传、不经过任何第三方中转。
 * 所有 prompt 复用自原项目的 functions/prompts.mjs（已内嵌于此，保持质量不变）。 */

import { readSSE } from "@/lib/sse";
import type { MindNode, Term } from "@/lib/types";

export interface FeynmanMessage {
  role: "user" | "assistant";
  content: string;
}
export type Verdict = "solid" | "shaky" | "parrot";
export interface ReportItem {
  point: string;
  verdict: Verdict;
  comment: string;
  quote?: string;
  reread?: string;
}
export interface FeynmanReport {
  overall: string;
  score: number;
  paraphraseRate?: number;
  items: ReportItem[];
}
export interface SentenceBreakdown {
  human: string;
  role: string;
  terms: Term[];
}

/* ---- 配置 ---- */
export interface AiConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}
export const PROVIDERS: Record<string, { label: string; baseUrl: string; model: string; note: string }> = {
  deepseek: { label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat", note: "便宜、中文好，推荐" },
  dashscope: { label: "通义千问", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus", note: "阿里，国内稳定" },
  moonshot: { label: "Moonshot (Kimi)", baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k", note: "长文本" },
  openai: { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini", note: "需海外网络" },
  custom: { label: "自定义", baseUrl: "", model: "", note: "任何 OpenAI 兼容端点" },
};

const KEY = "paper-companion-ai-config";
export function loadConfig(): AiConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as AiConfig;
    return c?.apiKey && c?.baseUrl && c?.model ? c : null;
  } catch { return null; }
}
export function saveConfig(c: AiConfig) { localStorage.setItem(KEY, JSON.stringify(c)); }
export function clearConfig() { localStorage.removeItem(KEY); }
export function hasConfig() { return !!loadConfig(); }

/* ---- prompts（来自原 functions/prompts.mjs + config.mjs，逐字保留） ---- */
const LEVEL_GUIDE = [
  "小学生：用打比方和生活例子，完全避开专业术语，像给十岁孩子讲。",
  "高中生：用已学过的数理化常识解释，可以出现少量但必须立刻解释的术语。",
  "本科生：用专业课基础解释，允许出现术语但要给出直觉理解。",
  "研究生：准确描述方法机制与动机，可以讨论适用条件与局限。",
  "审稿人：均以学术标准审视，指出贡献、证据强度与潜在漏洞。",
];
const MAX_HISTORY_MESSAGES = 24, MAX_MESSAGE_CHARS = 2000;
function formatHistory(history: FeynmanMessage[]) {
  const lines: string[] = [];
  for (const m of history.slice(-MAX_HISTORY_MESSAGES)) {
    const who = m.role === "user" ? "学生" : "小通";
    lines.push(`${who}：${String(m.content ?? "").slice(0, MAX_MESSAGE_CHARS)}`);
  }
  return lines.join("\n");
}
function buildTranslatePrompt(text: string, level: number) {
  return `请把下面这句学术论文原文，改写成对应档位的人话版。
档位要求：${LEVEL_GUIDE[level] ?? LEVEL_GUIDE[2]}
输出规则：只输出改写后的中文句子本身，不要任何解释、前缀、引号或标题。
原文：${text}`;
}
function buildExplainPrompt(text: string, level: number, context: string) {
  const ctx = context?.trim() ? `\n这句所在的章节大意（仅作背景，不要照抄）：${context.trim().slice(0, 400)}` : "";
  return `你在帮科研新手读懂一篇英文学术论文里的一句话。请给出这句的「红笔拆解」。
档位要求（人话版按此档写）：${LEVEL_GUIDE[level] ?? LEVEL_GUIDE[2]}${ctx}

要求：
- human：把原文这句改写成上面档位能听懂的大白话，忠实原意，不编造。
- role：用一句话说明这句话在论文里的作用。
- terms：只挑这句里真正影响理解的 0~5 个关键术语，每个用大白话解释；没有值得解释的术语就给空数组，不要硬凑。
- 不要翻译无关内容，也不要输出论文里没有的信息。

请只输出一个合法 JSON 对象，不要 markdown 代码块、不要任何额外文字。格式严格如下：
{
  "human": "当前档位的人话版：把这句话说给这个档位的人听",
  "role": "这句话在这篇论文里起什么作用（如：提出方法/给出动机/摆出证据/下结论），一句话",
  "terms": [
    { "term": "术语中文名", "en": "English term", "explain": "用大白话解释这个术语在这句话里的意思" }
  ]
}
原文这句：
${text}`;
}
function buildFeynmanPrompt(history: FeynmanMessage[], paperTitle: string, sectionTitle: string) {
  return `你正在担任费曼考官，听一位刚进实验室的本科生讲解论文《${paperTitle}》的「${sectionTitle}」部分。
目前的对话历史（学生是讲解者，小通是你之前的追问）：
${formatHistory(history)}

请以小通的身份给出这一轮回应：
- 如果学生还没讲清关键机制，用苏格拉底式追问引导他，一次只问一个最关键的问题。
- 追问聚焦「为什么」「如果不成立会怎样」「证据在哪」，逼出真理解，而不是术语复述。
- 语气友好鼓励；如果学生已经讲得很到位，肯定他并提示可以点「生成体检报告」。
- 用中文，简洁口语化，只输出你这一轮的回应，不要复述整段历史。
- 用纯文本作答，不要使用 Markdown 加粗（**）、标题（#）、列表（-）等符号；要强调某个问题就用中文引号「」把它括起来。`;
}
function buildReportPrompt(history: FeynmanMessage[], paperTitle: string, sectionTitle: string) {
  return `根据下面这位本科生讲解论文《${paperTitle}》「${sectionTitle}」的对话，生成一份「理解度体检报告」，判断他是真懂还是在鹦鹉学舌。这份报告的核心是「证据」：每个判定都要逐字摘录学生自己说过的话作为依据，不能空口下结论。
对话历史：
${formatHistory(history)}

请只输出一个合法 JSON 对象，不要 markdown 代码块、不要任何额外文字。格式严格如下：
{
  "overall": "一句总评：整体理解如何，最该补哪里",
  "score": 72,
  "paraphraseRate": 45,
  "items": [
    { "point": "核心想法的大白话转述", "verdict": "solid", "quote": "学生自己的原话逐字摘录（一段最关键的话）", "comment": "依据这句原话为什么这么判", "reread": "可选：回读建议" },
    { "point": "关键机制的因果链", "verdict": "shaky", "quote": "…", "comment": "…", "reread": "…" },
    { "point": "术语的使用", "verdict": "parrot", "quote": "…", "comment": "…", "reread": "…" }
  ]
}
字段约束：
- overall：一句中文总评。
- score：0 到 100 的整数，代表真实理解度。
- paraphraseRate：0 到 100 的整数，「复述率」——学生的讲解里有多大比例是在背原文句式、堆术语名词，而不是用自己的话讲清因果。越高越像鹦鹉学舌，越低说明越内化。请基于对话里学生的实际用词估算。
- items：3 个左右关键理解点。
  - verdict 只能是 "solid"（真懂）、"shaky"（半懂）、"parrot"（鹦鹉学舌）之一。
  - quote 必须是学生原话的逐字摘录（从上面对话里直接摘，不要改写、不要编造学生没说的话），选最能支撑该判定的那一句。
  - comment 要紧扣 quote 里的证据说明判断依据。
  - reread 可选，给具体回读建议。
- 只依据对话里出现过的内容判断，不臆造学生没说过的话；对话里没有某方面内容时，就如实说信息不足。
- 讲解轮数太少时，如实说明样本不足，score 偏低、paraphraseRate 谨慎给值，不要硬夸。`;
}
function buildMindmapPrompt(text: string) {
  return `请把下面这篇学术论文的正文，整理成一张「论证脉络思维导图」，帮科研新手一眼看清全文骨架。
要求：
- 中心节点（kind=root）用一句话说清这篇论文的核心主张。
- 第二层（kind=section）按论文行文顺序分成几个部分/章节，每个配一句「它在全文的作用」。
- 第三层（kind=point）列出该部分最关键的 1~3 个论点，用大白话，不要堆术语。
- 第四层（kind=term，可选）挂上该论点涉及的关键术语，并用一句话解释。
- 忠实于原文，不编造原文没有的结论或数字；正文很短时宁可节点少而准，不要硬凑。
- 最多四层（root→section→point→term），每个节点的子节点不超过 6 个。
请只输出一个合法 JSON 对象，不要 markdown 代码块、不要任何额外文字。格式严格如下：
{
  "id": "root",
  "label": "论文核心主张（一句话）",
  "detail": "可选：用大白话补充这篇到底想解决什么",
  "kind": "root",
  "children": [
    { "id": "s1", "label": "第一部分/章节名", "detail": "可选：这部分在全文的作用", "kind": "section",
      "children": [ { "id": "p1", "label": "该部分最关键的一个论点（大白话）", "kind": "point",
        "children": [ { "id": "t1", "label": "关键术语", "detail": "一句话解释", "kind": "term" } ] } ] }
  ]
}
论文正文：
${text}`;
}

/* ---- 请求层 ---- */
function endpoint(c: AiConfig) {
  return c.baseUrl.replace(/\/+$/, "") + "/chat/completions";
}
function friendlyError(status: number, body: string): Error {
  let hint = "";
  try {
    const j = JSON.parse(body);
    hint = j?.error?.message || j?.message || "";
  } catch { /* 原样兜底 */ }
  const map: Record<number, string> = {
    401: "API Key 无效或已过期，请到设置里检查。",
    403: "没有权限访问该模型，请检查 Key 的权限或更换模型。",
    404: "接口地址或模型名不对，请到设置里检查。",
    429: "请求太频繁或额度不足，稍后再试。",
    500: "模型服务暂时故障，请稍后重试。",
  };
  return new Error(map[status] || hint.slice(0, 160) || `请求失败（HTTP ${status}）`);
}
function requireConfig(): AiConfig {
  const c = loadConfig();
  if (!c) throw new Error("还没配置 AI。请点右上角「AI 设置」填入你的 API Key。");
  return c;
}

/** 流式文本（translate / feynman）。onDelta 收到累计文本。 */
async function streamText(
  prompt: string,
  onDelta?: (accumulated: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const c = requireConfig();
  const res = await fetch(endpoint(c), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.apiKey}` },
    body: JSON.stringify({
      model: c.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      stream: true,
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw friendlyError(res.status, body);
  }
  let acc = "";
  for await (const frame of readSSE(res.body, { signal })) {
    if (!frame.data || frame.data === "[DONE]") continue;
    let msg: { choices?: { delta?: { content?: string } }[] };
    try { msg = JSON.parse(frame.data); } catch { continue; }
    const delta = msg?.choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta) {
      acc += delta;
      onDelta?.(acc);
    }
  }
  if (!acc.trim()) throw new Error("模型没有返回内容，请重试或换个模型。");
  return acc;
}

/** 非流式 JSON（explain / report / mindmap），带 markdown 代码块清洗。 */
async function askJson<T>(prompt: string): Promise<T> {
  const c = requireConfig();
  const res = await fetch(endpoint(c), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.apiKey}` },
    body: JSON.stringify({
      model: c.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });
  const body = await res.text().catch(() => "");
  if (!res.ok) throw friendlyError(res.status, body);
  let content = "";
  try {
    const j = JSON.parse(body);
    content = String(j?.choices?.[0]?.message?.content ?? "");
  } catch { throw new Error("模型返回格式异常，请重试。"); }
  // 清洗 ```json ... ```
  content = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = content.indexOf("{"), end = content.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("模型没有返回有效 JSON，请重试或换个模型。");
  try { return JSON.parse(content.slice(start, end + 1)) as T; }
  catch { throw new Error("模型返回的 JSON 不完整，请重试或换个模型。"); }
}

/* ---- 对外 API（与旧 lib/ai.ts 同签名，组件不用改） ---- */
export async function generateTranslation(text: string, level: number, _levelName: string, onDelta?: (s: string) => void) {
  return streamText(buildTranslatePrompt(text, level), onDelta);
}

export async function explainSentence(text: string, level: number, _levelName: string, context = "", signal?: AbortSignal): Promise<SentenceBreakdown> {
  const c = requireConfig();
  const res = await fetch(endpoint(c), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.apiKey}` },
    body: JSON.stringify({
      model: c.model,
      messages: [{ role: "user", content: buildExplainPrompt(text, level, context) }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
    signal,
  });
  const raw = await res.text().catch(() => "");
  if (!res.ok) throw friendlyError(res.status, raw);
  let content = "";
  try { content = String(JSON.parse(raw)?.choices?.[0]?.message?.content ?? ""); }
  catch { throw new Error("模型返回格式异常，请重试。"); }
  content = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const s = content.indexOf("{"), e = content.lastIndexOf("}");
  let b: { human?: string; role?: string; terms?: Term[] } = {};
  try { b = JSON.parse(content.slice(s, e + 1)); } catch { throw new Error("拆解格式异常，请重试。"); }
  return {
    human: String(b.human ?? ""),
    role: String(b.role ?? ""),
    terms: Array.isArray(b.terms) ? b.terms.slice(0, 5) : [],
  };
}

export function feynmanReply(history: FeynmanMessage[], paperTitle: string, sectionTitle: string, onDelta?: (s: string) => void) {
  return streamText(buildFeynmanPrompt(history, paperTitle, sectionTitle), onDelta);
}

export async function generateReport(history: FeynmanMessage[], paperTitle: string, sectionTitle: string): Promise<FeynmanReport> {
  const obj = await askJson<Record<string, unknown>>(buildReportPrompt(history, paperTitle, sectionTitle));
  const allowed = new Set(["solid", "shaky", "parrot"]);
  const items = (Array.isArray(obj.items) ? obj.items : []).slice(0, 6).map((it: Record<string, unknown>) => ({
    point: String(it?.point ?? "").slice(0, 120),
    verdict: (allowed.has(String(it?.verdict)) ? it.verdict : "shaky") as Verdict,
    comment: String(it?.comment ?? "").slice(0, 400),
    ...(typeof it?.quote === "string" && it.quote.trim() ? { quote: String(it.quote).replace(/\s+/g, " ").trim().slice(0, 300) } : {}),
    ...(typeof it?.reread === "string" && it.reread ? { reread: String(it.reread).slice(0, 300) } : {}),
  })).filter((it: { point: string }) => it.point);
  const score = Number(obj.score);
  const rate = Number(obj.paraphraseRate);
  return {
    overall: String(obj.overall ?? "").slice(0, 400),
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50,
    ...(Number.isFinite(rate) ? { paraphraseRate: Math.max(0, Math.min(100, Math.round(rate))) } : {}),
    items,
  };
}

export async function generateMindMap(text: string): Promise<MindNode> {
  const obj = await askJson<MindNode>(buildMindmapPrompt(text.slice(0, 20000)));
  if (!obj || typeof obj.label !== "string") throw new Error("思维导图格式异常，请重试。");
  // 截断过深/过宽的树，防止渲染爆炸
  const clip = (n: MindNode, depth: number): MindNode => ({
    ...n,
    label: String(n.label ?? "").slice(0, 120),
    detail: n.detail ? String(n.detail).slice(0, 300) : undefined,
    children: depth >= 3 ? [] : (Array.isArray(n.children) ? n.children.slice(0, 6).map((c) => clip(c, depth + 1)) : []),
  });
  return clip(obj, 0);
}

/** 设置面板的「测试连接」。 */
export async function testConnection(c: AiConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(endpoint(c), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.apiKey}` },
      body: JSON.stringify({ model: c.model, messages: [{ role: "user", content: "只回复两个字：可用" }], temperature: 0, max_tokens: 10 }),
    });
    if (!res.ok) { const body = await res.text().catch(() => ""); throw friendlyError(res.status, body); }
    const j = await res.json();
    const text = String(j?.choices?.[0]?.message?.content ?? "").trim();
    return { ok: true, message: `连接成功${text ? ` · 模型回复：${text.slice(0, 30)}` : ""}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "连接失败" };
  }
}
