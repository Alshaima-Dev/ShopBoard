import { getProductText, getLanguage, languages } from './i18n.js'

// Pure functions: inputs in, results out. No DOM, storage, or input mutation.
export function searchProducts(products, query = '', language = 'en') {
  const normalize = value => {
    const text = value.normalize('NFC').trim().toLocaleLowerCase(getLanguage(language))
    return language === 'ar' ? text.replace(/[\u064B-\u065F\u0670\u0640]/g, '') : text
  }
  const text = normalize(query)
  return products.filter(product => normalize(getProductText(product, language).name).includes(text))
}

export function filterByCategory(products, category = '') {
  return products.filter(product => !category || product.category === category)
}

export function sortByPrice(products, order = 'featured') {
  const sorted = [...products]
  if (order === 'low') sorted.sort((a, b) => a.price - b.price)
  if (order === 'high') sorted.sort((a, b) => b.price - a.price)
  return sorted
}

export function selectProducts(products, { query = '', category = '', sort = 'featured', affordableOnly = false, language = 'en' } = {}) {
  const filtered = filterByCategory(searchProducts(products, query, language), category)
    .filter(product => !affordableOnly || product.price < 50)
  return sortByPrice(filtered, sort)
}

export function getCategories(products) {
  return [...new Set(products.map(product => product.category))]
}

export function calculateCartCount(cart) {
  return Object.values(cart).reduce((count, quantity) => count + quantity, 0)
}

export function calculateCartTotal(products, cart) {
  return products.reduce((total, product) => total + product.price * (cart[product.id] || 0), 0)
}

export function formatPrice(price, language = 'en') {
  return new Intl.NumberFormat(languages[getLanguage(language)].locale, {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(price)
}
