/** Shared motion preference: the OS setting plus the page's "Pause motion" button. */
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

export function motionAllowed(): boolean {
  return !reducedMotion.matches && !document.body.classList.contains('motion-off');
}

/** Runs `callback` whenever motion is paused or resumed (button or OS setting). */
export function onMotionChange(callback: () => void): void {
  addEventListener('portfolio-motion-change', callback);
  reducedMotion.addEventListener('change', callback);
}

/** Typed querySelector that returns null when the element is missing or of another type. */
export function select<T extends Element>(
  selector: string,
  type: new () => T,
  root: ParentNode = document,
): T | null {
  const element = root.querySelector(selector);
  return element instanceof type ? element : null;
}

export function selectAll<T extends Element>(
  selector: string,
  type: new () => T,
  root: ParentNode = document,
): T[] {
  return [...root.querySelectorAll(selector)].filter(
    (element): element is T => element instanceof type,
  );
}
