/** Inline SVG icons (no icon library). They inherit color via currentColor. */

type P = React.SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const IconBack = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 010 11H11" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
export const IconHome = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z" />
  </svg>
);
export const IconCheckCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l3 3 5-6" />
  </svg>
);
export const IconBox = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
);
export const IconTag = (p: P) => (
  <svg {...base(p)}>
    <path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
);
export const IconStore = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 9l2-5h14l2 5" />
    <path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0" />
    <path d="M5 12v8h14v-8" />
    <path d="M10 20v-5h4v5" />
  </svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21v-1a6 6 0 0112 0v1" />
    <path d="M16 4a4 4 0 010 8M22 21v-1a6 6 0 00-4-5.6" />
  </svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.5 18.5a6 6 0 0111 0" />
  </svg>
);
export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 16V11a6 6 0 10-12 0v5l-2 2h16z" />
    <path d="M10 20a2 2 0 004 0" />
  </svg>
);
export const IconHelp = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 4" />
    <path d="M12 17h.01" />
  </svg>
);
export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4H5v16h9" />
    <path d="M10 12h11M17 8l4 4-4 4" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)} strokeWidth={3}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconXCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);
export const IconPencil = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12H7zm4 2v8h1.5v-8zm2.5 0v8H14v-8z" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)} strokeWidth={3}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)} strokeWidth={2.5}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)} strokeWidth={2.5}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const IconEye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const IconEyeOff = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.8 9.8 0 005.4-1.6" />
    <path d="M9.9 9.9a3 3 0 004.2 4.2" />
  </svg>
);
export const IconWarning = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3L2 21h20z" />
    <path d="M12 10v5M12 18h.01" />
  </svg>
);
export const IconChevronLeft = (p: P) => (
  <svg {...base(p)} strokeWidth={3}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base(p)} strokeWidth={3}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base(p)} strokeWidth={2.5}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const IconImagePlus = (p: P) => (
  <svg {...base(p)} strokeWidth={1.6}>
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path d="M12 8v8M8 12h8" strokeWidth={2.5} />
  </svg>
);
export const IconMapPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconHeart = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 21l-1.4-1.3C5.4 15 2 11.9 2 8.1 2 5 4.4 2.6 7.5 2.6c1.7 0 3.4.8 4.5 2.1 1.1-1.3 2.8-2.1 4.5-2.1C19.6 2.6 22 5 22 8.1c0 3.8-3.4 6.9-8.6 11.6z" />
  </svg>
);
export const IconThumb = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M2 10h4v11H2zM8 21h9.3a2 2 0 002-1.6l1.6-7.5A2 2 0 0019 9.5h-5.2l.8-3.8a1.8 1.8 0 00-3.2-1.5L8 9z" />
  </svg>
);
export const IconDocs = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 3h9l3 3v13H8z" />
    <path d="M4 7v14h12" />
    <path d="M11 9h6M11 12h6M11 15h4" />
  </svg>
);
export const IconWhatsapp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.1-1.3c0-.1-.2-.2-.5-.3z" />
  </svg>
);
export const IconFacebook = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M14 8h3V4h-3a4 4 0 00-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z" />
  </svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);
export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
);
export const IconPower = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v9" />
    <path d="M6.3 7a8 8 0 1011.4 0" />
  </svg>
);
export const IconCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
export const IconHeadset = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 14v-2a8 8 0 0116 0v2" />
    <rect x="3" y="14" width="4" height="6" rx="1.5" />
    <rect x="17" y="14" width="4" height="6" rx="1.5" />
    <path d="M19 20a3 3 0 01-3 2h-3" />
  </svg>
);
