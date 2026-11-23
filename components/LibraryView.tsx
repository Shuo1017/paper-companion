import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookMarked,
  Code2,
  FileText,
  Radio,
  Search,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CURATED_ONLY,
  DOMAINS,
  LIBRARY,
  SEED_IDS,
  arxivBaseId,
  curatedFor,
  mapPrimaryCategory,
  type LibraryEntry,
} from "@/data/library";
import {
  fetchByIds,
  fetchPaperBody,
  searchArxiv,
  type ArxivRecord,
  type ArxivSource,
} from "@/lib/arxiv";
import { buildLivePaper } from "@/lib/livePaper";
import type { Paper } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LibraryViewProps {
  /** 点击「开始精读」：切到对应内置论文并进入阅读视图 */
  onRead: (paperId: string) => void;
  /** 点击「在线精读 / 读真实全文」：把实时抓取的 arXiv 论文交给上层并打开 */
  onReadLive: (paper: Paper) => void;
}

type SortKey = "year" | "difficulty" | "title";

const DIFF_LABEL = ["", "很友好", "较难读", "中等偏易", "中等偏难", "硬核"];

/** 视图模型：合并「arXiv 实时元数据」与「内置中文导读层」。 */
interface CardVM {
  key: string;
  arxivId?: string;
  title: string;
  titleZh?: string;
  authors: string;
  year: number;
  domain: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  blurb: string;
  venue?: string;
  absUrl: string;
  pdfUrl?: string;
  code?: string;
  refinedPaperId?: string;
  category?: string;
  fromArxiv: boolean;
  /** arXiv 实时记录原文，用于「在线精读」就地抓取全文（精选卡片为 undefined）。 */
  record?: ArxivRecord;
}

function formatAuthors(list: string[]): string {
  if (!list.length) return "作者信息未知";
  if (list.length === 1) return list[0];
  return `${list[0]} 等 ${list.length} 人`;
}

function summarize(s: string): string {
  const t = (s || "").trim();
  if (!t) return "arXiv 暂未提供摘要。";
  return t.length <= 180 ? t : t.slice(0, 179).trimEnd() + "…";
}

function vmFromRecord(rec: ArxivRecord): CardVM {
  const curated = curatedFor(rec.arxivId || rec.id);
  return {
    key: rec.arxivId || rec.id,
    arxivId: rec.id,
    title: rec.title,
    titleZh: curated?.titleZh,
    authors: curated?.authors ?? formatAuthors(rec.authors),
    year: rec.year,
    domain: curated?.domain ?? mapPrimaryCategory(rec.primaryCategory),
    difficulty: curated?.difficulty,
    blurb: curated?.blurb ?? summarize(rec.summary),
    venue: curated?.venue,
    absUrl: rec.absUrl,
    pdfUrl: rec.pdfUrl,
    code: curated?.code,
    refinedPaperId: curated?.refinedPaperId,
    category: rec.primaryCategory,
    fromArxiv: true,
    record: rec,
  };
}

function vmFromCurated(e: LibraryEntry): CardVM {
  return {
    key: e.id,
    arxivId: arxivBaseId(e) ?? undefined,
    title: e.title,
    titleZh: e.titleZh,
    authors: e.authors,
    year: e.year,
    domain: e.domain,
    difficulty: e.difficulty,
    blurb: e.blurb,
    venue: e.venue,
    absUrl: e.arxiv ?? "",
    pdfUrl: e.pdf,
    code: e.code,
    refinedPaperId: e.refinedPaperId,
    category: "",
    fromArxiv: false,
  };
}

export function LibraryView({ onRead, onReadLive }: LibraryViewProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const [domain, setDomain] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("year");

  const [cards, setCards] = useState<CardVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ArxivSource>("arxiv");
  const [fallback, setFallback] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const seq = useRef(0);

  // 输入防抖：400ms 内不再变化才真正发起检索。
  useEffect(() => {
    const t = setTimeout(() => setActive(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const my = ++seq.current;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const result = active
          ? await searchArxiv(active, { max: 15 })
          : await fetchByIds(SEED_IDS, 30);
        if (cancelled || my !== seq.current) return;

        if (!active) {
          const grid = result.records.map(vmFromRecord);
          if (grid.length) {
            // 追加没有 arXiv 版本的内置精选（如 JMLR 上的 Dropout）。
            setCards([...grid, ...CURATED_ONLY.map(vmFromCurated)]);
            setFallback(false);
          } else {
            setCards(LIBRARY.map(vmFromCurated));
            setFallback(result.source === "arxiv");
          }
        } else {
          setCards(result.records.map(vmFromRecord));
          setFallback(false);
          setDegraded(result.degraded === true);
        }
        setSource(result.source);
      } catch (e) {
        if (cancelled || my !== seq.current) return;
        if (!active) {
          setCards(LIBRARY.map(vmFromCurated));
          setFallback(true);
          setError(null);
        } else {
          setCards([]);
          setError(e instanceof Error ? e.message : "arXiv 检索失败，请稍后重试。");
        }
      } finally {
        if (!cancelled && my === seq.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  const visible = useMemo(() => {
    const list = cards.filter((c) => domain === "all" || c.domain === domain);
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "year") return b.year - a.year;
      if (sort === "difficulty") return (a.difficulty ?? 9) - (b.difficulty ?? 9);
      return a.title.localeCompare(b.title);
    });
    return sorted;
  }, [cards, domain, sort]);

  const statusText = fallback
    ? "在线检索暂不可用，当前展示内置精选清单"
    : active
      ? degraded
        ? "在线检索繁忙（限流/超时），稍后再试或换个关键词"
        : `OpenAlex 实时检索 · ${visible.length} 条结果`
      : "元数据实时来自 OpenAlex / arXiv";

  return (
    <div className="flex flex-col gap-[calc(1.25rem*var(--site-space))]">
      {/* 说明 + 搜索 */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-[calc(1.5rem*var(--site-space))]">
        <div className="flex items-start gap-3">
          <BookMarked className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold">论文资源库</h2>
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs font-normal"
              >
                <Radio className="size-3" aria-hidden />
                {fallback ? "精选" : "实时"}
              </Badge>
            </div>
            <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">
              标题、年份与链接等元数据实时来自 OpenAlex；输入关键词即可在线检索，
              命中内置经典论文时还会附上中文导读、难度与一键精读。
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="实时检索 arXiv：标题、作者、关键词…"
              aria-label="搜索论文"
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={domain === "all"} onClick={() => setDomain("all")}>
              全部方向
            </FilterChip>
            {DOMAINS.map((d) => (
              <FilterChip key={d} active={domain === d} onClick={() => setDomain(d)}>
                {d}
              </FilterChip>
            ))}
            <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              排序
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-8 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="排序方式"
              >
                <option value="year">最新年份</option>
                <option value="difficulty">由易到难</option>
                <option value="title">标题 A–Z</option>
              </select>
            </label>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status" aria-live="polite">
            <Radio
              className={cn("size-3", !fallback && !degraded && "text-primary")}
              aria-hidden
            />
            {statusText}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setActive(query.trim())}
          >
            重试检索
          </Button>
        </div>
      ) : loading && cards.length === 0 ? (
        <SkeletonGrid />
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          {active
            ? "arXiv 没有匹配结果，换个关键词或方向试试。"
            : "暂时拉取不到论文，稍后重试。"}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((card) => (
            <LibraryCard key={card.key} card={card} onRead={onRead} onReadLive={onReadLive} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <div className="flex justify-between">
            <span className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            <span className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          </div>
          <span className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          <span className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <span className="h-3 w-full animate-pulse rounded bg-muted" />
          <span className="h-3 w-11/12 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/15 font-medium text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function LibraryCard({
  card,
  onRead,
  onReadLive,
}: {
  card: CardVM;
  onRead: (paperId: string) => void;
  onReadLive: (paper: Paper) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const liveId = card.record ? card.record.arxivId || card.record.id : undefined;

  async function goLive() {
    if (!card.record || !liveId) return;
    setBusy(true);
    setErr(null);
    try {
      const body = await fetchPaperBody(liveId);
      onReadLive(buildLivePaper(card.record, body));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "读取全文失败，稍后再试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-xs">
          {card.domain}
        </Badge>
        {card.difficulty ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DiffDots level={card.difficulty} />
            <span>{DIFF_LABEL[card.difficulty]}</span>
          </div>
        ) : card.category ? (
          <span className="text-xs text-muted-foreground">{card.category}</span>
        ) : null}
      </div>

      <div>
        <h3 className="font-display text-[0.98rem] font-semibold leading-snug">
          {card.titleZh || card.title}
        </h3>
        {card.titleZh && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {card.title}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {card.authors}
        {card.year ? ` · ${card.year}` : ""}
        {card.venue ? ` · ${card.venue}` : ""}
      </p>

      <p className="flex-1 text-sm leading-relaxed">{card.blurb}</p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {card.refinedPaperId ? (
          <Button size="sm" onClick={() => onRead(card.refinedPaperId!)}>
            <Sparkles className="size-3.5" aria-hidden />
            开始精读
          </Button>
        ) : liveId ? (
          <Button size="sm" onClick={goLive} disabled={busy}>
            {busy ? (
              <LoaderSpinner />
            ) : (
              <BookMarked className="size-3.5" aria-hidden />
            )}
            {busy ? "读取全文…" : "在线精读"}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">内置导读</span>
        )}
        {card.refinedPaperId && liveId && (
          <Button size="sm" variant="outline" onClick={goLive} disabled={busy}>
            {busy ? "读取中…" : "读真实全文"}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1">
          {card.absUrl && (
            <IconLink href={card.absUrl} label="arXiv">
              <ArrowUpRight className="size-3.5" aria-hidden />
            </IconLink>
          )}
          {card.pdfUrl && (
            <IconLink href={card.pdfUrl} label="PDF">
              <FileText className="size-3.5" aria-hidden />
            </IconLink>
          )}
          {card.code && (
            <IconLink href={card.code} label="代码">
              <Code2 className="size-3.5" aria-hidden />
            </IconLink>
          )}
        </div>
      </div>
      {err && (
        <p className="text-xs text-primary" role="alert">
          {err}
        </p>
      )}
    </li>
  );
}

function LoaderSpinner() {
  return (
    <span
      className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

function DiffDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1" title={`难度 ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full",
            i < level ? "bg-primary" : "bg-muted-foreground/30"
          )}
        />
      ))}
    </span>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`打开${label}`}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      {children}
    </a>
  );
}
