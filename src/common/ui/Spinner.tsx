export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full ${className}`}></div>
  );
}
