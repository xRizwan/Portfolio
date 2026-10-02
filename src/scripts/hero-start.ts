import './hero-field';
import './yarn';

// The 3D scenes (Three.js) are the heaviest work on the page, so they start only after the page
// has loaded and the browser is idle. Until then the hero shows its HTML fallbacks: the framed
// photo and the plain name. The flat fallback cat is decided after the 3D cats have had their
// chance, so it never flashes before them.
async function startScenes(): Promise<void> {
  await import('./title-cats');
  await import('./title-cat-fallback');
  await import('./frame-scene');
}

function whenIdle(): void {
  const run = () => void startScenes();
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2500 });
  else setTimeout(run, 300);
}

if (document.readyState === 'complete') whenIdle();
else addEventListener('load', whenIdle, { once: true });
