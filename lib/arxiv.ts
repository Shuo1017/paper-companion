/**
 * 论文元数据与全文客户端 —— 纯浏览器直连，零后端、零密钥。
 * - 检索：OpenAlex API（CORS 开放，覆盖 arXiv / DOI / 期刊论文）
 * - 全文：arxiv.org/html/{id}（CORS 开放），无 HTML 版时降级为摘要精读
 * - 离线/被墙兜底：内置精选清单（LIBRARY）
 * 对外接口与旧版一致：fetchByIds / searchArxiv / fetchPaperBody。
 */
import { LIBRARY, type LibraryEntry } from "@/data/library";

export interface ArxivRecord {
  arxivId: string;
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  year: number;
  primaryCategory: string;
  categories: string[];
  absUrl: string;
  pdfUrl: string;
}
export type ArxivSource = "arxiv" | "demo";
export interface ArxivResult {
  records: ArxivRecord[];
  source: ArxivSource;
  degraded?: boolean;
}
export interface ArxivBodyBlock { heading?: string; text?: string; }
export interface ArxivBody {
  blocks: ArxivBodyBlock[];
  degraded: boolean;
  versioned?: string;
  source: ArxivSource;
}

const OA = "https://api.openalex.org/works";
const TIMEOUT = 12000;

function recordFromCurated(e: LibraryEntry): ArxivRecord {
  const base = e.arxiv
    ? (e.arxiv.match(/arxiv\.org\/abs\/([^/?#]+)$/i)?.[1] ?? e.id)
    : e.id;
  return {
    arxivId: base, id: base, title: e.title, authors: [e.authors],
    summary: e.blurb, published: `${e.year}-01-01T00:00:00Z`, year: e.year,
    primaryCategory: "", categories: [],
    absUrl: e.arxiv ?? `https://arxiv.org/abs/${base}`,
    pdfUrl: e.pdf ?? `https://arxiv.org/pdf/${base}`,
  };
}

/* ---- OpenAlex ---- */
interface OAWork {
  id?: string; title?: string; display_name?: string;
  publication_year?: number; publication_date?: string;
  abstract_inverted_index?: Record<string, number[]>;
  primary_location?: { landing_page_url?: string; pdf_url?: string; source?: { display_name?: string } };
  ids?: { doi?: string; arxiv?: string };
  primary_topic?: { field?: { display_name?: string }; subfield?: { display_name?: string } };
  keywords?: { display_name?: string }[];
}
function abstractText(w: OAWork): string {
  const inv = w.abstract_inverted_index;
  if (!inv) return "";
  const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(inv)) for (const p of positions) words.push([p, word]);
  words.sort((a, b) => a[0] - b[0]);
  return words.map(([, word]) => word).join(" ").slice(0, 1400);
}
function arxivIdFromWork(w: OAWork): string {
  const a = w.ids?.arxiv;
  if (a) { const m = a.match(/arxiv\.org\/abs\/([^/?#]+)/i); if (m) return m[1]; }
  const url = w.primary_location?.landing_page_url || "";
  const m = url.match(/arxiv\.org\/(?:abs|pdf)\/([^/?#.]+)/i);
  return m ? m[1] : "";
}
function fromOA(w: OAWork): ArxivRecord {
  const ax = arxivIdFromWork(w);
  const title = String(w.title || w.display_name || "Untitled");
  const year = Number(w.publication_year) || new Date().getFullYear();
  return {
    arxivId: ax, id: ax || (w.ids?.doi || w.id || title).replace(/^https?:\/\//, ""),
    title, authors: [], // OpenAlex 作者需单独展开，这里保持空由上层显示"作者信息未知"
    summary: abstractText(w) || "（该论文暂无公开摘要，可点原文链接查看。）",
    published: String(w.publication_date || `${year}-01-01`),
    year,
    primaryCategory: w.primary_topic?.subfield?.display_name || w.primary_topic?.field?.display_name || "",
    categories: (w.keywords || []).slice(0, 5).map((k) => k.display_name).filter(Boolean) as string[],
    absUrl: ax ? `https://arxiv.org/abs/${ax}` : String(w.primary_location?.landing_page_url || w.ids?.doi || ""),
    pdfUrl: ax ? `https://arxiv.org/pdf/${ax}` : String(w.primary_location?.pdf_url || ""),
  };
}
async function fetchOA(params: URLSearchParams): Promise<OAWork[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(`${OA}?${params}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  } finally { clearTimeout(timer); }
}

/** 论文库默认网格：优先 OpenAlex 按 arXiv id 精确取，失败退回精选清单。 */
export async function fetchByIds(ids: string[], max = 30): Promise<ArxivResult> {
  const clean = ids.map((x) => x.replace(/^arxiv:/i, "").trim()).filter(Boolean).slice(0, max);
  if (clean.length) {
    try {
      const works = await fetchOA(new URLSearchParams({
        filter: `ids.openalex:${clean.map((id) => `https://arxiv.org/abs/${id}`).join("|")}`,
        "per-page": String(max),
      }));
      if (works.length) return { records: works.map(fromOA), source: "arxiv" };
    } catch { /* 走兜底 */ }
  }
  const set = new Set(clean);
  const fallback = LIBRARY.map(recordFromCurated).filter((r) => !clean.length || set.has(r.id)).slice(0, max);
  return { records: fallback, source: "demo", degraded: true };
}

/** 关键词检索：OpenAlex relevance 排序，失败退回本地精选过滤。 */
export async function searchArxiv(
  query: string,
  opts: { max?: number; sort?: "relevance" | "submittedDate" | "lastUpdatedDate" } = {}
): Promise<ArxivResult> {
  const max = opts.max ?? 15;
  if (!query.trim()) return { records: LIBRARY.slice(0, max).map(recordFromCurated), source: "demo" };
  try {
    const params = new URLSearchParams({ search: query.trim(), "per-page": String(max) });
    if (opts.sort === "submittedDate") params.set("sort", "publication_date:desc");
    const works = await fetchOA(params);
    if (works.length) return { records: works.map(fromOA), source: "arxiv" };
  } catch { /* 走兜底 */ }
  const q = query.trim().toLowerCase();
  const pool = LIBRARY.map(recordFromCurated);
  const hit = pool.filter((r) =>
    r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q) ||
    r.authors.join(" ").toLowerCase().includes(q)
  );
  return { records: (hit.length ? hit : pool).slice(0, max), source: "demo", degraded: true };
}

/** arXiv HTML 全文直连；无 HTML 版返回 degraded 让上层用摘要精读。 */
export async function fetchPaperBody(arxivId: string): Promise<ArxivBody> {
  const id = String(arxivId).replace(/^arxiv:/i, "").replace(/v\d+$/i, "").trim();
  if (!/^[\w./-]{4,40}$/.test(id)) return { blocks: [], degraded: true, source: "demo" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(`https://arxiv.org/html/${id}`, { signal: ctrl.signal });
    if (!res.ok) return { blocks: [], degraded: true, source: "demo" };
    const html = await res.text();
    if (/<title>[\s\S]*?not found|error/i.test(html.slice(0, 600))) return { blocks: [], degraded: true, source: "demo" };
    return { blocks: parseArxivHtml(html), degraded: false, versioned: id, source: "arxiv" };
  } catch {
    return { blocks: [], degraded: true, source: "demo" };
  } finally { clearTimeout(timer); }
}

/** 轻量 HTML → 段落块：只取正文段落与标题，跳过脚本/公式/参考文献噪音。 */
function parseArxivHtml(html: string): ArxivBodyBlock[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,math,svg,nav,figure,table,.ltx_bibliography,.ltx_appendix").forEach((n) => n.remove());
  const out: ArxivBodyBlock[] = [];
  const nodes = doc.querySelectorAll("h1,h2,h3,h4,p,.ltx_para,.ltx_title");
  for (const el of nodes) {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!text || text.length < 8) continue;
    if (/^h[1-4]$/.test(tag) || el.classList.contains("ltx_title")) {
      if (text.length < 120) out.push({ heading: text });
    } else if (text.length > 40) {
      out.push({ text: text.slice(0, 3000) });
    }
    if (out.length >= 400) break;
  }
  return out;
}
