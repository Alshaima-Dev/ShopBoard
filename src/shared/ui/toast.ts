import { requiredElement } from './dom.ts'
import { t } from './formatting.ts'

// One controller owns the existing notification and its dismissal timer.
export function initToast() {
  let notice: string | null = null
  let toastTimer: ReturnType<typeof setTimeout> | undefined

  function notify(key: string) {
    notice = key
    const toast = requiredElement('.toast', HTMLElement)
    toast.textContent = t(key)
    toast.classList.add('visible')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible')
      notice = null
    }, 2600)
  }

  function updateTranslation() {
    if (notice) requiredElement('.toast', HTMLElement).textContent = t(notice)
  }

  return { notify, updateTranslation }
}
