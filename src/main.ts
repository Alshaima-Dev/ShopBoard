import './style.css'
import { mountStorefront } from './shared/ui/storefront.ts'
import { initToast } from './shared/ui/toast.ts'
import { initProductsUI } from './modules/products/products.ui.ts'
import { initCartUI } from './modules/cart/cart.ui.ts'
import { applyLanguage, initLanguageSwitcher } from './modules/i18n/i18n.ui.ts'

const storefront = mountStorefront()
const toast = initToast()
const cart = initCartUI(toast.notify)
const products = initProductsUI(cart.addItem)

function refreshLanguage() {
  applyLanguage()
  storefront.updateHeroFallback()
  products.updateCategories()
  toast.updateTranslation()
  products.renderProducts()
  cart.renderCart()
}

initLanguageSwitcher(refreshLanguage)
refreshLanguage()
