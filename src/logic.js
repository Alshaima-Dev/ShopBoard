// Pure functions: inputs in, results out. No DOM, storage, or input mutation.
export function searchProducts(products, query = '') {
  const text = query.trim().toLowerCase()
  return products.filter(product => product.name.toLowerCase().includes(text))
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

export function selectProducts(products, { query = '', category = '', sort = 'featured', affordableOnly = false } = {}) {
  const filtered = filterByCategory(searchProducts(products, query), category)
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

export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(price)
}
