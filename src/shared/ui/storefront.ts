import { createElement, requiredElement } from './dom.ts'
import { createIcon, createBrandSymbol } from './icons.ts'
import { t } from './formatting.ts'

export function mountStorefront() {
  // Enhance the static index.html structure once; translations never remount it.

  // Mount decorative feature icons once; language changes only update their text.
  document
    .querySelectorAll<HTMLElement>('[data-benefit-icon]')
    .forEach((element) => {
      const icon = createIcon(element.dataset.benefitIcon)
      icon.setAttribute('width', '24')
      icon.setAttribute('height', '24')
      element.append(icon)
    })

  document
    .querySelectorAll('[data-brand-mark]')
    .forEach((element) => element.append(createBrandSymbol()))

  // Local fallback is attached once and stays translated when the language changes.
  const heroPhoto = requiredElement('.hero-image > img', HTMLImageElement)
  function updateHeroFallback() {
    if (!heroPhoto.dataset.fallback) return
    const message = t('imageUnavailable', { name: 'YANINDA' })
    heroPhoto.alt = message
    const label = document.querySelector<HTMLElement>(
      '.hero-image .photo-unavailable',
    )
    if (label) label.textContent = message
  }
  function handleHeroError() {
    if (heroPhoto.hidden) return
    if (heroPhoto.dataset.fallback) {
      heroPhoto.hidden = true
      requiredElement('.hero-image', HTMLElement).append(
        createElement('p', {
          className: 'photo-unavailable',
          text: t('imageUnavailable', { name: 'YANINDA' }),
        }),
      )
    } else {
      heroPhoto.dataset.fallback = 'true'
      heroPhoto.src =
        (import.meta.env?.BASE_URL || '/') + 'images/products/fallback.svg'
    }
    updateHeroFallback()
  }
  heroPhoto.addEventListener('error', handleHeroError)
  if (heroPhoto.complete && heroPhoto.naturalWidth === 0) handleHeroError()

  requiredElement('.bag-icon', HTMLElement).append(createIcon('Bags'))
  requiredElement('.search-icon', HTMLElement).append(createIcon('search'))
  requiredElement('#close-cart', HTMLElement).append(createIcon('close'))

  return { updateHeroFallback }
}
