import { finePointer, motionAllowed, reducedMotion, selectAll } from './motion';

// Motion toggle: the OS preference sets the initial state; the button overrides it.
const motionControls = selectAll('[data-motion]', HTMLButtonElement);
function setMotion(paused: boolean): void {
  document.body.classList.toggle('motion-off', paused);
  for (const control of motionControls) {
    control.setAttribute('aria-pressed', String(paused));
    control.textContent = paused ? 'Motion off' : 'Pause motion';
  }
}
setMotion(reducedMotion.matches);
for (const control of motionControls) {
  control.addEventListener('click', () =>
    setMotion(!document.body.classList.contains('motion-off')),
  );
}
reducedMotion.addEventListener('change', (event) => setMotion(event.matches));

// Theme toggle: light is the default; a saved choice is applied in the document head before paint.
type Theme = 'light' | 'dark';
const themeControls = selectAll('[data-theme-toggle]', HTMLButtonElement);
const themeColor = document.querySelector('meta[name="theme-color"]');
function setTheme(theme: Theme): void {
  if (theme === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
  themeColor?.setAttribute('content', theme === 'light' ? '#f3f2e9' : '#0e100f');
  const other: Theme = theme === 'light' ? 'dark' : 'light';
  for (const control of themeControls) {
    control.setAttribute('aria-label', `Switch to ${other} theme`);
    const label = control.querySelector('[data-theme-label]');
    if (label) label.textContent = other === 'light' ? 'Light' : 'Dark';
  }
  dispatchEvent(new CustomEvent('portfolio-theme-change', { detail: theme }));
}
const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
setTheme(currentTheme());
for (const control of themeControls) {
  control.addEventListener('click', () => {
    const next: Theme = currentTheme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage unavailable: the choice lasts for this page only.
    }
  });
}

// Mark the current page in the navigation.
const currentPath = location.pathname.replace(/\/?$/, '/');
for (const link of selectAll('.main-nav a, .mobile-nav a', HTMLAnchorElement)) {
  if (new URL(link.href).pathname === currentPath && !link.hash)
    link.setAttribute('aria-current', 'page');
}

// Close the mobile menu after choosing a same-page link.
for (const link of selectAll('.mobile-nav a', HTMLAnchorElement)) {
  link.addEventListener('click', () => link.closest('details')?.removeAttribute('open'));
}

// Floating cursor label for elements with data-cursor.
const cursor = document.createElement('div');
cursor.className = 'cursor-label';
cursor.setAttribute('aria-hidden', 'true');
document.body.append(cursor);
for (const element of selectAll('[data-cursor]', HTMLElement)) {
  element.addEventListener('pointerenter', () => {
    if (!finePointer.matches || !motionAllowed()) return;
    cursor.textContent = element.dataset.cursor ?? '';
    cursor.classList.add('visible');
  });
  element.addEventListener('pointermove', (event) => {
    cursor.style.left = `${event.clientX + 24}px`;
    cursor.style.top = `${event.clientY + 24}px`;
  });
  element.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
}

// Magnetic links drift slightly toward the pointer.
const magnetic = selectAll('[data-magnetic]', HTMLElement);
for (const element of magnetic) {
  element.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || !motionAllowed()) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.15;
    element.style.translate = `${x}px ${y}px`;
  });
  element.addEventListener('pointerleave', () => {
    element.style.translate = '';
  });
}

// Reading progress bar.
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
progressBar.setAttribute('aria-hidden', 'true');
document.body.append(progressBar);
let scheduled = false;
function updateProgress(): void {
  scheduled = false;
  const height = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = `scaleX(${height > 0 ? scrollY / height : 0})`;
}
function queueProgress(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(updateProgress);
}
addEventListener('scroll', queueProgress, { passive: true });
addEventListener('resize', queueProgress, { passive: true });
updateProgress();

// Announce motion changes to every interactive scene. Only the motion-off class matters, so
// other body class changes (for example the notes' arrival state) do not re-sync scenes.
let motionOff = document.body.classList.contains('motion-off');
new MutationObserver(() => {
  const next = document.body.classList.contains('motion-off');
  if (next === motionOff) return;
  motionOff = next;
  if (next) {
    cursor.classList.remove('visible');
    for (const element of magnetic) element.style.translate = '';
  }
  dispatchEvent(new Event('portfolio-motion-change'));
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });
