export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 animate-slide-up">
      <div>
        <h1 className="hdisp text-[1.75rem] text-ink sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
