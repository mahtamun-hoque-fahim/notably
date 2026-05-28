"use client";

import type { ReactNode } from "react";
import s from "../../app/admin/dashboard.module.css";
import { TrendIcon } from "./DashIcons";

export function StatCard({
  icon,
  value,
  label,
  delta,
  tone = "sage",
}: {
  icon: ReactNode;
  value: string;
  label: string;
  delta?: string;
  tone?: "sage" | "blue" | "ink";
}) {
  return (
    <div className={s.stat}>
      <div className={s.statTop}>
        <span className={`${s.statIcon} ${tone === "blue" ? s.blue : tone === "ink" ? s.ink : ""}`}>
          {icon}
        </span>
        {delta && (
          <span className={s.statDelta}>
            <TrendIcon size={13} /> {delta}
          </span>
        )}
      </div>
      <div className={s.statValue}>{value}</div>
      <div className={s.statLabel}>{label}</div>
    </div>
  );
}

export function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={s.card}>
      {(title || right) && (
        <div className={s.cardHead}>
          <div>
            {title && <div className={s.cardTitle}>{title}</div>}
            {subtitle && <div className={s.cardSub}>{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      <div className={s.cardBody}>{children}</div>
    </div>
  );
}

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={s.bars}>
      {data.map((d, i) => (
        <div key={i} className={s.barCol}>
          <span className={s.barVal}>{d.value}</span>
          <div
            className={`${s.barFill} ${i === data.length - 1 ? s.today : ""}`}
            style={{ height: `${(d.value / max) * 100}%` }}
          />
          <span className={s.barLabel}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  centerMain,
  centerSub,
}: {
  segments: { label: string; value: number; color: string }[];
  centerMain: string;
  centerSub: string;
}) {
  const size = 140;
  const thickness = 22;
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((sum, x) => sum + x.value, 0) || 1;
  let offset = 0;

  return (
    <div className={s.donutWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg)" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c;
          const dash = `${len} ${c - len}`;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += len;
          return el;
        })}
        <text
          x={size / 2}
          y={size / 2 - 2}
          fontSize="22"
          fontWeight="500"
          textAnchor="middle"
          fill="var(--ink)"
          style={{ letterSpacing: "-0.02em" }}
        >
          {centerMain}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 15}
          fontSize="9"
          textAnchor="middle"
          fill="var(--ink-soft)"
          style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
        >
          {centerSub}
        </text>
      </svg>
      <div className={s.donutLegend}>
        {segments.map((seg) => (
          <div key={seg.label} className={s.legendRow}>
            <span className={s.legendSwatch} style={{ background: seg.color }} />
            <span style={{ flex: 1 }}>{seg.label}</span>
            <span className={s.legendVal}>{seg.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pill({ tone, children }: { tone: "sage" | "gray" | "blue" | "ink"; children: ReactNode }) {
  return <span className={`${s.pill} ${s[tone]}`}>{children}</span>;
}
