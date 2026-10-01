import { select, selectAll } from './motion';

// Stage buttons swap the explanation text; the ordered list after them works without JavaScript.
const buttons = selectAll('[data-flow]', HTMLButtonElement);
const explanation = select('[data-flow-explanation]', HTMLElement);
const explanations = selectAll('[data-flow-text]', HTMLTemplateElement).map(
  (template) => template.content.textContent?.trim() ?? '',
);

for (const button of buttons) {
  button.addEventListener('click', () => {
    for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
    const text = explanations[Number(button.dataset.flow)];
    if (explanation && text) explanation.textContent = text;
  });
}
