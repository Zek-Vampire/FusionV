export default function BackgroundFX() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div className="animate-float-slow absolute -top-48 left-1/2 h-[36rem] w-[60rem] rounded-full bg-lime/[0.07] blur-[160px]" />
      <div className="absolute -bottom-24 right-0 h-[26rem] w-[26rem] rounded-full bg-lime/[0.04] blur-[120px]" />
    </div>
  );
}
