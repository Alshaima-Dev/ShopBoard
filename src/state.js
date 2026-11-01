import { products } from './data.js'

// Preserve the existing key so saved shopping bags survive this refactor.
const STORAGE_KEY = 'shopboard-catalog-cart-v2'

export function createCartStore(catalog = products, storage) {
  if (storage === undefined) {
    try { storage = globalThis.localStorage } catch { storage = null }
  }

  const validIds = new Set(catalog.map(product => String(product.id)))
  let cart = {}

  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || '{}')
    for (const id of validIds) {
      if (Number.isInteger(saved?.[id]) && saved[id] > 0) {
        cart[id] = Math.min(99, saved[id])
      }
    }
  } catch {
    // A corrupt saved bag or unavailable storage should not stop the shop.
  }

  function save() {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify(cart)) } catch {
      // The in-memory cart still works if browser storage is blocked or full.
    }
  }

  function changeQuantity(id, step) {
    id = String(id)
    if (!validIds.has(id) || !Number.isInteger(step)) return
    const quantity = Math.min(99, (cart[id] || 0) + step)
    if (quantity > 0) cart[id] = quantity
    else delete cart[id]
    save()
  }

  return {
    // Give callers a copy so only state functions can change the saved cart.
    getCart: () => ({ ...cart }),
    addItem: id => changeQuantity(id, 1),
    changeQuantity,
    removeItem(id) {
      delete cart[String(id)]
      save()
    },
  }
}

export const cartStore = createCartStore()
