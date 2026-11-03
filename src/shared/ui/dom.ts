// Required layout elements are checked once at each lookup, with their actual DOM type.
export function requiredElement<T extends Element>(
  selector: string,
  elementType: { new (): T },
): T {
  const element = document.querySelector<HTMLElement>(selector)
  if (!(element instanceof elementType))
    throw new Error(`Missing or invalid layout element: ${selector}`)
  return element
}

// Create an element without interpreting product text as HTML.
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  {
    className,
    text,
    attributes = {},
  }: {
    className?: string
    text?: string
    attributes?: Record<string, string | number | boolean>
  } = {},
  children: Node[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)

  if (className) element.className = className
  if (text !== undefined) element.textContent = text

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value))
  }

  element.append(...children)
  return element
}

// Build the next list off-screen, then replace the old contents in one step.
export function replaceChildren(container: Element, children: Node[]) {
  const fragment = document.createDocumentFragment()
  fragment.append(...children)
  container.replaceChildren(fragment)
}
