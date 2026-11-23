import type { Term } from "./types";

const CARDS_KEY = "lwtj.cards.v1";
const PREFS_KEY = "lwtj.prefs.v1";
const READ_KEY = "lwtj.read.v1";

export interface Prefs {
  paperId: string;
  level: number;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadCards(): Term[] {
  const cards = safeParse<Term[]>(localStorage.getItem(CARDS_KEY), []);
  return Array.isArray(cards) ? cards.filter((c) => c && c.id && c.term) : [];
}

export function saveCards(cards: Term[]): void {
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch {
    /* 存储不可用时静默降级为会话内状态 */
  }
}

export function loadPrefs(fallback: Prefs): Prefs {
  const prefs = safeParse<Partial<Prefs>>(localStorage.getItem(PREFS_KEY), {});
  return {
    paperId: typeof prefs.paperId === "string" ? prefs.paperId : fallback.paperId,
    level:
      typeof prefs.level === "number" && prefs.level >= 0 && prefs.level <= 4
        ? prefs.level
        : fallback.level,
  };
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function loadReadIds(): string[] {
  const ids = safeParse<string[]>(localStorage.getItem(READ_KEY), []);
  return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
}

export function saveReadIds(ids: string[]): void {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}