import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Layers,
  Library,
  MessageCircleQuestion,
  Settings,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardsView } from "@/components/CardsView";
import { FeynmanView } from "@/components/FeynmanView";
import { LibraryView } from "@/components/LibraryView";
import { ReaderView } from "@/components/ReaderView";
import { Starfield } from "@/components/Starfield";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SAMPLE_PAPERS } from "@/data/papers";
import { explainSentence } from "@/lib/ai";
import {
  loadCards,
  loadPrefs,
  loadReadIds,
  saveCards,
  savePrefs,
  saveReadIds,
} from "@/lib/store";
import {
  LEVELS,
  type MindNode,
  type Paper,
  type Sentence,
  type Term,
} from "@/lib/types";

type View = "read" | "library" | "feynman" | "cards";

export default function App() {
  const [prefs] = useState(() =>
    loadPrefs({ paperId: SAMPLE_PAPERS[0].id, level: 0 })
  );
  const [paperId, setPaperId] = useState(
    SAMPLE_PAPERS.some((p) => p.id === prefs.paperId)
      ? prefs.paperId
      : SAMPLE_PAPERS[0].id
  );
  const [level, setLevel] = useState(prefs.level);
  const [view, setView] = useState<View>("read");
  const [cards, setCards] = useState<Term[]>(() => loadCards());
  const [readIds, setReadIds] = useState<string[]>(() => loadReadIds());
  const [feynmanSection, setFeynmanSection] = useState(
    SAMPLE_PAPERS[0].sections[0].title
  );
  // 动态论文：既包含上传解析出的 PDF，也包含从论文库实时拉取的 arXiv 论文。
  // 二者共用同一份状态，AI 逐句拆解 / 思维导图等更新都能持久落到当前阅读会话。
  const [dynamicPapers, setDynamicPapers] = useState<Paper[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const allPapers = useMemo(
    () => [...SAMPLE_PAPERS, ...dynamicPapers],
    [dynamicPapers]
  );
  const paper = allPapers.find((p) => p.id === paperId) ?? SAMPLE_PAPERS[0];
  const collectedIds = useMemo(() => new Set(cards.map((c) => c.id)), [cards]);
  const readSet = useMemo(() => new Set(readIds), [readIds]);

  useEffect(() => {
    savePrefs({ paperId, level });
  }, [paperId, level]);

  function collectTerm(term: Term) {
    setCards((prev) => {
      if (prev.some((c) => c.id === term.id)) return prev;
      const next = [...prev, term];
      saveCards(next);
      return next;
    });
  }

  function removeCard(id: string) {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveCards(next);
      return next;
    });
  }

  function markRead(id: string) {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveReadIds(next);
      return next;
    });
  }

  function goFeynman(sectionTitle: string) {
    setFeynmanSection(sectionTitle);
    setView("feynman");
  }

  // 从论文库点「开始精读」：切到对应内置论文并进入阅读视图。
  function readFromLibrary(id: string) {
    setPaperId(id);
    setView("read");
  }

  // 从论文库点「在线精读 / 读真实全文」：加载实时构建的论文（含真实全文）。
  // 按 id 去重，命中已读过的同一篇则复用，避免重复堆叠与重复抓取。
  function readLivePaper(livePaper: Paper) {
    setDynamicPapers((prev) =>
      prev.some((p) => p.id === livePaper.id) ? prev : [...prev, livePaper]
    );
    setPaperId(livePaper.id);
    setView("read");
  }

  function handleMindmapGenerated(mindmap: MindNode) {
    setDynamicPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, mindmap } : p))
    );
  }

  async function handleUpload(file: File) {
    setUploadBusy(true);
    setUploadError(null);
    try {
      const { parsePdf } = await import("@/lib/pdf");
      const parsed = await parsePdf(file);
      setDynamicPapers((prev) => [...prev, parsed]);
      setPaperId(parsed.id);
      setView("read");
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "PDF 解析失败，请换一个文件试试。"
      );
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleExplain(sentence: Sentence) {
    if (generatingId) return;
    setGeneratingId(sentence.id);
    try {
      const section = paper.sections.find((s) =>
        s.sentences.some((x) => x.id === sentence.id)
      );
      const ctx = section?.note || section?.title || "";
      const b = await explainSentence(
        sentence.text,
        level,
        LEVELS[level].name,
        ctx
      );
      setDynamicPapers((prev) =>
        prev.map((p) =>
          p.id !== paperId
            ? p
            : {
                ...p,
                sections: p.sections.map((s) => ({
                  ...s,
                  sentences: s.sentences.map((sen) => {
                    if (sen.id !== sentence.id) return sen;
                    const translations = [...sen.translations] as Sentence["translations"];
                    translations[level] = b.human;
                    return {
                      ...sen,
                      translations,
                      role: b.role || sen.role,
                      terms: b.terms.length ? b.terms : sen.terms,
                    };
                  }),
                })),
              }
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setUploadError(
        /[\u4e00-\u9fff]/.test(msg) ? msg : "AI 拆解失败，请稍后再试。"
      );
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <>
      <Starfield />
      <div className="cosmos-shell mx-auto flex min-h-dvh max-w-6xl flex-col px-5 pb-10 sm:px-8">
      {/* 顶栏 */}
      <header className="flex flex-wrap items-center justify-between gap-3 py-6">
        <div className="flex items-center gap-3">
          <span className="seal" aria-hidden>
            通解
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight">
              论文通解
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              你的第一篇论文，从人话开始读
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="paper-select" className="sr-only">
            选择论文
          </label>
          <select
            id="paper-select"
            value={paperId}
            onChange={(e) => {
              setPaperId(e.target.value);
              setView("read");
            }}
            className="h-9 max-w-48 rounded-lg border bg-card px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-primary sm:max-w-56"
          >
            {allPapers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            aria-label="上传 PDF 论文"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
            }}
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploadBusy}
          >
            <Upload className="size-4" aria-hidden />
            {uploadBusy ? "解析中…" : "上传 PDF"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="AI 设置（自带 API Key）"
            aria-label="AI 设置"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="size-4" aria-hidden />
          </Button>
        </div>
      </header>
      {uploadError && (
        <p className="mb-3 text-sm text-primary" role="alert">
          {uploadError}
        </p>
      )}

      {/* 论文信息条 */}
      {view !== "library" && (
        <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-5 py-3 text-sm">
          <p className="font-display font-semibold">{paper.titleZh}</p>
          <p className="text-muted-foreground">
            {paper.authors} · {paper.venue}
          </p>
          <a
            href={paper.url || undefined}
            target="_blank"
            rel="noreferrer"
            className={
              paper.url
                ? "ml-auto text-primary underline-offset-4 hover:underline"
                : "ml-auto hidden"
            }
          >
            查看论文原文 ↗
          </a>
        </div>
      )}

      {/* 视图导航 */}
      <Tabs value={view} onValueChange={(v) => setView(v as View)} className="mb-5">
        <TabsList aria-label="功能导航" className="w-full sm:w-auto">
          <TabsTrigger value="read" className="gap-1.5">
            <BookOpen className="size-4" aria-hidden />
            渐进阅读
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5">
            <Library className="size-4" aria-hidden />
            论文库
          </TabsTrigger>
          <TabsTrigger value="feynman" className="gap-1.5">
            <MessageCircleQuestion className="size-4" aria-hidden />
            费曼考官
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-1.5">
            <Layers className="size-4" aria-hidden />
            术语卡包
            {cards.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 px-1.5">
                {cards.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 主内容 */}
      <main className="flex-1">
        {view === "read" && (
          <ReaderView
            key={paper.id}
            paper={paper}
            level={level}
            onLevelChange={setLevel}
            collectedIds={collectedIds}
            onCollectTerm={collectTerm}
            readIds={readSet}
            onOpenSentence={markRead}
            onGoFeynman={goFeynman}
            onExplain={handleExplain}
            generatingId={generatingId}
            onMindmapGenerated={handleMindmapGenerated}
          />
        )}
        {view === "library" && (
          <LibraryView onRead={readFromLibrary} onReadLive={readLivePaper} />
        )}
        {view === "feynman" && (
          <FeynmanView
            key={`${paper.id}-${feynmanSection}`}
            paperTitle={paper.title}
            sectionTitle={feynmanSection}
            onBack={() => setView("read")}
          />
        )}
        {view === "cards" && (
          <CardsView
            cards={cards}
            onRemove={removeCard}
            onGoRead={() => setView("read")}
          />
        )}
      </main>

      {/* 页脚 */}
      <footer className="mt-10 border-t pt-5 text-center text-xs text-muted-foreground">
        <p>论文通解 · 让第一篇论文从人话开始读</p>
        <p className="mt-1">
          <a href="https://github.com/Shuo1017/paper-companion" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">开源项目</a>
          {" · "}AI 功能需自带 API Key，密钥仅存本地
        </p>
      </footer>
      </div>
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
}