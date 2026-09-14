/**
 * Oversized brand typography moment, giant "Grašak" wordmark, cropped by
 * the viewport edges, rendered as a low-opacity outline interlude.
 */
export default function BrandStrip({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none relative select-none overflow-hidden ${className}`}>
      <div
        className="whitespace-nowrap text-center font-display font-extrabold leading-[0.85] tracking-[-0.05em] text-transparent"
        style={{
          fontSize: 'clamp(160px, 28vw, 420px)',
          WebkitTextStroke: '2px rgba(69,129,61,0.28)',
          transform: 'translateY(12%)',
        }}
      >
        Grašak
      </div>
    </div>
  )
}
