interface LoadingSpinnerProps {
  label?: string;
}

export default function LoadingSpinner({ label = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-navy"
        role="status"
        aria-label="loading"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
