# 论文通解 · Paper Companion

> 你的第一篇论文，从人话开始读。

一个面向本科生/科研新手的论文精读工具。上传 PDF 或从论文库检索，逐句生成五档"人话版"解释、红笔拆解、术语卡包，还能让"费曼考官"追问你是否真懂。

核心特点：**无需后端、无需部署密钥**。AI 能力通过你自己申请的 API Key 在浏览器里直连模型服务商，Key 只存本地，不经过任何第三方中转。

---

## 功能

- **五档渐进阅读**：小学生 → 高中生 → 本科生 → 研究生 → 审稿人，同一句话切换不同深度的讲法
- **逐句人话拆解**：点击任意句子，AI 生成当前档位的人话版、句子在论文里的作用、关键术语卡
- **红笔批注**：像师兄在你论文上圈重点一样，标出转折、动机、证据
- **术语卡包**：一键收集遇到的术语，本地保存，随时复习
- **费曼考官**：AI 扮演考官苏格拉底式追问，生成"理解度体检报告"，检测你是否在鹦鹉学舌
- **论证思维导图**：一键把论文骨架整理成树状图
- **PDF 上传精读**：浏览器本地解析 PDF（pdf.js），不上传文件
- **论文库检索**：OpenAlex 实时元数据 + 精选经典论文兜底；arXiv HTML 全文直连抓取
- **3D 下潜封面**：Three.js 手搓的 MacBook 开盖动画（WebGL 不可用时自动降级 CSS）
- **本地存储**：阅读进度、卡牌、偏好全在浏览器 localStorage

---

## 快速开始

### 1. 本地运行

需要 Node.js `^22.13.0 || >=24.0.0`。

```bash
npm install
npm run dev
```

打开终端输出的 `http://127.0.0.1:5173`。

> 不配 API Key 也能用：PDF 解析、术语卡包、阅读进度、内置精选论文的预生成译文都可用。AI 相关的按钮会提示你去配置。

### 2. 配置 AI（可选，解锁全部功能）

点右上角 ⚙️ 按钮，选择服务商、填入 API Key 和模型名，点"测试并保存"。

| 服务商 | 推荐模型 | Key 申请地址 |
|---|---|---|
| DeepSeek（推荐，便宜中文好） | `deepseek-chat` | platform.deepseek.com |
| 通义千问 | `qwen-plus` | dashscope.console.aliyun.com |
| Moonshot (Kimi) | `moonshot-v1-8k` | platform.moonshot.cn |
| OpenAI | `gpt-4o-mini` | platform.openai.com |
| 自定义 | 任意 OpenAI 兼容端点 | — |

Key 保存在 `localStorage`，只在你自己的浏览器里，项目不会把它发到任何地方。

### 3. 构建静态站点

```bash
npm run build
npm run preview
```

产物在 `dist/`，可直接部署到 GitHub Pages / Netlify / Vercel / 任意静态托管。

---

## 技术栈

React 19 · TypeScript 5.9 · Vite 8 · Tailwind CSS 4 · shadcn/ui · pdf.js · Recharts · Three.js（本地 vendored，零 CDN）

**架构**：纯前端 SPA。唯一的网络请求是（1）你配置的模型 API（浏览器直连）、（2）OpenAlex 元数据 API、（3）arXiv HTML 全文。没有自建服务器，没有数据库。

---

## 目录结构

```
src/                  React 应用入口与封面门（CoverGate）
components/           各功能视图与 UI 组件
  SettingsPanel.tsx   API Key 设置面板
  ReaderView.tsx      渐进阅读主界面
  FeynmanView.tsx     费曼考官
  LibraryView.tsx     论文库
  CardsView.tsx       术语卡包
lib/
  ai.ts               用户自带 Key 的 AI 客户端（OpenAI 兼容协议）
  arxiv.ts            OpenAlex 检索 + arXiv HTML 全文
  pdf.ts              浏览器端 PDF 解析
  store.ts            localStorage 读写
data/                 内置精选论文与论文库
public/cover/         3D 下潜封面原型（独立 HTML + Three.js）
screenshots/          功能截图
```

---

## 隐私与安全

- API Key 只存浏览器 `localStorage`，不上传、不记录、不经过中转服务器
- PDF 文件在浏览器本地解析，不会上传到任何地方
- 阅读进度、术语卡、偏好均存本地
- 清理密钥：设置面板点"清除"，或浏览器清站点数据

---

## 许可

MIT License — 详见 [LICENSE](LICENSE)。

内置精选论文的导读文案与原论文元数据来自公开来源；3D 封面中老师照片为演示素材，商用前请替换为自有授权素材。
