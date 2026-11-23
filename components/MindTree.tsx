import { useEffect, useMemo, useRef, useState } from "react";
import { generateMindMap } from "@/lib/ai";
import type { MindNode, Paper } from "@/lib/types";

/* ============ 横向卡片树布局常量（像素） ============
   root 在最左列，children 依次向右生长；每个叶子占一行，
   父节点垂直居中于其子节点均值。卡片宽度按 kind 自适应，
   兄弟行间距固定，中文长标签不会再互相压字。 */
const LEVEL_GAP = 300; // 列间距（depth +1 右移这么多）
const LEAF_GAP = 84; // 相邻叶子的行间距
const PADDING_X = 40;
const PADDING_Y = 48;

const CARD_W: Record<MindNode["kind"], number> = {
  root: 252,
  section: 252,
  point: 252,
  term: 168,
};

/* label / detail 截断上限（按字符数，中文视作 1 字）。
   右侧为 +N 折叠徽标 / 章节箭头圆钮预留约 34px 的「徽标槽」，
   正文一律止于 (cardW - 62)，避免长句压到徽标上。 */
const LABEL_MAX: Record<MindNode["kind"], number> = {
  root: 24,
  section: 12,
  point: 15,
  term: 10,
};
const DETAIL_MAX: Record<MindNode["kind"], number> = {
  root: 26,
  section: 16,
  point: 0,
  term: 0,
};

const CARD_H_SINGLE = 48;
const CARD_H_DOUBLE = 70;

/* 入场动效：层级递增 + 兄弟按索引再错峰 */
function delayFor(depth: number, index: number) {
  return Math.min(2200, depth * 220 + index * 55);
}

/* 中文按字符截断 */
function clip(text: string, max: number) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

interface PlacedNode {
  id: string;
  node: MindNode;
  depth: number;
  x: number; // 卡片左边缘
  y: number; // 卡片垂直中心
  cardW: number;
  cardH: number;
  hasDetail: boolean;
  parent?: PlacedNode;
  childCount: number;
  siblingIndex: number;
}

interface Layout {
  nodes: PlacedNode[];
  width: number;
  height: number;
}

function measure(node: MindNode) {
  const max = DETAIL_MAX[node.kind];
  const hasDetail = max > 0 && !!node.detail;
  return { hasDetail, cardH: hasDetail ? CARD_H_DOUBLE : CARD_H_SINGLE };
}

/**
 * 朴素 tidy-tree（横向）：DFS 后序，叶子按序占 y；父节点在子 y 均值。
 * 对本项目的 4 层论证树（≤ 40 节点）足够整洁，且保证兄弟不重叠。
 */
function layoutTree(root: MindNode, collapsed: Set<string>): Layout {
  let leafCursor = 0;
  const placed: PlacedNode[] = [];
  const byId = new Map<string, PlacedNode>();

  function visit(node: MindNode, depth: number, siblingIndex: number): number {
    const children = collapsed.has(node.id) ? [] : node.children ?? [];
    const childYs = children.map((c, i) => visit(c, depth + 1, i));
    const { hasDetail, cardH } = measure(node);
    const y = childYs.length
      ? childYs.reduce((a, b) => a + b, 0) / childYs.length
      : leafCursor++ * LEAF_GAP + LEAF_GAP / 2;
    const me: PlacedNode = {
      id: node.id,
      node,
      depth,
      x: 0,
      y,
      cardW: CARD_W[node.kind],
      cardH,
      hasDetail,
      parent: undefined,
      childCount: (node.children ?? []).length,
      siblingIndex,
    };
    placed.push(me);
    byId.set(node.id, me);
    for (const c of children) {
      const cn = byId.get(c.id);
      if (cn && !cn.parent) cn.parent = me;
    }
    return y;
  }

  visit(root, 0, 0);

  let maxDepth = 0;
  let maxCardW = 0;
  for (const p of placed) {
    if (p.depth > maxDepth) maxDepth = p.depth;
    if (p.cardW > maxCardW) maxCardW = p.cardW;
  }

  for (const p of placed) {
    p.x = PADDING_X + p.depth * LEVEL_GAP;
    p.y = PADDING_Y + p.y;
  }

  const width = Math.max(480, PADDING_X * 2 + maxDepth * LEVEL_GAP + maxCardW);
  const height = PADDING_Y * 2 + Math.max(1, leafCursor) * LEAF_GAP;
  return { nodes: placed, width, height };
}

/* 贝塞尔曲线：从父卡片右边缘中点弯到子卡片左边缘中点 */
function branchPath(a: PlacedNode, b: PlacedNode) {
  const ax = a.x + a.cardW;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  const midX = (ax + bx) / 2;
  return `M ${ax} ${ay} C ${midX} ${ay}, ${midX} ${by}, ${bx} ${by}`;
}

function estimateLength(a: PlacedNode, b: PlacedNode) {
  const dx = b.x - (a.x + a.cardW);
  const dy = b.y - a.y;
  return Math.max(80, Math.hypot(dx, dy) * 1.15);
}

/** 初始只展开到「章节」层：收集所有 section 节点 id 作为默认收起集合，
 *  让顶部导图保持紧凑骨架，论点/术语按需点开。 */
function initialCollapsed(root: MindNode): Set<string> {
  const set = new Set<string>();
  (function walk(n: MindNode) {
    if (n.kind === "section" && n.children?.length) set.add(n.id);
    n.children?.forEach(walk);
  })(root);
  return set;
}

interface MindTreeProps {
  root: MindNode;
  /** 用于在切换论文时重放入场动画 */
  revealKey: string | number;
  onGoSection: (node: MindNode) => void;
}

export function MindTree({ root, revealKey, onGoSection }: MindTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() =>
    initialCollapsed(root)
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  // 自由拖动：记录按下点、起始滚动量与是否真正拖动（用于抑制拖完误触展开）
  const dragRef = useRef({ down: false, moved: false });
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    // 每次换论文都重置为紧凑骨架，并重新播放生长动画。
    setCollapsed(initialCollapsed(root));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey]);

  // 指针按下即开始监听 window 移动：向左/上拖动手势映射为向右/下滚动，
  // 像抓取画布一样平移导图；移动超过 4px 判定为拖动，随后的 click 不再触发展开。
  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return; // 仅主键拖动
    const el = containerRef.current;
    if (!el) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startSl = el.scrollLeft;
    const startSt = el.scrollTop;
    dragRef.current = { down: true, moved: false };
    setPanning(true);

    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d.down) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
      if (d.moved) {
        el.scrollLeft = startSl - dx;
        el.scrollTop = startSt - dy;
        ev.preventDefault();
      }
    };
    const up = () => {
      dragRef.current.down = false;
      setPanning(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      // 让紧随其后的 click 读到 moved，再在下一帧复位
      setTimeout(() => {
        dragRef.current.moved = false;
      }, 0);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  const layout = useMemo(() => layoutTree(root, collapsed), [root, collapsed]);

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const edges = layout.nodes
    .filter((n) => n.parent)
    .map((n) => ({ from: n.parent!, to: n }));

  return (
    <div
      ref={containerRef}
      className={`mind-canvas${panning ? " is-panning" : ""}`}
      role="group"
      aria-label="论证脉络思维导图（按住拖动可平移画布）"
      onPointerDown={onPointerDown}
    >
      <svg
        key={revealKey}
        className="mind-svg"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
      >
        <defs>
          <linearGradient id="branchGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(219, 227, 255, 0.85)" />
            <stop offset="55%" stopColor="rgba(165, 180, 252, 0.55)" />
            <stop offset="100%" stopColor="rgba(147, 197, 253, 0.35)" />
          </linearGradient>
        </defs>

        {edges.map(({ from, to }) => {
          const d = branchPath(from, to);
          const len = estimateLength(from, to);
          const delay = delayFor(to.depth, to.siblingIndex);
          return (
            <path
              key={`${from.id}->${to.id}`}
              className="branch"
              d={d}
              style={
                {
                  ["--len" as any]: `${len}`,
                  ["--delay" as any]: `${delay}`,
                } as React.CSSProperties
              }
            />
          );
        })}

        {layout.nodes.map((p) => {
          const delay = delayFor(p.depth, p.siblingIndex);
          const kind = p.node.kind;
          const collapsedHere = collapsed.has(p.node.id);
          const hasChildren = p.childCount > 0;
          const primary = clip(p.node.label, LABEL_MAX[kind]);
          const detail = p.hasDetail ? clip(p.node.detail!, DETAIL_MAX[kind]) : "";
          const labelY = p.y - (p.hasDetail ? 9 : 0);
          const top = p.y - p.cardH / 2;
          return (
            <g
              key={p.id}
              className={`mind-node is-${kind}`}
              style={{ ["--delay" as any]: `${delay}` } as React.CSSProperties}
              tabIndex={hasChildren || kind === "section" ? 0 : -1}
              role={hasChildren ? "button" : undefined}
              aria-expanded={hasChildren ? !collapsedHere : undefined}
              aria-label={
                hasChildren
                  ? collapsedHere
                    ? `展开「${p.node.label}」`
                    : `收起「${p.node.label}」`
                  : p.node.label
              }
              onClick={() => {
                if (dragRef.current.moved) return; // 拖动结束时不误触展开
                if (hasChildren) toggle(p.id);
              }}
              onKeyDown={(e) => {
                if (!hasChildren) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(p.id);
                }
              }}
            >
              <rect
                className={`mind-card is-${kind}`}
                x={p.x}
                y={top}
                width={p.cardW}
                height={p.cardH}
                rx={12}
              />
              <circle
                className={`node-anchor is-${kind}`}
                cx={p.x + 16}
                cy={labelY}
                r={3.5}
              />
              <text
                className={`node-label is-${kind}`}
                x={p.x + 28}
                y={labelY}
                dominantBaseline="middle"
              >
                {primary}
              </text>
              {detail && (
                <text
                  className="node-detail"
                  x={p.x + 28}
                  y={p.y + 13}
                  dominantBaseline="middle"
                >
                  {detail}
                </text>
              )}
              {collapsedHere && hasChildren && (
                <g
                  className="collapse-badge"
                  transform={`translate(${p.x + p.cardW - 24}, ${top + 22})`}
                  aria-hidden
                >
                  <circle r={11} />
                  <text textAnchor="middle" dominantBaseline="central">
                    +{p.childCount}
                  </text>
                </g>
              )}
              {kind === "section" && p.node.sectionId && (
                <g
                  className="jump-dot"
                  role="button"
                  tabIndex={0}
                  aria-label={`回到「${p.node.label}」继续读`}
                  transform={`translate(${p.x + p.cardW - 22}, ${top + (collapsedHere ? 46 : 22)})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragRef.current.moved) return;
                    onGoSection(p.node);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onGoSection(p.node);
                    }
                  }}
                >
                  <circle r={10} />
                  <path
                    d="M -3 -3 L 3 0 L -3 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============== 上层：论文正文上方的完整导图卡片 ============== */

interface MindmapPanelProps {
  paper: Paper;
  onGoSection: (node: MindNode) => void;
  /** 上传论文 AI 生成成功后回写，避免每次切标签重复调用 */
  onMindmapGenerated: (mindmap: MindNode) => void;
}

function buildPaperText(paper: Paper): string {
  const MAX = 18000;
  const lines: string[] = [];
  let total = 0;
  for (const s of paper.sections) {
    for (const sen of s.sentences) {
      const t = sen.text.trim();
      if (!t) continue;
      total += t.length + 1;
      if (total > MAX) {
        lines.push("（正文过长，后续已省略）");
        return lines.join(" ");
      }
      lines.push(t);
    }
  }
  return lines.join(" ");
}

export function MindmapPanel({
  paper,
  onGoSection,
  onMindmapGenerated,
}: MindmapPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = useMemo(() => buildPaperText(paper), [paper]);

  async function generate() {
    if (busy || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      onMindmapGenerated(await generateMindMap(text));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        /[\u4e00-\u9fff]/.test(msg) ? msg : "思维导图生成失败，请稍后再试。"
      );
    } finally {
      setBusy(false);
    }
  }

  if (paper.mindmap) {
    return (
      <section aria-label="论证脉络思维导图" className="flex flex-col gap-2">
        <MindTree
          root={paper.mindmap}
          revealKey={paper.id}
          onGoSection={onGoSection}
        />
        <div className="mind-legend">
          <span className="mind-legend-item">
            <span className="mind-legend-dot is-root" />核心主张
          </span>
          <span className="mind-legend-item">
            <span className="mind-legend-dot is-section" />章节
          </span>
          <span className="mind-legend-item">
            <span className="mind-legend-dot is-point" />关键论点
          </span>
          <span className="mind-legend-item">
            <span className="mind-legend-dot is-term" />术语
          </span>
          <span className="mind-legend-item ml-auto text-xs opacity-70">
            按住拖动可平移画布 · 点卡片收起 / 展开分支 · 章节卡片箭头回到正文
          </span>
        </div>
      </section>
    );
  }

  return (
    <div className="mind-empty">
      <svg
        viewBox="0 0 24 24"
        className="spark"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 2 L14.2 8.8 L21 11 L14.2 13.2 L12 20 L9.8 13.2 L3 11 L9.8 8.8 Z" />
        <path d="M19 3 L19.7 5.3 L22 6 L19.7 6.7 L19 9 L18.3 6.7 L16 6 L18.3 5.3 Z" />
      </svg>
      <p className="max-w-md text-sm text-muted-foreground">
        这篇上传论文还没有导图。生成后，AI 会按「核心主张 → 章节 → 关键论点 →
        术语」四层，把正文梳理成一棵星空里的论证树。
      </p>
      <button
        type="button"
        onClick={generate}
        disabled={busy || !text.trim()}
        className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
        style={{ backdropFilter: "blur(10px)" }}
      >
        {busy ? "AI 正在梳理脉络…" : "生成论证树"}
      </button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
