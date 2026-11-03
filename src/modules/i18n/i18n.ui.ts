import { requiredElement } from '../../shared/ui/dom.ts'
import { t, money } from '../../shared/ui/formatting.ts'
import { languages } from './i18n.ts'
import { languageStore } from './i18n.state.ts'
import { AFFORDABLE_PRICE_LIMIT } from '../products/products.logic.ts'

export function applyLanguage() {
  const language = languageStore.getLanguage()
  document.documentElement.lang = language
  document.documentElement.dir = languages[language].dir
  document.title = t('title')
  document
    .querySelector<HTMLElement>('meta[name="description"]')
    ?.setAttribute('content', t('meta'))
  for (const [attribute, target] of [
    ['data-i18n', null],
    ['data-i18n-aria', 'aria-label'],
    ['data-i18n-alt', 'alt'],
    ['data-i18n-placeholder', 'placeholder'],
  ] as const) {
    document.querySelectorAll(`[${attribute}]`).forEach((element) => {
      const value = t(element.getAttribute(attribute) ?? '')
      if (target) element.setAttribute(target, value)
      else element.textContent = value
    })
  }
  document.querySelectorAll('.brand-name').forEach((element) => {
    element.textContent = 'YANINDA'
  })
  requiredElement('#shipping-offer', HTMLElement).textContent = t(
    'shippingOffer',
    { price: money(100) },
  )
  requiredElement('#affordable-products', HTMLElement).textContent = t(
    'underPrice',
    { price: money(AFFORDABLE_PRICE_LIMIT) },
  )
  requiredElement('#footer-copy', HTMLElement).textContent = t('footer', {
    year: new Date().getFullYear(),
  })
  requiredElement('#language', HTMLSelectElement).value = language
}

export function initLanguageSwitcher(onLanguageChange: () => void) {
  requiredElement('#language', HTMLSelectElement).addEventListener(
    'change',
    () => {
      languageStore.setLanguage(
        requiredElement('#language', HTMLSelectElement).value,
      )
      onLanguageChange()
    },
  )
}
