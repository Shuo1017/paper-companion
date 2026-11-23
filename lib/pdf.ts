import * as pdfjsLib from "pdfjs-dist";
import type { Paper, PaperBlock, Sentence } from "@/lib/types";

// Vite 会打包 worker 资源
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MAX_SENTENCES = 60;

/** 单行重建时，两个相邻文本块横向间距超过此值视为「栏间距」，需要断栏。 */
const LINE_TOL = 2.6;

interface Run {
  y: number;
  x0: number;
  x1: number;
  text: string;
}

interface Piece {
  str: string;
  x0: number;
  x1: number;
  y: number;
}

/**
 * 英文论文正文的句子切分。
 * 关键点：不在小数点（28.4）、常见缩写（e.g. / et al. / Fig. / Sec.）处断开，
 * 只在「句末标点 + 空格 + 下一句首大写/引号/括注」处断句，避免把数字拆成碎片。
 */
function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  const ABBREV =
    /(?:^|\s)(?:e\.g|i\.e|et al|vs|etc|approx|cf|viz|Fig|Figs|Eq|Eqs|Sec|Secs|Ref|Refs|Tbl|No|Prof|Dr|Mr|Ms|Mrs|St|Vol|pp|ed|eds|trans|trans)\.$/i;
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    cur += ch;
    const isStop = ch === "." || ch === "!" || ch === "?" || ch === "。" || ch === "！" || ch === "？";
    if (!isStop) continue;
    // 小数点：两侧都是数字，不断句。
    if (ch === "." && /\d/.test(normalized[i - 1] ?? "") && /\d/.test(normalized[i + 1] ?? "")) {
      continue;
    }
    // 跳过紧随的引号 / 右括号，再判断是否到句界。
    let j = i + 1;
    while (j < normalized.length && /["'’”)\]]/.test(normalized[j])) j++;
    if (j >= normalized.length) {
      out.push(cur.trim());
      cur = "";
      i = j - 1;
      continue;
    }
    if (normalized[j] !== " ") continue; // 标点后不是空格 → 不是句末（如 URL、缩写内部）
    const tail = cur.trim();
    if (ch === "." && ABBREV.test(tail)) continue; // 缩写结尾，不断
    const nextWordStart = normalized.slice(j).trim().charAt(0);
    if (/[A-Z0-9"'“‘([一-龥]/.test(nextWordStart)) {
      out.push(tail);
      cur = "";
      i = j - 1;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map((s) => s.trim()).filter((s) => s.length > 20 && s.length < 600);
}

/** 把 pdfjs 文本项转成带坐标的片段（transform = [a,b,c,d,e,f]，e=x、f=y，y 轴向上）。 */
function toPieces(content: unknown): Piece[] {
  const items =
    (content as { items?: Array<Record<string, unknown>> }).items ?? [];
  const pieces: Piece[] = [];
  for (const it of items) {
    const str = typeof it.str === "string" ? it.str : "";
    const tr = it.transform;
    if (!str.trim() || !Array.isArray(tr) || tr.length < 6) continue;
    const x0 = Number(tr[4]) || 0;
    const y = Number(tr[5]) || 0;
    const w = typeof it.width === "number" ? it.width : 0;
    pieces.push({ str, x0, x1: x0 + w, y });
  }
  return pieces;
}

/** 按 y 聚成视觉行（同一基线，y 相差在容差内）。 */
function groupBaselines(pieces: Piece[]): Piece[][] {
  const sorted = [...pieces].sort((a, b) => b.y - a.y || a.x0 - b.x0);
  const lines: Piece[][] = [];
  for (const p of sorted) {
    const cur = lines[lines.length - 1];
    if (cur && Math.abs(cur[0].y - p.y) <= LINE_TOL) cur.push(p);
    else lines.push([p]);
  }
  for (const l of lines) l.sort((a, b) => a.x0 - b.x0);
  return lines;
}

/** 行内遇到大于栏间距的横向空隙就断成多段（双栏同一基线会被拆成左、右两段）。 */
function splitSegments(line: Piece[], gutter: number): Piece[][] {
  const segs: Piece[][] = [[]];
  let prev = line[0];
  segs[0].push(prev);
  for (let i = 1; i < line.length; i++) {
    const p = line[i];
    if (p.x0 - prev.x1 > gutter) segs.push([]);
    segs[segs.length - 1].push(p);
    prev = p;
  }
  return segs.filter((s) => s.length > 0);
}

/** 段内按横向间距决定是否补空格，重建该行文本。 */
function segText(seg: Piece[], spaceGap: number): string {
  let out = "";
  let prev: Piece | null = null;
  for (const p of seg) {
    if (prev && p.x0 - prev.x1 > spaceGap && !/\s$/.test(out) && !/^\s/.test(p.str)) {
      out += " ";
    }
    out += p.str;
    prev = p;
  }
  return out.replace(/\s+/g, " ").trim();
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function quantile(nums: number[], q: number): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))];
}

/**
 * 清掉 arXiv 首页左侧竖排水印（如 "arXiv:1706.03762v7 [cs.CL] 2 Aug 2023"），
 * 它常混进正文那一句里；顺带收拢多余空格。
 */
function cleanRun(t: string): string {
  return t
    .replace(
      /arXiv:\d{4}\.\d{4,5}(?:v\d+)?(?:\s*\[[a-z][a-z.-]*\])?(?:\s*\d{1,2}\s+[A-Za-z]+\s+\d{4})?/g,
      " "
    )
    // 竖排水印常断成多个 run：单独出现的「[cs.CL] 2 Aug 2023」类目+日期尾巴也清掉
    .replace(/\[[a-z][a-z.-]*\]\s*\d{1,2}\s+[A-Z][a-z]+\s+\d{4}/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** 跨行拼接：上一行以连字符结尾、且下一行以小写开头时，判定为行末断词，去掉连字符续接；
 * 否则（如 "English-to-German" 这类真连字符词）保留连字符并补空格。
 */
function joinLines(a: string, b: string): string {
  if (/-\s*$/.test(a) && /^[a-z]/.test(b)) return a.replace(/-\s*$/, "") + b;
  return `${a} ${b}`;
}

/**
 * 把同一栏内、按 y 降序排列的行聚成自然段。
 * 断段依据：行距明显变大，或上一行明显没写满（行尾离右边界很远 → 段落结束）。
 */
function runsToParagraphs(runs: Run[]): string[] {
  if (!runs.length) return [];
  const gaps: number[] = [];
  for (let i = 1; i < runs.length; i++) gaps.push(runs[i - 1].y - runs[i].y);
  const medGap = median(gaps.filter((g) => g > 0)) || 11;
  const rightEdge = quantile(runs.map((r) => r.x1), 0.85);

  const paras: string[] = [];
  let buf = "";
  let prev: Run | null = null;
  for (const r of runs) {
    if (prev) {
      const gap = prev.y - r.y;
      const prevShort = prev.x1 < rightEdge - Math.max(24, rightEdge * 0.08);
      const bigGap = gap > medGap * 1.8;
      if (prevShort || bigGap) {
        if (buf.trim()) paras.push(buf.trim());
        buf = "";
      } else {
        buf = buf ? joinLines(buf, r.text) : r.text;
        prev = r;
        continue;
      }
    }
    buf = buf ? joinLines(buf, r.text) : r.text;
    prev = r;
  }
  if (buf.trim()) paras.push(buf.trim());
  return paras;
}

/** 从段落里挑出疑似标题的短行（如 "1 Introduction"、"Abstract"）。 */
function isHeading(par: string): boolean {
  if (par.length > 90) return false;
  return (
    /^(abstract|references|acknowledge?ments?|conclusion(s)?|introduction|related work|method(s)?|experiments?|results?|discussion|limitations?)\b/i.test(
      par
    ) ||
    /^\d+(\.\d+)*\s+\S/.test(par)
  );
}

/**
 * 按坐标重建一页的阅读顺序。
 * 双栏：把每行的段按左边界落到左栏或右栏，先读顶部跨栏标题/摘要 + 左栏整列，再读右栏整列。
 * 单栏：直接按 y 顺序读出。返回重组后的自然段与展平全文。
 */
function reflowPage(
  content: unknown,
  pageWidth: number
): { paragraphs: string[]; fullText: string } {
  const pieces = toPieces(content);
  if (!pieces.length) return { paragraphs: [], fullText: "" };

  const gutter = Math.max(16, pageWidth * 0.05);
  const spaceGap = Math.max(1.2, pageWidth * 0.004);
  const baselines = groupBaselines(pieces);

  const runs: Run[] = [];
  let multiSeg = 0;
  for (const bl of baselines) {
    const segs = splitSegments(bl, gutter);
    if (segs.length >= 2) multiSeg++;
    for (const s of segs) {
      const text = cleanRun(segText(s, spaceGap));
      if (!text) continue;
      runs.push({
        y: s.reduce((acc, p) => acc + p.y, 0) / s.length,
        x0: s[0].x0,
        x1: s[s.length - 1].x1,
        text,
      });
    }
  }
  if (!runs.length) return { paragraphs: [], fullText: "" };
  runs.sort((a, b) => b.y - a.y || a.x0 - b.x0);

  const mid = pageWidth * 0.45;
  const left = runs.filter((r) => r.x0 < mid);
  const right = runs.filter((r) => r.x0 >= mid);
  const twoCol =
    left.length >= 6 && right.length >= 6 && multiSeg >= Math.min(left.length, 4);

  if (!twoCol) {
    return {
      paragraphs: runsToParagraphs(runs),
      fullText: runs.map((r) => r.text).join(" "),
    };
  }

  // 左栏序列（含顶部跨栏标题、摘要）先读，再读右栏整列。
  const ordered = [...left, ...right];
  return {
    paragraphs: [...runsToParagraphs(left), ...runsToParagraphs(right)],
    fullText: ordered.map((r) => r.text).join(" "),
  };
}

/**
 * 旧版兜底：当坐标重建失败时，用 hasEOL 简单重建，保证阅读器视图仍有内容。
 */
function pageToParagraphsFallback(content: {
  items: Array<{ str?: string; hasEOL?: boolean }>;
}): string[] {
  let line = "";
  const lines: string[] = [];
  for (const item of content.items) {
    const str = typeof item.str === "string" ? item.str : "";
    line += str;
    if (item.hasEOL) {
      lines.push(line);
      line = "";
    }
  }
  if (line.trim()) lines.push(line);

  const paras: string[] = [];
  let buf = "";
  for (const raw of lines) {
    const t = raw.replace(/\s+/g, " ").trim();
    if (!t) {
      if (buf.trim()) paras.push(buf.trim());
      buf = "";
      continue;
    }
    buf = buf ? `${buf} ${t}` : t;
  }
  if (buf.trim()) paras.push(buf.trim());
  return paras;
}

export async function parsePdf(file: File): Promise<Paper> {
  const data = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pageTexts: string[] = [];
  const blocks: PaperBlock[] = [];
  const limit = Math.min(doc.numPages, 12);
  for (let i = 1; i <= limit; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    let paragraphs: string[] = [];
    let fullText = "";
    try {
      const reflowed = reflowPage(content, viewport.width);
      paragraphs = reflowed.paragraphs;
      fullText = reflowed.fullText;
    } catch {
      // 坐标重建异常时退回简单重建
    }
    if (!paragraphs.length) {
      paragraphs = pageToParagraphsFallback(
        content as unknown as {
          items: Array<{ str?: string; hasEOL?: boolean }>;
        }
      );
      fullText = paragraphs.join(" ");
    }

    pageTexts.push(fullText);

    let current: PaperBlock = { paragraphs: [] };
    for (const p of paragraphs) {
      if (isHeading(p)) {
        if (current.paragraphs.length) blocks.push(current);
        current = { heading: p, paragraphs: [] };
      } else {
        current.paragraphs.push(p);
      }
    }
    if (current.paragraphs.length) blocks.push(current);
  }
  const sentences = splitSentences(pageTexts.join(" ")).slice(0, MAX_SENTENCES);
  if (sentences.length === 0) {
    throw new Error("未能从 PDF 中提取到正文文本（可能是扫描件）。");
  }
  const title = file.name.replace(/\.pdf$/i, "");
  const parsed: Sentence[] = sentences.map((text, i) => ({
    id: `up-${i}`,
    text,
    translations: ["", "", "", "", ""],
    role: "",
  }));
  return {
    id: `upload-${Date.now()}`,
    title,
    titleZh: "我上传的论文",
    authors: "本地 PDF",
    venue: `${doc.numPages} 页 · 解析前 ${limit} 页`,
    year: new Date().getFullYear(),
    url: "",
    sourceNote: "本地上传 · 人话版由 AI 实时生成",
    sections: [
      {
        id: "full",
        title: "全文",
        note: "自动解析的正文，已按双栏阅读顺序重排。点击句子可让 AI 生成当前档位的人话版、句子作用与术语卡。",
        sentences: parsed,
      },
    ],
    fullText: blocks,
  };
}
