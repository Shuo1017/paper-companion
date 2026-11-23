import { useState } from "react";
import { Layers, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Term } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardsViewProps {
  cards: Term[];
  onRemove: (id: string) => void;
  onGoRead: () => void;
}

function TermCard({
  card,
  onRemove,
}: {
  card: Term;
  onRemove: (id: string) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className={cn("flip-card h-44", flipped && "flipped")}>
      <div className="flip-card-inner">
        <div
          className={cn(
            "flip-card-face flex cursor-pointer flex-col justify-between rounded-lg border bg-card p-4 shadow-sm",
            flipped && "invisible"
          )}
          onClick={() => setFlipped(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`术语卡 ${card.term}，点击翻面看解释`}
        >
          <div>
            <p className="font-display text-xl font-semibold">{card.term}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.en}</p>
          </div>
          <p className="text-xs text-primary">点击翻面 · 先自己回忆一下意思</p>
        </div>
        <div
          className={cn(
            "flip-card-face flip-card-back flex cursor-pointer flex-col justify-between rounded-lg border border-primary/40 bg-card p-4 shadow-sm",
            !flipped && "invisible"
          )}
          onClick={() => setFlipped(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped(false);
            }
          }}
          role="button"
          tabIndex={flipped ? 0 : -1}
          aria-label={`${card.term} 的解释，点击翻回`}
        >
          <p className="scrollbar-thin overflow-y-auto text-sm leading-relaxed">
            {card.explain}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">点击翻回正面</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(card.id);
              }}
              aria-label={`移除术语卡 ${card.term}`}
            >
              <Trash2 className="size-3.5" aria-hidden />
              移除
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardsView({ cards, onRemove, onGoRead }: CardsViewProps) {
  return (
    <div className="flex flex-col gap-[calc(1.25rem*var(--site-space))]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Layers className="size-4 text-primary" aria-hidden />
          术语卡包
          <span className="text-sm font-normal text-muted-foreground">
            {cards.length} 张
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          拆解句子时收藏的术语都在这里 · 点卡片翻面复习
        </p>
      </div>
      {cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="font-display text-lg">卡包还空着</p>
          <p className="max-w-md text-sm text-muted-foreground">
            去阅读页点击任意句子，在「红笔拆解」里把术语收进卡包。
            收集到的术语可以随时翻面复习——用自己的话能讲出来，才算真的懂。
          </p>
          <Button onClick={onGoRead}>去读论文</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[calc(1rem*var(--site-space))] sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <TermCard key={card.id} card={card} onRemove={onRemove} />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        卡包保存在本机浏览器中，不会上传。
      </p>
    </div>
  );
}