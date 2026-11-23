import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  FileCheck2,
  Quote,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  feynmanReply,
  generateReport,
  type FeynmanMessage,
  type FeynmanReport,
  type Verdict,
} from "@/lib/ai";
import { cn } from "@/lib/utils";

interface FeynmanViewProps {
  paperTitle: string;
  sectionTitle: string;
  onBack: () => void;
}

const VERDICT_META: Record<
  Verdict,
  { label: string; className: string; dot: string }
> = {
  solid: {
    label: "真懂",
    className: "text-chart-2",
    dot: "bg-chart-2",
  },
  shaky: {
    label: "一知半解",
    className: "text-chart-4",
    dot: "bg-chart-4",
  },
  parrot: {
    label: "鹦鹉学舌",
    className: "text-primary",
    dot: "bg-primary",
  },
};

export function FeynmanView({
  paperTitle,
  sectionTitle,
  onBack,
}: FeynmanViewProps) {
  const [messages, setMessages] = useState<FeynmanMessage[]>([
    {
      role: "assistant",
      content: `我是小通，出了名较真的师弟。今天你来讲《${paperTitle}》的「${sectionTitle}」，我来听。\n\n规则很简单：用你自己的话讲，别背原文。你讲一段，我就追问一段——哪里讲不清，我就戳哪里。讲完点「生成体检报告」，看看你是真懂还是在装懂。\n\n开始吧，这一节到底讲了什么？`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FeynmanReport | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const userTurns = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, streaming, report]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    if (text.length > 2000) {
      setError("一次讲解请控制在 2000 字以内，讲重点就好。");
      return;
    }
    setError(null);
    const next: FeynmanMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setStreaming("");
    try {
      const reply = await feynmanReply(next, paperTitle, sectionTitle, (acc) =>
        setStreaming(acc)
      );
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        /[\u4e00-\u9fff]/.test(msg)
          ? msg
          : "小通走神了（服务暂时不可用），请稍后再试。你讲的内容我还记得。"
      );
    } finally {
      setBusy(false);
      setStreaming(null);
    }
  }

  async function makeReport() {
    if (reportBusy || userTurns === 0) return;
    setReportBusy(true);
    setError(null);
    try {
      const r = await generateReport(messages, paperTitle, sectionTitle);
      setReport(r);
    } catch {
      setError("报告生成失败，请稍后再试。");
    } finally {
      setReportBusy(false);
    }
  }

  function restart() {
    setReport(null);
    setMessages([
      {
        role: "assistant",
        content: `再来一轮！还是《${paperTitle}》的「${sectionTitle}」。这次试着把上次被戳穿的地方讲清楚。开始吧。`,
      },
    ]);
  }

  const verdictLabel = (v: Verdict) => VERDICT_META[v].label;

  // 组装可分享的纯文本体检单（含逐字原话证据）。
  function buildShareText(r: FeynmanReport) {
    const lines: string[] = [
      "【论文通解 · 理解体检单】",
      `《${paperTitle}》 · ${sectionTitle}`,
      `真实理解度：${r.score}/100` +
        (typeof r.paraphraseRate === "number"
          ? `   复述率：${r.paraphraseRate}%`
          : ""),
      `总评：${r.overall}`,
      "",
    ];
    r.items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.point} —— ${verdictLabel(it.verdict)}`);
      if (it.quote) lines.push(`   我的原话：「${it.quote}」`);
      lines.push(`   小通点评：${it.comment}`);
      if (it.reread) lines.push(`   回读建议：${it.reread}`);
    });
    lines.push("", `由 论文通解 生成 · ${window.location.origin}`);
    return lines.join("\n");
  }

  async function copyShare() {
    if (!report) return;
    const text = buildShareText(report);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* 忽略：仍给出已复制提示 */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // 把体检单画到 canvas 上导出 PNG，作为可分享的图片卡片。
  function downloadCard() {
    if (!report) return;
    const r = report;
    const W = 1000;
    const PAD = 64;
    const itemStartY = 360;
    const rowH = 60;
    const H = itemStartY + r.items.length * rowH + 96;
    const scale = 2; // 高清导出
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    // 背景：深空 + 靛蓝辉光
    ctx.fillStyle = "#08070f";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.85, 0, 40, W * 0.85, 0, 620);
    glow.addColorStop(0, "rgba(99,102,241,0.35)");
    glow.addColorStop(1, "rgba(99,102,241,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const zhFont = "'PingFang SC','Microsoft YaHei','Noto Sans SC',system-ui,sans-serif";
    const ink = "#eef0ff";
    const muted = "#a7a9c4";
    const primary = "#8b93ff";

    // 顶部标签
    ctx.fillStyle = primary;
    ctx.font = `600 22px ${zhFont}`;
    ctx.fillText("论文通解 · 理解体检单", PAD, 72);
    ctx.fillStyle = muted;
    ctx.font = `400 18px ${zhFont}`;
    ctx.fillText(sectionTitle, PAD, 104);

    // 论文标题（折行）
    ctx.fillStyle = ink;
    ctx.font = `700 30px ${zhFont}`;
    let ty = 150;
    for (const ln of wrap(ctx, paperTitle, W - PAD * 2 - 150)) {
      ctx.fillText(ln, PAD, ty);
      ty += 40;
    }

    // 分数环
    const cx = W - PAD - 60;
    const cy = 176;
    ctx.lineWidth = 12;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.arc(cx, cy, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = primary;
    ctx.beginPath();
    ctx.arc(cx, cy, 58, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * r.score) / 100);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.font = `800 44px ${zhFont}`;
    ctx.fillText(String(r.score), cx, cy + 6);
    ctx.font = `400 15px ${zhFont}`;
    ctx.fillStyle = muted;
    ctx.fillText("真实理解度", cx, cy + 30);
    ctx.textAlign = "left";

    // 复述率条
    if (typeof r.paraphraseRate === "number") {
      const barY = 270;
      const barW = W - PAD * 2;
      ctx.fillStyle = muted;
      ctx.font = `500 18px ${zhFont}`;
      ctx.fillText(`复述率 ${r.paraphraseRate}%（越低越好 · 越高越像鹦鹉学舌）`, PAD, barY);
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(PAD, barY + 16, barW, 14);
      ctx.fillStyle = primary;
      ctx.fillRect(PAD, barY + 16, (barW * r.paraphraseRate) / 100, 14);
    }

    // 总评
    ctx.fillStyle = muted;
    ctx.font = `400 18px ${zhFont}`;
    let oy = itemStartY - 24;
    for (const ln of wrap(ctx, "总评：" + r.overall, W - PAD * 2)) {
      ctx.fillText(ln, PAD, oy);
      oy += 26;
    }

    // 各判定点
    const dotColors: Record<Verdict, string> = {
      solid: "#34d399",
      shaky: "#fbbf24",
      parrot: "#8b93ff",
    };
    r.items.forEach((it, i) => {
      const yy = Math.max(itemStartY, oy + 24) + i * rowH;
      ctx.fillStyle = dotColors[it.verdict] || primary;
      ctx.beginPath();
      ctx.arc(PAD + 8, yy - 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.font = `600 20px ${zhFont}`;
      ctx.fillText(it.point.slice(0, 26), PAD + 30, yy);
      ctx.fillStyle = dotColors[it.verdict] || primary;
      ctx.font = `500 18px ${zhFont}`;
      ctx.textAlign = "right";
      ctx.fillText(verdictLabel(it.verdict), W - PAD, yy);
      ctx.textAlign = "left";
    });

    const out = document.createElement("a");
    out.download = `理解体检单-${sectionTitle}.png`;
    out.href = canvas.toDataURL("image/png");
    out.click();
  }

  // canvas 折行工具（返回不超过 maxW 的行）。
  function wrap(c: CanvasRenderingContext2D, text: string, maxW: number) {
    const chars = Array.from(String(text));
    const lines: string[] = [];
    let cur = "";
    for (const ch of chars) {
      if (c.measureText(cur + ch).width > maxW && cur) {
        lines.push(cur);
        cur = ch;
      } else {
        cur += ch;
      }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  }

  return (
    <div className="flex flex-col gap-[calc(1.25rem*var(--site-space))]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden />
            回去继续读
          </Button>
          <h2 className="font-display text-lg font-semibold">
            费曼考官 · 小通
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {paperTitle} · {sectionTitle}
        </p>
      </div>

      {report ? (
        <section
          aria-label="理解度体检报告"
          className="rounded-xl border bg-card p-[calc(1.5rem*var(--site-space))]"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
              <FileCheck2 className="size-5 text-primary" aria-hidden />
              理解度体检报告
            </h3>
            <p className="font-display text-3xl font-bold text-primary">
              {report.score}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / 100
              </span>
            </p>
          </div>

          {typeof report.paraphraseRate === "number" && (
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  复述率（越低说明越是用自己的话讲通）
                </span>
                <span className="font-semibold">
                  {report.paraphraseRate}%
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={report.paraphraseRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="复述率"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${report.paraphraseRate}%` }}
                />
              </div>
            </div>
          )}

          <p className="annotation-card mb-4 rounded-r-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed">
            {report.overall}
          </p>
          <ul className="flex flex-col gap-3">
            {report.items.map((item) => {
              const meta = VERDICT_META[item.verdict];
              return (
                <li key={item.point} className="rounded-lg border p-4 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-semibold">{item.point}</p>
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold",
                        meta.className
                      )}
                    >
                      <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
                      {meta.label}
                    </span>
                  </div>
                  {item.quote && (
                    <blockquote className="mb-2 flex gap-2 rounded-lg bg-muted/40 px-3 py-2 text-[0.9rem] leading-relaxed">
                      <Quote className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                      <span>
                        <span className="text-xs text-muted-foreground">你的原话：</span>
                        「{item.quote}」
                      </span>
                    </blockquote>
                  )}
                  <p className="leading-relaxed text-muted-foreground">
                    {item.comment}
                  </p>
                  {item.reread && (
                    <p className="mt-1.5 text-xs text-primary">
                      回读建议：{item.reread}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={restart}>再讲一轮</Button>
            <Button variant="outline" onClick={onBack}>
              回去回读标注段落
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">分享这份体检单：</span>
              <Button variant="outline" size="sm" onClick={() => void copyShare()}>
                <Copy className="size-3.5" aria-hidden />
                {copied ? "已复制" : "复制文案"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCard}>
                <Download className="size-3.5" aria-hidden />
                下载卡片
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section
            aria-label="费曼对话"
            className="flex h-[26rem] flex-col overflow-hidden rounded-xl border bg-card sm:h-[30rem]"
          >
            <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2.5",
                    m.role === "user" && "flex-row-reverse"
                  )}
                >
                  {m.role === "assistant" && (
                    <span className="seal mt-0.5 !size-8 shrink-0 !text-sm" aria-hidden>
                    通
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/70"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && streaming ? (
                <div className="flex gap-2.5">
                  <span className="seal mt-0.5 !size-8 shrink-0 !text-sm" aria-hidden>
                    通
                  </span>
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-secondary/70 px-3.5 py-2.5 text-sm leading-relaxed">
                    {streaming}
                    <span className="streaming-caret ml-0.5 text-primary" aria-hidden>
                      ▍
                    </span>
                  </div>
                </div>
              ) : busy ? (
                <p className="pl-11 text-sm text-muted-foreground" role="status">
                  小通正在想怎么追问你……
                </p>
              ) : null}
              <div ref={bottomRef} />
            </div>
            <div className="border-t p-3">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="用你自己的话讲这一节……（Enter 发送，Shift+Enter 换行）"
                  aria-label="输入你的讲解"
                  className="min-h-16 flex-1 resize-none text-sm"
                  disabled={busy}
                />
                <Button
                  onClick={() => void send()}
                  disabled={busy || !input.trim()}
                  aria-label="发送讲解"
                  className="self-end"
                >
                  <Send className="size-4" aria-hidden />
                  讲给他听
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  已讲 {userTurns} 轮 · 讲得越多，体检越准
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void makeReport()}
                  disabled={userTurns === 0 || reportBusy || busy}
                >
                  <FileCheck2 className="size-4" aria-hidden />
                  {reportBusy ? "体检中…" : "生成体检报告"}
                </Button>
              </div>
            </div>
          </section>
          {error && (
            <p className="text-sm text-primary" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}