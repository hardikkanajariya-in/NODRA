type Props = {
  title?: string;
  message: string;
};

export function ConnectionError({
  title = "Could not connect to the database",
  message,
}: Props) {
  return (
    <div className="nodra-content mx-auto max-w-2xl p-8">
      <div className="nodra-error-card rounded-lg border p-6">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-[var(--nodra-muted)]">{message}</p>
        <div className="mt-4 space-y-2 text-sm">
          <p>On your host (Vercel or local), confirm:</p>
          <ul className="list-disc space-y-1 pl-5 text-[var(--nodra-muted)]">
            <li>
              <code className="nodra-inline-code">DATABASE_URL</code> is set
            </li>
            <li>
              Schema sync runs on <code className="nodra-inline-code">pnpm build</code>{" "}
              / <code className="nodra-inline-code">pnpm dev</code> when{" "}
              <code className="nodra-inline-code">DATABASE_URL</code> is set
            </li>
            <li>
              Other required vars:{" "}
              <code className="nodra-inline-code">SESSION_SECRET</code>
            </li>
            <li>
              After upgrading to multi-user auth, remove{" "}
              <code className="nodra-inline-code">APP_PASSWORD</code> and have
              each person register; the first account claims existing graphs.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
