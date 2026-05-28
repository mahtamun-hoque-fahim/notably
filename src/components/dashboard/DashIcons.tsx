import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const stroke = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const HomeIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-7H9v7H5a2 2 0 01-2-2v-9z" />
  </svg>
);

export const UsersIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 21v-1a6 6 0 0112 0v1" />
    <circle cx="17" cy="6" r="2.5" />
    <path d="M21 21v-1a5 5 0 00-4-4.9" />
  </svg>
);

export const DollarIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <path d="M12 3v18" />
    <path d="M16 7h-5a2.5 2.5 0 000 5h2a2.5 2.5 0 010 5H8" />
  </svg>
);

export const NotesIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M9 9h8M9 13h8M9 17h5" />
  </svg>
);

export const SignalIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <path d="M4 18v-2M9 18v-6M14 18v-9M19 18V5" />
  </svg>
);

export const ClockIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const TrendIcon = ({ size = 14, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <path d="M3 17l6-6 4 4 8-9" />
    <path d="M14 6h7v7" />
  </svg>
);

export const PlugIconD = ({ size = 18, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 01-12 0z" />
    <path d="M12 17v5" />
  </svg>
);

export const ShieldIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
  </svg>
);

export const BackIconD = ({ size = 16, ...p }: IconProps) => (
  <svg {...stroke(size)} strokeWidth={2} {...p}>
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

export const TrashIconD = ({ size = 16, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
  </svg>
);

export const SearchIconD = ({ size = 16, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export const MicFillD = ({ size = 12, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <rect x="9" y="3" width="6" height="13" rx="3" />
  </svg>
);
