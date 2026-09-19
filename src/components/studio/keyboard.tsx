import { useMemo } from "react";
import { midiName } from "@/lib/forge/theory";

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK = [1, 3, 6, 8, 10];

export function PianoKeys({
  from = 48,
  to = 72,
  onPlay,
}: {
  from?: number;
  to?: number;
  onPlay: (midi: number) => void;
}) {
  const whites = useMemo(() => {
    const list: number[] = [];
    for (let m = from; m <= to; m++) if (WHITE.includes(m % 12)) list.push(m);
    return list;
  }, [from, to]);

  return (
    <div className="relative isolate h-20 w-full overflow-hidden rounded-lg border border-border bg-foreground">
      <div className="flex h-full">
        {whites.map((midi) => (
          <button
            key={midi}
            type="button"
            onMouseDown={() => onPlay(midi)}
            className="relative h-full flex-1 border-r border-background/20 last:border-r-0 hover:bg-background/10 active:bg-primary/25"
            aria-label={midiName(midi)}
          >
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[9px] text-background/55">
              {midiName(midi)}
            </span>
          </button>
        ))}
      </div>
      {whites.map((midi, i) => {
        const black = midi + 1;
        if (!BLACK.includes(black % 12) || black > to) return null;
        const left = ((i + 1) / whites.length) * 100;
        return (
          <button
            key={black}
            type="button"
            aria-label={midiName(black)}
            onMouseDown={(e) => {
              e.preventDefault();
              onPlay(black);
            }}
            className="absolute top-0 z-10 h-[58%] w-[5.5%] -translate-x-1/2 rounded-b-[3px] bg-background hover:bg-elevated active:bg-primary"
            style={{ left: `${left}%` }}
          />
        );
      })}
    </div>
  );
}
