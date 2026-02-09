interface RetroFormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function RetroFormField({ label, error, children }: RetroFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="font-body text-foreground text-sm">{label}</label>
      {children}
      {error && (
        <p className="font-body text-destructive text-xs">{error}</p>
      )}
    </div>
  );
}
