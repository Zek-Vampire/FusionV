export default function ErrorScreen({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-panel border border-line bg-surface p-8 text-center"
    >
      <h1 className="text-xl font-semibold">{title}</h1>
      {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-lime-dark"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
