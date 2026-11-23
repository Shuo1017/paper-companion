export interface Term {
  id: string;
  term: string;
  en: string;
  explain: string;
}

export interface FormulaPart {
  symbol: string;
  meaning: string;
}

export interface Formula {
  plain: string;
  parts: FormulaPart[];
}

export interface Sentence {
  id: string;
  text: string;
  /** 五档理解度译文：小学生 / 高中生 / 本科生 / 研究生 / 审稿人 */
  translations: [string, string, string, string, string];
  /** 这句话在全文中的作用 */
  role: string;
  terms?: Term[];
  formula?: Formula;
}

export interface Section {
  id: string;
  title: string;
  note?: string;
  sentences: Sentence[];
}

/** 完整原文的一个小节：可选标题 + 若干自然段 */
export interface PaperBlock {
  heading?: string;
  paragraphs: string[];
}

/** 思维导图节点类型：中心主张 / 章节 / 关键论点 / 术语 */
export type MindNodeKind = "root" | "section" | "point" | "term";

export interface MindNode {
  id: string;
  /** 节点主文字 */
  label: string;
  /** 可选补充说明 */
  detail?: string;
  kind: MindNodeKind;
  /** section 节点可绑定到论文里的具体章节 id，用于「去读这节」精确跳转 */
  sectionId?: string;
  children?: MindNode[];
}

export interface Paper {
  id: string;
  title: string;
  titleZh: string;
  authors: string;
  venue: string;
  year: number;
  url: string;
  sourceNote: string;
  sections: Section[];
  /** 论证脉络思维导图；内置样论文手工精修，上传论文由 AI 实时生成后写入 */
  mindmap?: MindNode;
  /** 完整原文（阅读器视图）：内置论文手工整理关键章节，上传 PDF 自动按段落抽取 */
  fullText?: PaperBlock[];
}

export const LEVELS = [
  { name: "小学生", tag: "比喻版", desc: "全是大白话和打比方，零基础也能懂" },
  { name: "高中生", tag: "直觉版", desc: "用高中学过的知识建立直觉" },
  { name: "本科生", tag: "入门版", desc: "衔接课堂知识，术语开始登场" },
  { name: "研究生", tag: "专业版", desc: "学术表达，关注方法与细节" },
  { name: "审稿人", tag: "批判版", desc: "带着挑刺的眼光审视每个论断" },
] as const;

export type LevelIndex = 0 | 1 | 2 | 3 | 4;