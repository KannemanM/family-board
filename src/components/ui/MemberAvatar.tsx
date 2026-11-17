const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-[13px]",
  lg: "h-12 w-12 text-base",
} as const;

export function MemberAvatar({
  name,
  color,
  emoji,
  size = "md",
  className = "",
}: {
  name: string;
  color: string;
  emoji?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-semibold ${SIZES[size]} ${className}`}
      style={{
        backgroundColor: `${color}1f`,
        borderColor: `${color}55`,
        color,
      }}
      title={name}
      aria-label={name}
    >
      {emoji?.trim() ? emoji : initial}
    </span>
  );
}

export function MemberLegendDot({
  name,
  color,
  emoji,
}: {
  name: string;
  color: string;
  emoji?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ backgroundColor: `${color}24`, color }}
      >
        {emoji?.trim() ? emoji : name.charAt(0).toUpperCase()}
      </span>
      <span className="text-ink-soft">{name}</span>
    </span>
  );
}
