type Props = {
  label?: string;
  size?: "sm" | "md";
};

export function LoadingSpinner({ label, size = "md" }: Props) {
  const dim = size === "sm" ? "h-4 w-4 border-2" : "h-8 w-8 border-2";
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${dim} animate-spin rounded-full border-[var(--nodra-border)] border-t-[var(--nodra-accent)]`}
        role="status"
        aria-label={label ?? "Loading"}
      />
      {label && (
        <p className="text-sm text-[var(--nodra-muted)]">{label}</p>
      )}
    </div>
  );
}
