import type { Product } from './products.types.ts'
import { products } from './products.data.ts'
import { selectProducts, getCategories } from './products.logic.ts'
import {
  createElement,
  replaceChildren,
  requiredElement,
} from '../../shared/ui/dom.ts'
import { createIcon } from '../../shared/ui/icons.ts'
import {
  t,
  money,
  number,
  textFor,
  getUILanguage,
} from '../../shared/ui/formatting.ts'

// Both cards and cart thumbnails share localized photo and fallback handling.
export function createProductVisual(product: Product, className: string) {
  const base = import.meta.env?.BASE_URL || '/'
  const fallback = base + 'images/products/fallback.svg'
  const photo = createElement('img', {
    className: 'product-photo-img',
    attributes: {
      src: product.image ? base + product.image : fallback,
      alt: textFor(product).alt,
      loading: 'lazy',
      decoding: 'async',
      width: 1024,
      height: 1024,
    },
  })
  const visual = createElement(
    'div',
    { className: className + ' product-photo' },
    [photo],
  )
  let usingFallback = !product.image
  let fallbackLabel: HTMLSpanElement | undefined
  photo.addEventListener('error', () => {
    if (photo.hidden) return
    if (!fallbackLabel) {
      fallbackLabel = createElement('span', {
        className: 'photo-unavailable',
        text: t('imageUnavailable', { name: textFor(product).name }),
      })
      visual.append(fallbackLabel)
    }
    photo.alt = t('imageUnavailable', { name: textFor(product).name })
    if (usingFallback) {
      photo.hidden = true
      return
    }
    usingFallback = true
    photo.src = fallback
  })
  return visual
}

function createProductCard(product: Product) {
  const copy = textFor(product)
  const visual = createProductVisual(product, 'product-image')
  visual.append(
    createElement(
      'button',
      {
        className: 'add',
        attributes: {
          type: 'button',
          'data-add': product.id,
          'aria-label': t('add', { name: copy.name }),
          title: t('add', { name: copy.name }),
        },
      },
      [createIcon('plus')],
    ),
  )
  return createElement('article', { className: 'product' }, [
    visual,
    createElement('div', { className: 'product-title' }, [
      createElement('h3', { text: copy.name }),
      createElement('bdi', {
        className: 'product-price',
        text: money(product.price),
      }),
    ]),
    createElement('p', {
      className: 'product-category',
      text: t(product.category),
    }),
    createElement('p', {
      className: 'product-description',
      text: copy.description,
    }),
  ])
}

// Install product listeners once; language refreshes only render.
export function initProductsUI(onAdd: (id: string | undefined) => void) {
  let affordableOnly = false

  function renderProducts() {
    document.querySelectorAll('.header nav a').forEach((link) => {
      const active =
        link.id === (affordableOnly ? 'affordable-products' : 'shop-all')
      link.classList.toggle('active', active)
      if (active) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    })
    const shown = selectProducts(products, {
      query: requiredElement('#product-search', HTMLInputElement).value,
      category: requiredElement('#category', HTMLSelectElement).value,
      sort: requiredElement('#sort', HTMLSelectElement).value,
      affordableOnly,
      language: getUILanguage(),
    })
    requiredElement('#results', HTMLElement).textContent =
      t('results', { count: number(shown.length) }) +
      (affordableOnly ? ' · ' + t('underPrice', { price: money(50) }) : '')
    replaceChildren(
      requiredElement('#products', HTMLElement),
      shown.length
        ? shown.map(createProductCard)
        : [createElement('p', { className: 'empty', text: t('noResults') })],
    )
  }

  function updateCategories() {
    const category = requiredElement('#category', HTMLSelectElement).value
    replaceChildren(requiredElement('#category', HTMLSelectElement), [
      createElement('option', {
        text: t('allCategories'),
        attributes: { value: '' },
      }),
      ...getCategories(products).map((name) =>
        createElement('option', { text: t(name), attributes: { value: name } }),
      ),
    ])
    requiredElement('#category', HTMLSelectElement).value = category || ''
  }

  function resetFilters() {
    requiredElement('#product-search', HTMLInputElement).value = ''
    requiredElement('#category', HTMLSelectElement).value = ''
    requiredElement('#sort', HTMLSelectElement).value = 'featured'
  }

  requiredElement('#product-search', HTMLInputElement).addEventListener(
    'input',
    renderProducts,
  )
  requiredElement('#category', HTMLSelectElement).addEventListener(
    'change',
    renderProducts,
  )
  requiredElement('#sort', HTMLSelectElement).addEventListener(
    'change',
    renderProducts,
  )
  requiredElement('#shop-all', HTMLElement).addEventListener('click', () => {
    resetFilters()
    affordableOnly = false
    renderProducts()
  })
  requiredElement('#affordable-products', HTMLElement).addEventListener(
    'click',
    () => {
      resetFilters()
      affordableOnly = true
      renderProducts()
    },
  )
  requiredElement('#products', HTMLElement).addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof Element)) return
      const button = event.target.closest<HTMLElement>('[data-add]')
      if (!button) return
      onAdd(button.dataset.add)
    },
  )

  return { renderProducts, updateCategories }
}
