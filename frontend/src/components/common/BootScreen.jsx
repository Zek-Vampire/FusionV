export default function BootScreen({ label = 'Loading FusionV…' }) {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center"
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-lime"
      />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
