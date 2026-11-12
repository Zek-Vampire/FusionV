export default function BrandLogo({ className = '', imageClassName = '', textClassName = '' }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <img
        src="/assets/fusionv-logo.jpg"
        alt=""
        aria-hidden="true"
        className={`h-9 w-9 shrink-0 rounded-lg object-contain ${imageClassName}`}
      />
      <span className={`whitespace-nowrap text-lg font-bold tracking-tight ${textClassName}`}>
        <span className="text-gradient">Fusion</span>
        <span className="text-lime">V</span>
      </span>
    </span>
  );
}
