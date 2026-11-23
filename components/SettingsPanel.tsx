/* AI 设置面板：用户自带 API Key，本地存储，支持连接测试。 */
import { useState } from "react";
import { Check, KeyRound, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PROVIDERS, clearConfig, loadConfig, saveConfig, testConnection,
  type AiConfig,
} from "@/lib/ai";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const existing = loadConfig();
  const [provider, setProvider] = useState(existing?.provider || "deepseek");
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl || PROVIDERS.deepseek.baseUrl);
  const [apiKey, setApiKey] = useState(existing?.apiKey || "");
  const [model, setModel] = useState(existing?.model || PROVIDERS.deepseek.model);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function pickProvider(v: string) {
    setProvider(v);
    const p = PROVIDERS[v];
    if (p) { setBaseUrl(p.baseUrl); setModel(p.model); }
    setResult(null);
  }
  function persist() {
    const c: AiConfig = {
      provider: PROVIDERS[provider]?.label || provider,
      baseUrl: baseUrl.trim().replace(/\/+$/, ""),
      apiKey: apiKey.trim(),
      model: model.trim(),
    };
    saveConfig(c);
    return c;
  }
  async function test() {
    if (!apiKey.trim() || !baseUrl.trim() || !model.trim()) {
      setResult({ ok: false, message: "请把接口地址、Key 和模型名都填完整。" });
      return;
    }
    setTesting(true);
    setResult(null);
    const c: AiConfig = {
      provider, baseUrl: baseUrl.trim().replace(/\/+$/, ""),
      apiKey: apiKey.trim(), model: model.trim(),
    };
    const r = await testConnection(c);
    setResult(r);
    setTesting(false);
    if (r.ok) { saveConfig(c); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <KeyRound className="size-5 text-primary" aria-hidden />
              AI 设置
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Key 只保存在你的浏览器本地，不会上传到任何服务器。
            </p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-muted-foreground hover:text-foreground" aria-label="关闭">×</button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">服务商</span>
            <select
              value={provider}
              onChange={(e) => pickProvider(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              {Object.entries(PROVIDERS).map(([k, p]) => (
                <option key={k} value={k}>{p.label} — {p.note}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">接口地址（OpenAI 兼容）</span>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.deepseek.com/v1" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">API Key</span>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." autoComplete="off" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">模型名</span>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="deepseek-chat" />
          </label>

          {result && (
            <p className={`rounded-lg border px-3 py-2 text-sm ${result.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"}`}>
              {result.message}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={test} disabled={testing}>
              {testing ? "测试中…" : "测试并保存"}
            </Button>
            <Button variant="outline" onClick={() => { persist(); setResult({ ok: true, message: "已保存到本地。" }); }}>
              <Check className="size-4" aria-hidden /> 仅保存
            </Button>
            {existing && (
              <Button variant="ghost" onClick={() => { clearConfig(); setApiKey(""); setResult({ ok: true, message: "已清除本地密钥。" }); }}>
                <Trash2 className="size-4" aria-hidden /> 清除
              </Button>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">在哪申请 Key？</p>
            <p>DeepSeek：platform.deepseek.com · 通义：dashscope.console.aliyun.com · Moonshot：platform.moonshot.cn · OpenAI：platform.openai.com</p>
            <p className="mt-2">没有 Key 也能用 PDF 解析、术语卡包、阅读进度等本地功能；AI 相关的按钮会提示你去配置。</p>
            <Badge variant="outline" className="mt-2">OpenAI 兼容协议 · 任意服务商均可</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
