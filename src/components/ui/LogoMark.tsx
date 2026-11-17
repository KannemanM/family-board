export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <path
        d="M11 16.5h18M11 23.5h18"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="15" cy="12" r="2.2" fill="white" />
      <circle cx="25" cy="12" r="2.2" fill="white" opacity="0.75" />
      <circle cx="15" cy="20" r="2.2" fill="white" opacity="0.75" />
      <circle cx="25" cy="20" r="2.2" fill="white" />
      <circle cx="15" cy="28" r="2.2" fill="white" />
    </svg>
  );
}
