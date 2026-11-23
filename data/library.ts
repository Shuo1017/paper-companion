/**
 * 论文资源库：精选经典 ML / NLP / CV 论文元数据，方便使用者检索与跳转。
 * 链接均指向公开的 arXiv 摘要页 / PDF / 官方代码仓库。
 * 已在本项目内置精读的版本会带 refinedPaperId，可直接「开始精读」。
 */
export interface LibraryEntry {
  id: string;
  title: string;
  titleZh: string;
  authors: string;
  year: number;
  venue: string;
  domain: Domain;
  /** 入门难度 1–5，1 最友好 */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** 一句话中文导读 */
  blurb: string;
  arxiv?: string;
  pdf?: string;
  code?: string;
  /** 关联到 SAMPLE_PAPERS 的 id：有则可一键进入精读 */
  refinedPaperId?: string;
}

export type Domain =
  | "Transformer / 架构"
  | "大模型 / LLM"
  | "训练方法"
  | "生成模型"
  | "计算机视觉"
  | "强化学习"
  | "优化";

export const DOMAINS: Domain[] = [
  "Transformer / 架构",
  "大模型 / LLM",
  "训练方法",
  "生成模型",
  "计算机视觉",
  "强化学习",
  "优化",
];

const arxivAbs = (id: string) => `https://arxiv.org/abs/${id}`;
const arxivPdf = (id: string) => `https://arxiv.org/pdf/${id}`;

export const LIBRARY: LibraryEntry[] = [
  {
    id: "attention",
    title: "Attention Is All You Need",
    titleZh: "注意力即你所需的一切",
    authors: "Vaswani et al.",
    year: 2017,
    venue: "NeurIPS",
    domain: "Transformer / 架构",
    difficulty: 3,
    blurb: "Transformer 开山之作，用纯注意力取代循环结构，奠定大模型底座。",
    arxiv: arxivAbs("1706.03762"),
    pdf: arxivPdf("1706.03762"),
    code: "https://github.com/tensorflow/tensor2tensor",
    refinedPaperId: "attention",
  },
  {
    id: "dropout",
    title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting",
    titleZh: "Dropout：防止神经网络过拟合的简单方法",
    authors: "Srivastava et al.",
    year: 2014,
    venue: "JMLR",
    domain: "训练方法",
    difficulty: 2,
    blurb: "训练时随机「关掉」一部分神经元，打破共适应，是最经典的正则化手段。",
    pdf: "https://www.jmlr.org/papers/volume15/srivastava14a/srivastava14a.pdf",
    refinedPaperId: "dropout",
  },
  {
    id: "resnet",
    title: "Deep Residual Learning for Image Recognition",
    titleZh: "用于图像识别的深度残差学习",
    authors: "He et al.",
    year: 2016,
    venue: "CVPR",
    domain: "计算机视觉",
    difficulty: 3,
    blurb: "残差连接让上百层的网络可训练，ImageNet 冠军，几乎影响后续所有架构。",
    arxiv: arxivAbs("1512.03385"),
    pdf: arxivPdf("1512.03385"),
    code: "https://github.com/microsoft/CsResNet",
  },
  {
    id: "bert",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    titleZh: "BERT：深度双向 Transformer 的预训练",
    authors: "Devlin et al.",
    year: 2018,
    venue: "NAACL",
    domain: "大模型 / LLM",
    difficulty: 3,
    blurb: "双向预训练 + 微调范式的确立者，NLP 进入「预训练时代」的里程碑。",
    arxiv: arxivAbs("1810.04805"),
    pdf: arxivPdf("1810.04805"),
    code: "https://github.com/google-research/bert",
  },
  {
    id: "gpt3",
    title: "Language Models are Few-Shot Learners",
    titleZh: "语言模型是少样本学习者",
    authors: "Brown et al.",
    year: 2020,
    venue: "NeurIPS",
    domain: "大模型 / LLM",
    difficulty: 4,
    blurb: "GPT-3 论文：规模到 1750 亿参数后，模型无需微调即可「举一反三」。",
    arxiv: arxivAbs("2005.14165"),
    pdf: arxivPdf("2005.14165"),
  },
  {
    id: "adam",
    title: "Adam: A Method for Stochastic Optimization",
    titleZh: "Adam：一种随机优化方法",
    authors: "Kingma & Ba",
    year: 2014,
    venue: "ICLR",
    domain: "优化",
    difficulty: 2,
    blurb: "最常用的优化器之一，动量 + 自适应学习率，几乎开箱即用。",
    arxiv: arxivAbs("1412.6980"),
    pdf: arxivPdf("1412.6980"),
  },
  {
    id: "vae",
    title: "Auto-Encoding Variational Bayes",
    titleZh: "自编码变分贝叶斯",
    authors: "Kingma & Welling",
    year: 2013,
    venue: "ICLR",
    domain: "生成模型",
    difficulty: 4,
    blurb: "变分自编码器（VAE）的奠基论文，用重参数化技巧让采样可反向传播。",
    arxiv: arxivAbs("1312.6114"),
    pdf: arxivPdf("1312.6114"),
  },
  {
    id: "gan",
    title: "Generative Adversarial Networks",
    titleZh: "生成对抗网络",
    authors: "Goodfellow et al.",
    year: 2014,
    venue: "NeurIPS",
    domain: "生成模型",
    difficulty: 3,
    blurb: "生成器与判别器互相博弈，GAN 开启了对抗式生成的整个方向。",
    arxiv: arxivAbs("1406.2661"),
    pdf: arxivPdf("1406.2661"),
  },
  {
    id: "ddpm",
    title: "Denoising Diffusion Probabilistic Models",
    titleZh: "去噪扩散概率模型",
    authors: "Ho et al.",
    year: 2020,
    venue: "NeurIPS",
    domain: "生成模型",
    difficulty: 4,
    blurb: "现代图像扩散模型（如 Stable Diffusion）背后的核心方法论。",
    arxiv: arxivAbs("2006.11239"),
    pdf: arxivPdf("2006.11239"),
    code: "https://github.com/hojonathanho/diffusion",
  },
  {
    id: "alphago",
    title: "Mastering the Game of Go with Deep Neural Networks and Tree Search",
    titleZh: "用深度神经网络与树搜索掌握围棋",
    authors: "Silver et al.",
    year: 2016,
    venue: "Nature",
    domain: "强化学习",
    difficulty: 4,
    blurb: "AlphaGo 论文，深度网络 + 蒙特卡洛树搜索击败人类顶尖棋手。",
    pdf: "https://www.nature.com/articles/nature16961.pdf",
    // AlphaGo（Nature 2016）没有 arXiv 预印本，故不设 arxiv 字段：
    // 之前误挂的 1509.06407 实为天文学论文，会被实时元数据张冠李戴。
  },
  {
    id: "llama",
    title: "LLaMA: Open and Efficient Foundation Language Models",
    titleZh: "LLaMA：开放且高效的基础语言模型",
    authors: "Touvron et al.",
    year: 2023,
    venue: "arXiv",
    domain: "大模型 / LLM",
    difficulty: 3,
    blurb: "用小算力训出强性能，推动了开源大模型生态的繁荣。",
    arxiv: arxivAbs("2302.13971"),
    pdf: arxivPdf("2302.13971"),
    code: "https://github.com/meta-llama/llama",
  },
  {
    id: "chinchilla",
    title: "Training Compute-Optimal Large Language Models",
    titleZh: "训练计算最优的大语言模型",
    authors: "Hoffmann et al.",
    year: 2022,
    venue: "NeurIPS",
    domain: "大模型 / LLM",
    difficulty: 4,
    blurb: "著名的 Chinchilla 缩放律：算力固定时，参数与数据要同步放大。",
    arxiv: arxivAbs("2203.15556"),
    pdf: arxivPdf("2203.15556"),
  },
  {
    id: "cot",
    title: "Chain-of-Thought Prompting Elicits Reasoning in LLMs",
    titleZh: "思维链提示激发大模型推理能力",
    authors: "Wei et al.",
    year: 2022,
    venue: "NeurIPS",
    domain: "大模型 / LLM",
    difficulty: 2,
    blurb: "只要让模型「一步步想」，复杂推理能力显著提升， prompting 经典。",
    arxiv: arxivAbs("2201.11903"),
    pdf: arxivPdf("2201.11903"),
  },
  {
    id: "instructgpt",
    title: "Training Language Models to Follow Instructions with Human Feedback",
    titleZh: "用人类反馈训练语言模型遵循指令",
    authors: "Ouyang et al.",
    year: 2022,
    venue: "NeurIPS",
    domain: "大模型 / LLM",
    difficulty: 4,
    blurb: "InstructGPT / RLHF 论文，ChatGPT 背后「对齐」技术的关键来源。",
    arxiv: arxivAbs("2203.02155"),
    pdf: arxivPdf("2203.02155"),
  },
];

/**
 * 精选清单同时充当「中文导读层」。论文卡片的标题、作者、年份、链接等
 * 元数据实时来自 arXiv API；这里只保留人工整理的 titleZh / blurb /
 * difficulty / refinedPaperId / code，并按 arXiv 基础 id 覆盖到实时结果上。
 */

/** 从一条精选记录的 arXiv 摘要链接里取出基础 id（去掉版本与 URL 前缀）。 */
export function arxivBaseId(entry: LibraryEntry): string | null {
  if (!entry.arxiv) return null;
  const m = entry.arxiv.match(/arxiv\.org\/abs\/([^/?#]+)$/i);
  return m ? m[1] : null;
}

const CURATED_BY_ID = new Map<string, LibraryEntry>();
for (const e of LIBRARY) {
  const id = arxivBaseId(e);
  if (id) CURATED_BY_ID.set(id, e);
}

/** 按 arXiv id（可带版本号）取回中文导读覆盖层，取不到返回 undefined。 */
export function curatedFor(arxivId?: string | null): LibraryEntry | undefined {
  if (!arxivId) return undefined;
  return CURATED_BY_ID.get(arxivId.replace(/v\d+$/i, ""));
}

/** 内置精选卡片对应的 arXiv id 列表：论文库打开时默认批量拉取的种子。 */
export const SEED_IDS: string[] = [...CURATED_BY_ID.keys()];

/** 没有 arXiv 版本、只能靠内置清单展示的论文（如 JMLR 上的 Dropout）。 */
export const CURATED_ONLY: LibraryEntry[] = LIBRARY.filter(
  (e) => !arxivBaseId(e)
);

/** 把 arXiv 学科分类映射到站内领域标签，供非精选的实时结果归类与筛选。 */
export function mapPrimaryCategory(cat?: string): string {
  if (!cat) return "其他";
  const c = cat.toLowerCase();
  if (c.startsWith("cs.cl") || c.startsWith("cs.ai")) return "大模型 / LLM";
  if (c.startsWith("cs.cv") || c.startsWith("eess.iv")) return "计算机视觉";
  if (c.startsWith("cs.ne") || c === "stat.ml") return "生成模型";
  if (c.startsWith("cs.ma") || c.startsWith("cs.gt")) return "强化学习";
  if (c.startsWith("cs.lg")) return "训练方法";
  if (c.startsWith("cs.dy") || c.startsWith("cs.pf")) return "优化";
  return "其他";
}
