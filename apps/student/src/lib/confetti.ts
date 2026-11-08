import confetti from 'canvas-confetti';

/** The one confetti moment: a placement arrives. Colors come from the Fluent tokens. */
export function celebrate() {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const css = getComputedStyle(document.documentElement);
  const colors = ['--colorBrandBackground', '--colorStatusSuccessBackground3', '--colorStatusWarningBackground3', '--colorBrandStroke2']
    .map((v) => css.getPropertyValue(v).trim())
    .filter(Boolean);
  void confetti({ particleCount: 120, spread: 80, startVelocity: 42, origin: { y: 0.6 }, colors, zIndex: 9999 });
}
