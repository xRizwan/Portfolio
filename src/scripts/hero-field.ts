import { finePointer, motionAllowed, onMotionChange, select, selectAll } from './motion';

// The hero's particle field ripples away from the pointer, and the RIZZY letters light up
// under it. The canvas is decorative; the hero reads the same without it.
const zone = select('[data-field-zone]', HTMLElement);
const canvas = select('#current-canvas', HTMLCanvasElement);
const context = canvas?.getContext('2d');
const title = select('.current-title', HTMLElement);
const charged = title ? select('.charged-text', HTMLElement, title) : null;

if (zone && canvas && context) {
  const pointer = { x: -1000, y: -1000 };
  let width = 0;
  let height = 0;
  let active = true;
  let frame = 0;
  let time = 0;
  let last = 0;

  const render = (): void => {
    context.clearRect(0, 0, width, height);
    const columns = width < 650 ? 42 : 75;
    const rows = 30;
    const offsetX = motionAllowed() ? pointer.x : -1000;
    const offsetY = motionAllowed() ? pointer.y : -1000;
    // Dots are lime on the dark theme and a deeper green on the light one.
    const light = document.documentElement.dataset.theme === 'light';
    const lit = light ? '86,128,14' : '212,239,105';
    const idle = light ? '112,130,100' : '136,165,120';
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const u = column / (columns - 1);
        const v = row / (rows - 1);
        let x = u * width;
        let y =
          height * (0.2 + v * 0.75) +
          Math.sin(u * 8 + v * 4 + time * 0.25) * 60 +
          Math.sin(u * 15 - time * 0.18) * v * 28;
        const dx = x - offsetX;
        const dy = y - offsetY;
        const distance = Math.hypot(dx, dy);
        const force = Math.max(0, 1 - distance / 190);
        x += (dx / Math.max(distance, 1)) * force * 48;
        y += (dy / Math.max(distance, 1)) * force * 48;
        const band = Math.sin(u * 6 + v * 5 + time * 0.12);
        const alpha = (0.12 + Math.max(0, band) * 0.33 + force * 0.45) * (light ? 1.9 : 1);
        context.fillStyle = `rgba(${force > 0.1 ? lit : idle},${alpha})`;
        context.beginPath();
        context.arc(x, y, force > 0 ? 1.3 : 0.85, 0, Math.PI * 2);
        context.fill();
      }
    }
  };
  const resize = (): void => {
    width = zone.clientWidth;
    height = zone.clientHeight;
    const ratio = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    render();
  };
  const animate = (timestamp: number): void => {
    frame = 0;
    if (!active || document.hidden || !motionAllowed()) return;
    if (timestamp - last > 30) {
      time += 0.033;
      last = timestamp;
      render();
    }
    frame = requestAnimationFrame(animate);
  };
  const sync = (): void => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    render();
    if (active && !document.hidden && motionAllowed()) frame = requestAnimationFrame(animate);
  };

  zone.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || !motionAllowed()) return;
    const rect = zone.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    if (title && charged) {
      const textRect = charged.getBoundingClientRect();
      title.style.setProperty('--pointer-x', `${event.clientX - textRect.left}px`);
      title.style.setProperty('--pointer-y', `${event.clientY - textRect.top}px`);
    }
  });
  zone.addEventListener('pointerleave', () => {
    pointer.x = -1000;
    pointer.y = -1000;
  });
  new ResizeObserver(resize).observe(zone);
  new IntersectionObserver(([entry]) => {
    active = entry?.isIntersecting ?? true;
    sync();
  }).observe(zone);
  document.addEventListener('visibilitychange', sync);
  onMotionChange(() => {
    if (!motionAllowed() && title) {
      title.style.removeProperty('--pointer-x');
      title.style.removeProperty('--pointer-y');
    }
    sync();
  });
  resize();
  sync();
}

// Project rows show a small floating preview while hovered.
const preview = select('.hover-preview', HTMLElement);
if (preview) {
  const place = (event: PointerEvent): void => {
    preview.style.left = `${Math.min(innerWidth - 175, event.clientX + 160)}px`;
    preview.style.top = `${Math.max(125, Math.min(innerHeight - 130, event.clientY))}px`;
  };
  const arts = selectAll('[data-preview-art]', HTMLElement, preview);
  for (const row of selectAll('[data-preview]', HTMLElement)) {
    row.addEventListener('pointerenter', (event) => {
      if (!finePointer.matches || !motionAllowed()) return;
      place(event);
      for (const art of arts)
        art.classList.toggle('active', art.dataset.previewArt === row.dataset.preview);
      preview.classList.add('visible');
    });
    row.addEventListener('pointermove', place);
    row.addEventListener('pointerleave', () => preview.classList.remove('visible'));
  }
  onMotionChange(() => {
    if (!motionAllowed()) preview.classList.remove('visible');
  });
}
