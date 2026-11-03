import { requiredElement } from '../../shared/ui/dom.ts'

export function initSignupUI(notify: (key: string) => void): void {
  const form = requiredElement('#signup-form', HTMLFormElement)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (!form.reportValidity()) return
    form.reset()
    notify('signupSuccess')
  })
  // Static markup stays non-submittable until the demo handler is attached.
  requiredElement(
    '#signup-form button[type="submit"]',
    HTMLButtonElement,
  ).disabled = false
}
