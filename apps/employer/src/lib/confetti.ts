import confetti from 'canvas-confetti';

const COLORS = ['#4F46E5', '#7C3AED', '#F59E0B', '#10B981', '#EC4899', '#FFFFFF'];

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** A short two-sided burst — used for publish and award. */
export function celebrate(origin: { x?: number; y?: number } = {}) {
  if (reducedMotion()) return;
  const y = origin.y ?? 0.35;
  const base = { colors: COLORS, ticks: 220, gravity: 0.9, scalar: 0.95, zIndex: 2147483647, disableForReducedMotion: true };
  void confetti({ ...base, particleCount: 90, spread: 75, startVelocity: 42, origin: { x: origin.x ?? 0.5, y } });
  window.setTimeout(() => {
    void confetti({ ...base, particleCount: 50, angle: 60, spread: 60, startVelocity: 50, origin: { x: 0, y: y + 0.25 } });
    void confetti({ ...base, particleCount: 50, angle: 120, spread: 60, startVelocity: 50, origin: { x: 1, y: y + 0.25 } });
  }, 180);
}
