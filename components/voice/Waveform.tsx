"use client";

interface WaveformProps {
  active: boolean;
}

export function Waveform({ active }: WaveformProps) {
  const bars = [3, 5, 8, 5, 9, 4, 7, 5, 3, 6];

  return (
    <span
      className="inline-flex items-center gap-[2px]"
      aria-hidden="true"
      style={{ height: 16 }}
    >
      {bars.map((base, i) => (
        <span
          key={i}
          className="rounded-full flex-shrink-0 transition-all"
          style={{
            width: 2,
            background: active ? "var(--accent)" : "var(--text-disabled)",
            height: active ? undefined : 4,
            minHeight: 2,
            animation: active
              ? `waveBar ${0.6 + i * 0.08}s ease-in-out ${i * 0.05}s infinite alternate`
              : "none",
            "--bar-max": `${base + 4}px`,
            "--bar-min": `${Math.max(2, base - 3)}px`,
          } as React.CSSProperties}
        />
      ))}

      <style>{`
        @keyframes waveBar {
          from { height: var(--bar-min); }
          to   { height: var(--bar-max); }
        }
      `}</style>
    </span>
  );
}
