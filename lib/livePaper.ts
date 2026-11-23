/**
 * 把「论文库实时元数据 + arXiv HTML 全文」组装成一篇可精读的 Paper。
 * - 正文句子来自真实抓取文本，译文留空，交给 A2 的「AI 完整拆解这句」按需生成；
 * - fullText 用真实段落；HTML 不可用时退化为「真实摘要精读」，并在 sourceNote 里如实标注。
 * 绝不伪造中文标题或结论：titleZh 直接沿用真实英文标题。
 */
import type { Paper, PaperBlock, Sentence } from "@/lib/types";
import type { ArxivBody, ArxivRecord } from "@/lib/arxiv";

const MAX_SENTENCES = 60;

// 稳健分句：跳过小数点（28.4 BLEU）与常见缩写句点（e.g. / et al. / Fig.），
// 与 PDF 解析里已修复的分句逻辑保持一致，避免把 "28." 与 "4 BLEU…" 拆成两句。
const ABBREV =
  /(?:^|\s)(?:e\.g|i\.e|et al|vs|etc|approx|cf|viz|Fig|Figs|Eq|Eqs|Sec|Secs|Ref|Refs|Tbl|No|Prof|Dr|Mr|Ms|Mrs|St|Vol|pp|ed|eds|trans)\.$/i;

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    cur += ch;
    if (!"。！？.!?".includes(ch)) continue;
    // 小数点：前后都是数字则不断句
    if (ch === "." && /\d/.test(normalized[i - 1] ?? "") && /\d/.test(normalized[i + 1] ?? ""))
      continue;
    // 跳过句点后的引号/括号
    let j = i + 1;
    while (j < normalized.length && /["'’”)\]]/.test(normalized[j])) j++;
    if (j >= normalized.length) {
      out.push(cur.trim());
      cur = "";
      i = j - 1;
      continue;
    }
    if (normalized[j] !== " ") continue;
    // 缩写句点不断句
    if (ch === "." && ABBREV.test(cur.trim())) continue;
    const next = normalized.slice(j).trim().charAt(0);
    if (/[A-Z0-9"'“‘([一-龥]/.test(next)) {
      out.push(cur.trim());
      cur = "";
      i = j - 1;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map((s) => s.trim()).filter((s) => s.length > 24 && s.length < 600);
}

function formatAuthors(list: string[]): string {
  if (!list.length) return "作者信息未知";
  if (list.length === 1) return list[0];
  return `${list[0]} 等 ${list.length} 人`;
}

/** 扁平 body.blocks（heading / text 交替）→ PaperBlock[]（标题开新块，正文归段）。 */
function toBlocks(body: ArxivBody): PaperBlock[] {
  const out: PaperBlock[] = [];
  let cur: PaperBlock | null = null;
  for (const b of body.blocks) {
    if (b.heading) {
      if (cur?.paragraphs.length) out.push(cur);
      cur = { heading: b.heading, paragraphs: [] };
    } else if (b.text) {
      if (!cur) cur = { paragraphs: [] };
      cur.paragraphs.push(b.text);
    }
  }
  if (cur?.paragraphs.length) out.push(cur);
  return out;
}

export function buildLivePaper(record: ArxivRecord, body: ArxivBody): Paper {
  const baseId = (record.arxivId || record.id).replace(/v\d+$/i, "");
  const hasHtml = !body.degraded && body.blocks.length > 0;

  const blocks = hasHtml ? toBlocks(body) : [];
  // 阅读正文源：优先真实 HTML，退化时用真实摘要。
  const readingText = hasHtml
    ? `${record.summary} ${body.blocks.map((b) => b.text || b.heading || "").join(" ")}`
    : record.summary || record.title;

  const sentences: Sentence[] = splitSentences(readingText)
    .slice(0, MAX_SENTENCES)
    .map((text, i) => ({
      id: `live-${baseId}-${i}`,
      text,
      translations: ["", "", "", "", ""],
      role: "",
    }));

  const fullText: PaperBlock[] = hasHtml
    ? blocks
    : record.summary
      ? [{ heading: "摘要", paragraphs: [record.summary] }]
      : [];

  const sourceNote = hasHtml
    ? `实时抓取自 arXiv 全文（HTML 版 ${body.versioned || baseId}）· 人话版由 AI 逐句生成`
    : "arXiv 暂未提供 HTML 全文，此处基于真实摘要精读 · 可下载 PDF 上传以精读全文";

  return {
    id: `live-${baseId}`,
    title: record.title,
    titleZh: record.title,
    authors: formatAuthors(record.authors),
    venue: `${record.primaryCategory || "arXiv"} · ${record.year || ""}`.trim(),
    year: record.year || new Date().getFullYear(),
    url: record.absUrl,
    sourceNote,
    sections: [
      {
        id: "full",
        title: "全文",
        note: "正文为 arXiv 实时抓取的真实文本。点击任意句子，让 AI 生成当前档位的人话版、句子作用与术语卡。",
        sentences,
      },
    ],
    fullText,
  };
}
