import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Check, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MindmapPanel } from "@/components/MindTree";
import {
  LEVELS,
  type MindNode,
  type Paper,
  type Sentence,
  type Term,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ReaderViewProps {
  paper: Paper;
  level: number;
  onLevelChange: (level: number) => void;
  collectedIds: Set<string>;
  onCollectTerm: (term: Term) => void;
  readIds: Set<string>;
  onOpenSentence: (id: string) => void;
  onGoFeynman: (sectionTitle: string) => void;
  onExplain?: (sentence: Sentence) => void;
  generatingId?: string | null;
  /** AI 生成导图后回写，避免切换标签页时重复调用 */
  onMindmapGenerated: (mindmap: MindNode) => void;
}

export function ReaderView({
  paper,
  level,
  onLevelChange,
  collectedIds,
  onCollectTerm,
  readIds,
  onOpenSentence,
  onGoFeynman,
  onExplain,
  generatingId,
  onMindmapGenerated,
}: ReaderViewProps) {
  const [sectionId, setSectionId] = useState(paper.sections[0].id);
  // 只存句子 id：AI 拆解后 paper 会被不可变更新，用 id 派生才能拿到最新译文。
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<"compare" | "original">("compare");

  const section =
    paper.sections.find((s) => s.id === sectionId) ?? paper.sections[0];
  const levelInfo = LEVELS[level];
  const readInSection = section.sentences.filter((s) =>
    readIds.has(s.id)
  ).length;
  const hasFullText = !!paper.fullText?.length;

  const active =
    activeId === null
      ? null
      : (paper.sections
          .flatMap((s) => s.sentences)
          .find((s) => s.id === activeId) ?? null);

  function openSentence(sentence: Sentence) {
    setActiveId(sentence.id);
    onOpenSentence(sentence.id);
  }

  // 术语 id → 所在句子：完整原文里点某个发光术语时，弹出它出处那一句的红笔拆解。
  const termToSentence = useMemo(() => {
    const map = new Map<string, Sentence>();
    for (const s of paper.sections)
      for (const sen of s.sentences)
        for (const t of sen.terms ?? [])
          if (!map.has(t.id)) map.set(t.id, sen);
    return map;
  }, [paper]);

  // 解析段落里的 [[显示文本|术语id]] 标记，命中则渲染成可点击的发光术语。
  function renderParagraph(text: string): ReactNode[] {
    const re = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
    const out: ReactNode[] = [];
    let last = 0;
    let key = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const label = m[1];
      const sen = termToSentence.get(m[2]);
      if (sen) {
        out.push(
          <button
            key={`t${key++}`}
            type="button"
            className="term-inline"
            title={`查看「${label}」的对照拆解`}
            aria-label={`查看「${label}」的对照拆解`}
            onClick={() => openSentence(sen)}
          >
            {label}
          </button>
        );
      } else {
        out.push(<span key={`t${key++}`}>{label}</span>);
      }
      last = re.lastIndex;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }

  // 导图「去读这节」按钮：优先按 sectionId 匹配，其次按标题匹配。
  function jumpToSection(node: MindNode) {
    const target =
      paper.sections.find((s) => s.id === node.sectionId) ??
      paper.sections.find((s) => s.title === node.label) ??
      paper.sections[0];
    if (target) {
      setSectionId(target.id);
      setMode("compare");
    }
  }

  return (
    <div className="flex flex-col gap-[calc(1.25rem*var(--site-space))]">
      {/* 论证脉络：树枝状动态导图，常驻阅读页顶部 */}
      <MindmapPanel
        paper={paper}
        onGoSection={jumpToSection}
        onMindmapGenerated={onMindmapGenerated}
      />

      {/* 阅读模式切换：对照拆解 / 完整原文 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="阅读模式"
          className="inline-flex rounded-lg border bg-card p-0.5 text-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "compare"}
            onClick={() => setMode("compare")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
              mode === "compare"
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="size-4" aria-hidden />
            对照拆解
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "original"}
            disabled={!hasFullText}
            onClick={() => setMode("original")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
              mode === "original"
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
              !hasFullText && "cursor-not-allowed opacity-40 hover:text-muted-foreground"
            )}
            title={hasFullText ? undefined : "这篇论文暂无完整原文"}
          >
            <BookOpen className="size-4" aria-hidden />
            完整原文
          </button>
        </div>
        {mode === "compare" && (
          <p className="text-sm text-muted-foreground" role="status">
            本章已拆解 {readInSection}/{section.sentences.length} 句
          </p>
        )}
      </div>

      {mode === "original" && hasFullText ? (
        <article className="paper-reader" aria-label="论文完整原文">
          {paper.fullText!.map((block, bi) => (
            <section key={bi} className="paper-block">
              {block.heading && <h3 className="paper-h">{block.heading}</h3>}
              {block.paragraphs.map((para, pi) => (
                <p key={pi} className="paper-p">
                  {renderParagraph(para)}
                </p>
              ))}
            </section>
          ))}
          <p className="mt-6 border-t pt-3 text-xs text-muted-foreground">
            {paper.sourceNote} · 点发光的术语即可弹出它的红笔拆解 · 原文仅供学习，版权归原作者
          </p>
        </article>
      ) : (
        <>
      {/* 章节导航 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={sectionId} onValueChange={setSectionId}>
          <TabsList variant="line" aria-label="论文章节">
            {paper.sections.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="font-display">
                {s.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 理解度滑杆 */}
      <section
        aria-label="理解度滑杆"
        className="rounded-xl border bg-card p-[calc(1.5rem*var(--site-space))]"
      >
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden />
            理解度滑杆
            <Badge variant="secondary">
              {levelInfo.name} · {levelInfo.tag}
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">{levelInfo.desc}</p>
        </div>
        <Slider
          value={[level]}
          min={0}
          max={4}
          step={1}
          onValueChange={(v) => onLevelChange(v[0])}
          aria-label="选择理解度档位"
        />
        <div className="mt-2 flex justify-between">
          {LEVELS.map((l, i) => (
            <button
              key={l.name}
              type="button"
              onClick={() => onLevelChange(i)}
              className={cn(
                "level-tick rounded px-1 text-xs sm:text-sm",
                i === level
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={i === level}
            >
              {l.name}
            </button>
          ))}
        </div>
      </section>

      {/* 章节导读 */}
      {section.note && (
        <p className="annotation-card rounded-r-lg bg-muted/50 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          <span className="mr-1 font-semibold text-primary">导读</span>
          {section.note}
        </p>
      )}

      {/* 对照阅读 */}
      <section aria-label="对照阅读" className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-1 border-b bg-muted/40 text-sm font-medium md:grid-cols-2">
          <p className="flex items-center gap-2 px-4 py-2.5">
            <BookOpen className="size-4 text-muted-foreground" aria-hidden />
            原文
          </p>
          <p className="hidden items-center gap-2 border-l px-4 py-2.5 text-primary md:flex">
            <Sparkles className="size-4" aria-hidden />
            人话版 · {levelInfo.name}
          </p>
        </div>
        <ol className="divide-y">
          {section.sentences.map((sentence, idx) => (
            <li key={sentence.id} className="grid grid-cols-1 md:grid-cols-2">
              <div className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => openSentence(sentence)}
                  className={cn(
                    "sentence-clickable w-full text-left text-[0.95rem] leading-relaxed",
                    activeId === sentence.id && "sentence-active"
                  )}
                  aria-label={`拆解第 ${idx + 1} 句`}
                >
                  <span className="mr-1.5 select-none text-xs text-muted-foreground">
                    {readIds.has(sentence.id) ? (
                      <Check className="inline size-3.5 text-primary" aria-label="已拆解" />
                    ) : (
                      <span aria-hidden>{idx + 1}.</span>
                    )}
                  </span>
                  {sentence.text}
                </button>
              </div>
              <div className="border-t bg-primary/[0.02] px-5 py-4 md:border-t-0 md:border-l">
                <p className="mb-1 text-xs font-semibold text-primary md:hidden">
                  人话版 · {levelInfo.name}
                </p>
                {sentence.translations[level] ? (
                  <button
                    type="button"
                    onClick={() => openSentence(sentence)}
                    className={cn(
                      "sentence-clickable w-full text-left text-[0.95rem] leading-relaxed",
                      active?.id === sentence.id && "sentence-active"
                    )}
                    aria-label={`查看第 ${idx + 1} 句批注`}
                  >
                    {sentence.translations[level]}
                  </button>
                ) : generatingId === sentence.id ? (
                  <p className="text-sm text-muted-foreground" role="status">
                    AI 正在拆解这句（人话版 · 作用 · 术语）…
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenSentence(sentence.id);
                      onExplain?.(sentence);
                    }}
                  >
                    <Sparkles className="size-3.5" aria-hidden />
                    AI 完整拆解这句
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">
          {paper.sourceNote} · 点击任意句子查看红笔拆解
        </p>
      </section>

      {/* 费曼入口 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-5 py-4">
        <p className="text-sm">
          读完「{section.title}」了？
          <span className="text-muted-foreground">
            读懂没读懂，讲一遍就知道。
          </span>
        </p>
        <Button onClick={() => onGoFeynman(section.title)}>
          讲给费曼考官听
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
        </>
      )}

      {/* 红笔拆解弹窗 */}
      <Dialog open={active !== null} onOpenChange={(o) => !o && setActiveId(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-primary">
                  红笔拆解
                </DialogTitle>
                <DialogDescription className="sr-only">
                  句子原文、人话翻译、作用分析与术语卡片
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 text-sm">
                <blockquote className="rounded-lg bg-muted/60 p-4 leading-relaxed">
                  {active.text}
                </blockquote>
                {active.translations[level] ? (
                  <>
                    <div className="annotation-card rounded-r-lg bg-muted/50 pl-4">
                      <p className="mb-1 text-xs font-semibold text-primary">
                        人话版 · {levelInfo.name}
                      </p>
                      <p className="leading-relaxed">
                        {active.translations[level]}
                      </p>
                    </div>
                    {active.role && (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                          这句话在全文干什么
                        </p>
                        <p className="leading-relaxed">{active.role}</p>
                      </div>
                    )}
                    {active.formula && (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">
                          公式逐项翻译
                        </p>
                        <p className="mb-2 rounded-md bg-secondary/60 p-2 text-center font-mono">
                          {active.formula.plain}
                        </p>
                        <ul className="flex flex-col gap-1.5">
                          {active.formula.parts.map((p) => (
                            <li key={p.symbol} className="flex gap-2">
                              <code className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                                {p.symbol}
                              </code>
                              <span className="leading-relaxed">
                                {p.meaning}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {active.terms && active.terms.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">
                          句中的术语 · 点「收进卡包」收藏
                        </p>
                        <ul className="flex flex-col gap-2">
                          {active.terms.map((term) => {
                            const collected = collectedIds.has(term.id);
                            return (
                              <li
                                key={term.id}
                                className="rounded-lg border bg-card p-4"
                              >
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <p className="font-semibold">
                                    {term.term}
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                      {term.en}
                                    </span>
                                  </p>
                                  <Button
                                    size="sm"
                                    variant={
                                      collected ? "secondary" : "outline"
                                    }
                                    onClick={() => onCollectTerm(term)}
                                    disabled={collected}
                                    aria-label={
                                      collected
                                        ? `${term.term} 已在卡包`
                                        : `收藏术语 ${term.term}`
                                    }
                                  >
                                    {collected ? (
                                      <>
                                        <Check
                                          className="size-3.5"
                                          aria-hidden
                                        />
                                        已在卡包
                                      </>
                                    ) : (
                                      <>
                                        <Plus
                                          className="size-3.5"
                                          aria-hidden
                                        />
                                        收进卡包
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <p className="leading-relaxed text-muted-foreground">
                                  {term.explain}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </>
                ) : onExplain ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/30 p-4">
                    <p className="leading-relaxed text-muted-foreground">
                      这句还没拆解。让 AI 依据论文上下文，生成当前档位的「人话版」、这句话在全文的作用，以及关键术语卡。
                    </p>
                    <Button
                      onClick={() => onExplain(active)}
                      disabled={generatingId === active.id}
                      className="self-start"
                    >
                      <Sparkles className="size-4" aria-hidden />
                      {generatingId === active.id
                        ? "AI 拆解中…"
                        : "AI 完整拆解这句"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    这句话暂未提供人话版。
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}