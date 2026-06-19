import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 group"
      aria-label="Fecha — inicio"
    >
      <span
        className="grid place-items-center rounded-[9px] h-8 w-8 transition-transform group-hover:-rotate-6"
        style={{
          background: "linear-gradient(180deg, var(--mint-bright), var(--mint))",
          boxShadow: "0 6px 18px -8px rgba(var(--mint-rgb),0.8)",
          color: "#04150c",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9.5h18M7 3v3M17 3v3"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <rect
            x="3.2"
            y="5"
            width="17.6"
            height="16"
            rx="3.4"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <path
            d="M8.5 14.5l2.4 2.4 4.6-5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="display text-[1.35rem] tracking-tight">fecha</span>
    </Link>
  );
}
