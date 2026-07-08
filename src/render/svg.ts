const SVG_NS = 'http://www.w3.org/2000/svg';

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, String(v));
  }
  if (parent) parent.appendChild(node);
  return node;
}

export function group(cls: string, parent?: Element): SVGGElement {
  return el('g', { class: cls }, parent);
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}
