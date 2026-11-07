import confetti from 'canvas-confetti';

const BRAND = ['#4F46E5', '#7C3AED', '#F59E0B', '#10B981', '#EC4899', '#38BDF8'];

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Big two-sided celebration (submit success, placing in the top 3). */
export function celebrate() {
  if (reducedMotion()) return;
  const end = Date.now() + 900;
  const frame = () => {
    void confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.75 }, colors: BRAND, zIndex: 9999 });
    void confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.75 }, colors: BRAND, zIndex: 9999 });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  void confetti({ particleCount: 120, spread: 90, startVelocity: 45, origin: { y: 0.6 }, colors: BRAND, zIndex: 9999 });
  requestAnimationFrame(frame);
}

/** A small pop (joining a challenge, accepting an invite). */
export function pop(origin?: { x: number; y: number }) {
  if (reducedMotion()) return;
  void confetti({
    particleCount: 60,
    spread: 65,
    startVelocity: 32,
    scalar: 0.9,
    origin: origin ?? { x: 0.5, y: 0.4 },
    colors: BRAND,
    zIndex: 9999,
  });
}

/** Origin for a confetti burst centred on an element. */
export function originOf(el: Element | null | undefined): { x: number; y: number } | undefined {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
}
