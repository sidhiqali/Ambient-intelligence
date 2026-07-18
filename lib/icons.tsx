import React from "react";

type P = { size?: number; color?: string; stroke?: number; style?: React.CSSProperties };

export function Icon({ d, size = 18, color = "currentColor", stroke = 1.7, fill = "none", style }: P & { d: string; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

// Common path strings reused across the app
export const P = {
  logo: "M3 12h4l2 6 4-14 2 8h6",
  chevronRight: "M9 6l6 6-6 6",
  chevronLeft: "M15 6l-6 6 6 6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  check: "M20 6L9 17l-5-5",
  shield: "M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z",
  shieldCheck: "M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z M9 12l2 2 4-4",
  mic: "M9 2h6v12a3 3 0 01-6 0zM5 10v1a7 7 0 0014 0v-1M12 18v4",
  video: "M23 7l-7 5 7 5V7zM1 5h15v14H1z",
  camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
  text: "M4 6h16M4 12h16M4 18h10",
  sparkles: "M12 8V4M8 12H4M12 16v4M16 12h4M6.3 6.3l2.8 2.8M17.7 6.3l-2.8 2.8",
  ai: "M12 8V4M8 12H4M12 16v4M16 12h4",
  alertTri: "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  alertCircle: "M12 8v4M12 16h.01M12 3a9 9 0 100 18 9 9 0 000-18z",
  info: "M12 16v-4M12 8h.01 M12 3a9 9 0 100 18 9 9 0 000-18z",
  clock: "M12 8v4l3 2 M12 3a9 9 0 100 18 9 9 0 000-18z",
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  calendar: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  list: "M3 5h18M3 12h18M3 19h18",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L14.5 3h-4l-.3 2.4a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1L10.5 21h4l.3-2.4a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6a7 7 0 00.1-1z",
  bell: "M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4-4",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  pill: "M10.5 3.5l10 10a5 5 0 01-7 7l-10-10a5 5 0 017-7zM7 7l10 10",
  heart: "M12 21C5.5 17 3 13.5 3 9.5A4.5 4.5 0 0112 6a4.5 4.5 0 019 3.5c0 4-2.5 7.5-9 11.5z",
  watch: "M9 2h6l1 5-1 10H8L7 7zM6 12h.01",
  drop: "M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z",
  gauge: "M12 12l4-2M12 21a9 9 0 100-18 9 9 0 000 18z",
  upload: "M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4",
  trendUp: "M3 17l6-6 4 4 7-7M17 8h4v4",
  trendDown: "M3 7l6 6 4-4 7 7M17 16h4v-4",
  plus: "M12 5v14M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
  quote: "M8 12h8M12 8v8",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  arrowDown: "M12 5v14M5 12l7 7 7-7",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0114.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0020.5 15",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z",
  phone: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8 9.6a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z",
  phoneEnd: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8 9.6a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z M2 2l20 20",
  speaker: "M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14",
};
