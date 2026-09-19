import { useEffect, useRef } from "react";
import { getEngine } from "@/lib/forge/engine";
import { cn } from "@/lib/utils";

export function Meter({ trackId, className }: { trackId?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const data = new Uint8Array(128);
    const loop = () => {
      const engine = getEngine();
      const analyser = trackId ? engine.trackAnalysers.get(trackId) : engine.analyser;
      let peak = 0;
      if (analyser) {
        analyser.getByteTimeDomainData(data);
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs((data[i]! - 128) / 128);
          if (v > peak) peak = v;
        }
      }
      if (ref.current) {
        const pct = Math.min(100, peak * 140);
        ref.current.style.transform = `scaleY(${Math.max(0.02, pct / 100)})`;
        ref.current.style.opacity = peak > 0.02 ? "1" : "0.35";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [trackId]);

  return (
    <div className={cn("relative h-full w-1.5 overflow-hidden rounded-full bg-elevated", className)}>
      <div
        ref={ref}
        className="absolute inset-x-0 bottom-0 h-full origin-bottom rounded-full bg-primary"
        style={{ transform: "scaleY(0.02)" }}
      />
    </div>
  );
}

export function Scope({ className }: { className?: string }) {
  const pathRef = useRef<SVGPolylineElement>(null);

  useEffect(() => {
    let raf = 0;
    const data = new Uint8Array(256);
    const loop = () => {
      const analyser = getEngine().analyser;
      const el = pathRef.current;
      if (el) {
        const w = 400;
        const h = 40;
        if (analyser) {
          analyser.getByteTimeDomainData(data);
          const pts: string[] = [];
          const step = Math.max(1, Math.floor(data.length / 80));
          for (let i = 0; i < data.length; i += step) {
            const x = (i / data.length) * w;
            const y = ((data[i]! - 128) / 128) * (h * 0.42) + h / 2;
            pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
          }
          el.setAttribute("points", pts.join(" "));
        } else {
          el.setAttribute("points", `0,${20} 400,${20}`);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" className={cn("h-full w-full", className)} aria-hidden>
      <line x1="0" y1="20" x2="400" y2="20" className="stroke-border" strokeWidth="1" />
      <polyline
        ref={pathRef}
        fill="none"
        className="stroke-primary"
        strokeWidth="1.5"
        points="0,20 400,20"
      />
    </svg>
  );
}
