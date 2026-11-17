// The hand-worked mechanisms: lift-the-flap shutters and doors, the skills wheel, the pulled-out
// role sheet, and the certificate concertina with its enlarged view.
import { select, selectAll } from '../../scripts/motion';
import type { Mode } from './book';

/** Shutters (About) and double doors (Work): a button that opens what is behind it. */
export function initFlaps(mode: () => Mode): void {
  const flaps = selectAll('[data-pb-flap]', HTMLElement);
  const viewer =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting || mode() !== 'fx') continue;
              const target = entry.target;
              viewer?.unobserve(target);
              // Let the piece finish standing up before it opens.
              window.setTimeout(() => target.dispatchEvent(new CustomEvent('pb-open')), 650);
            }
          },
          { threshold: 0.75 },
        )
      : null;

  for (const flap of flaps) {
    const button = select('button[aria-expanded]', HTMLButtonElement, flap);
    if (!button) continue;
    const setOpen = (open: boolean): void => {
      flap.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    };
    button.addEventListener('click', () => setOpen(!flap.classList.contains('is-open')));
    flap.addEventListener('pb-open', () => setOpen(true));

    // With motion off nothing should stay hidden behind a flap.
    if (mode() === 'static') setOpen(true);
    viewer?.observe(flap);

    // In the book, each flap opens by itself once the spread has risen far enough, and shuts
    // again when the spread folds away.
    const threshold = Number(flap.dataset.auto ?? '0.9');
    let done = false;
    flap.closest('.pb-spread')?.addEventListener('pb-rise', (event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== 'number') return;
      if (event.detail >= threshold && !done) {
        done = true;
        setOpen(true);
      } else if (event.detail <= 0.02 && done) {
        done = false;
        setOpen(false);
      }
    });
  }
}

/** The volvelle: one skill group at a time, chosen by turning the wheel. */
export function initWheel(): void {
  const wheel = select('[data-pb-wheel]', HTMLElement);
  const disc = select('[data-pb-disc]', HTMLElement);
  if (!wheel || !disc) return;
  const tabs = selectAll('[role="tab"]', HTMLButtonElement, disc);
  const panels = selectAll('[data-pb-skillset]', HTMLElement);
  const count = tabs.length;
  if (count === 0 || panels.length !== count) return;
  const step = 360 / count;
  let selected = 0;
  /** Disc rotation in degrees; it accumulates so the wheel always takes the short way round. */
  let rotation = 0;

  const select_ = (index: number, focus: boolean): void => {
    selected = ((index % count) + count) % count;
    const base = -selected * step;
    rotation = base + Math.round((rotation - base) / 360) * 360;
    disc.style.setProperty('--rot', `${rotation}deg`);
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === selected));
      tab.tabIndex = i === selected ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== selected;
      panel.classList.remove('is-fresh');
    });
    const panel = panels[selected];
    if (panel) {
      // Restart the tabs' fan-in animation.
      void panel.offsetWidth;
      panel.classList.add('is-fresh');
    }
    if (focus) tabs[selected]?.focus({ preventScroll: true });
  };

  // Dragging turns the disc; letting go snaps it to the nearest wedge.
  let dragging = false;
  let moved = 0;
  let startAngle = 0;
  let startRotation = 0;
  const angleAt = (event: PointerEvent): number => {
    const rect = wheel.getBoundingClientRect();
    return (
      (Math.atan2(
        event.clientY - (rect.top + rect.height / 2),
        event.clientX - (rect.left + rect.width / 2),
      ) *
        180) /
      Math.PI
    );
  };
  disc.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    dragging = true;
    moved = 0;
    startAngle = angleAt(event);
    startRotation = rotation;
  });
  addEventListener('pointermove', (event) => {
    if (!dragging) return;
    let delta = angleAt(event) - startAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    moved = Math.max(moved, Math.abs(delta));
    if (moved < 4) return;
    disc.classList.add('is-dragging');
    rotation = startRotation + delta;
    disc.style.setProperty('--rot', `${rotation}deg`);
  });
  const release = (): void => {
    if (!dragging) return;
    dragging = false;
    if (moved < 4) return;
    disc.classList.remove('is-dragging');
    select_(Math.round(-rotation / step), false);
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', (event) => {
      // A drag that ends on a label is not a pick.
      if (moved >= 4) {
        event.preventDefault();
        return;
      }
      select_(index, false);
    });
    tab.addEventListener('keydown', (event) => {
      let next = -1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = selected + 1;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = selected - 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = count - 1;
      if (next < 0 && event.key !== 'ArrowLeft' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      select_(next, true);
    });
  });
  for (const button of selectAll('[data-pb-wheel-step]', HTMLButtonElement)) {
    button.addEventListener('click', () =>
      select_(selected + Number(button.dataset.pbWheelStep ?? '1'), false),
    );
  }
  select_(0, false);
}

/** Role detail: in the book the <details> content is shown on a pulled-out sheet instead. */
export function initRoleSheet(mode: () => Mode): void {
  const sheet = select('[data-pb-sheet]', HTMLDialogElement);
  const body = select('[data-pb-sheet-body]', HTMLElement);
  if (!sheet || !body || typeof sheet.showModal !== 'function') return;
  let opener: HTMLElement | null = null;
  for (const details of selectAll('[data-pb-role]', HTMLDetailsElement)) {
    const summary = select('summary', HTMLElement, details);
    const detail = select('[data-pb-role-detail]', HTMLElement, details);
    if (!summary || !detail) continue;
    summary.addEventListener('click', (event) => {
      if (mode() !== 'book') return;
      event.preventDefault();
      opener = summary;
      body.replaceChildren(detail.cloneNode(true));
      sheet.showModal();
    });
  }
  select('[data-pb-sheet-close]', HTMLButtonElement, sheet)?.addEventListener('click', () =>
    sheet.close(),
  );
  sheet.addEventListener('click', (event) => {
    if (event.target === sheet) sheet.close();
  });
  sheet.addEventListener('close', () => opener?.focus({ preventScroll: true }));
}

/** Certificates: the concertina (book layout) and the enlarged view. */
export function initCertificates(mode: () => Mode): void {
  const strip = select('[data-pb-strip]', HTMLElement);
  const frames = strip ? selectAll('.pb-frame', HTMLElement, strip) : [];
  const links = selectAll('[data-pb-cert]', HTMLAnchorElement);
  if (!strip || frames.length === 0) return;

  // --- concertina ---
  const frameWidth = 190;
  const openCount = 4;
  const openAngle = 17;
  const shutAngle = 84;
  let first = 0;
  const maxFirst = Math.max(0, frames.length - openCount);
  const place = (): void => {
    let x = 0;
    frames.forEach((frame, index) => {
      const open = index >= first && index < first + openCount;
      const angle = (open ? openAngle : shutAngle) * (index % 2 === 0 ? 1 : -1);
      const seen = frameWidth * Math.cos((angle * Math.PI) / 180);
      // Rotation is about the frame's centre, so place the centre and step by the seen width.
      frame.style.setProperty('--fx', `${(x + seen / 2 - frameWidth / 2).toFixed(1)}px`);
      frame.style.setProperty('--fa', `${angle}deg`);
      frame.classList.toggle('is-shut', !open);
      x += seen;
    });
  };
  const pull = (to: number): void => {
    first = Math.min(maxFirst, Math.max(0, to));
    place();
  };
  for (const button of selectAll('[data-pb-strip-step]', HTMLButtonElement)) {
    button.addEventListener('click', () =>
      pull(first + Number(button.dataset.pbStripStep ?? '1') * 2),
    );
  }
  const reveal = (index: number): void => {
    if (index < first) pull(index);
    else if (index >= first + openCount) pull(index - openCount + 1);
  };
  frames.forEach((frame, index) => {
    frame.addEventListener('focusin', () => {
      if (mode() === 'book') reveal(index);
    });
  });
  // The strip slides out a little further once it has stood up.
  strip.closest('.pb-spread')?.addEventListener('pb-rise', (event) => {
    if (!(event instanceof CustomEvent) || typeof event.detail !== 'number') return;
    if (event.detail <= 0.02 && first !== 0) pull(0);
  });
  place();

  // --- enlarged view ---
  const dialog = select('[data-pb-lightbox]', HTMLDialogElement);
  const image = select('[data-pb-lightbox-img]', HTMLImageElement);
  const title = select('[data-pb-lightbox-title]', HTMLElement);
  const issuer = select('[data-pb-lightbox-issuer]', HTMLElement);
  if (!dialog || !image || !title || !issuer || typeof dialog.showModal !== 'function') return;
  const closeButton = select('[data-pb-lightbox-close]', HTMLButtonElement, dialog);
  let shown = 0;
  const show = (index: number): void => {
    shown = (index + links.length) % links.length;
    const link = links[shown];
    if (!link) return;
    image.src = link.href;
    image.alt = link.dataset.alt ?? '';
    title.textContent = link.dataset.title ?? '';
    issuer.textContent = link.dataset.issuer ?? '';
  };
  links.forEach((link, index) => {
    link.addEventListener('click', (event) => {
      // Let modified clicks open the image in a new tab as usual.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      // A pleated frame is pulled open first; the next click enlarges it.
      if (mode() === 'book' && frames[index]?.classList.contains('is-shut')) {
        reveal(index);
        return;
      }
      show(index);
      dialog.showModal();
      closeButton?.focus();
    });
  });
  select('[data-pb-lightbox-prev]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    show(shown - 1),
  );
  select('[data-pb-lightbox-next]', HTMLButtonElement, dialog)?.addEventListener('click', () =>
    show(shown + 1),
  );
  closeButton?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(shown - 1);
    if (event.key === 'ArrowRight') show(shown + 1);
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (mode() === 'book') reveal(shown);
    links[shown]?.focus({ preventScroll: true });
  });
}
