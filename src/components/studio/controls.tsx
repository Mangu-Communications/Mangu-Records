import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function ParamSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(v[0] ?? value)} />
    </div>
  );
}
