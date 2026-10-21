/**
 * Cinematic photo background — a real photograph graded to the CoachPro
 * "Tern" look: crushed high-contrast black & white with a faint motion-blur
 * ghost dragged across the frame. Pairs with the SCRIM_* and GRAIN overlays
 * already layered in the page, exactly where MediaMotion used to sit.
 * Fills its (relative) parent.
 */
export function MediaPhoto({
  src,
  position = "center",
  priority = false,
}: {
  src: string;
  /** object-position for the base image, e.g. "center 40%" */
  position?: string;
  /** eager-load above-the-fold bands */
  priority?: boolean;
}) {
  return (
    <>
      {/* Base — crushed, high-contrast monochrome */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 block h-full w-full object-cover"
        style={{
          objectPosition: position,
          filter: "grayscale(1) contrast(1.14) brightness(0.9)",
        }}
      />
      {/* Motion-blur ghost — a blurred copy nudged sideways, screened back in
          to smear the highlights into a sense of movement. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="pointer-events-none absolute inset-0 block h-full w-full object-cover"
        style={{
          objectPosition: position,
          filter: "grayscale(1) contrast(1.05) blur(15px)",
          transform: "scale(1.07) translateX(-1.6%)",
          opacity: 0.26,
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}
