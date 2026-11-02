import { products } from './data.js'
import { selectProducts, getCategories, calculateCartCount, calculateCartTotal, formatPrice } from './logic.js'
import { cartStore, languageStore } from './state.js'
import { languages, translate, getProductText, formatNumber } from './i18n.js'

let language = languageStore.getLanguage()
let affordableOnly = false
let confirmClear = false
let notice = null
let toastTimer
const t = (key, values) => translate(language, key, values)
const money = value => formatPrice(value, language)
const number = value => formatNumber(value, language)
const textFor = product => getProductText(product, language)

// Create an element without interpreting product text as HTML.
function createElement(tag, { className, text, attributes = {} } = {}, children = []) {
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
function replaceChildren(container, children) {
  const fragment = document.createDocumentFragment()
  fragment.append(...children)
  container.replaceChildren(fragment)
}


// One outline icon style across product cards and cart controls.
function createIcon(name) {
  const paths = {
    sparkles: ['M9 4l1.7 5.3L16 11l-5.3 1.7L9 18l-1.7-5.3L2 11l5.3-1.7L9 4Z', 'M19 2v6M16 5h6M19 16v6M16 19h6'],
    heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z'],
    bow: ['M12 10C9 2 2 2 2 7c0 5 7 6 10 3Z', 'M12 10c3-8 10-8 10-3 0 5-7 6-10 3Z', 'M12 10c-1 4-3 7-5 10', 'M12 10c1 4 3 7 5 10', 'M10.5 10c0-2 3-2 3 0s-3 2-3 0Z'],
    plus: ['M12 5v14', 'M5 12h14'],
    minus: ['M5 12h14'],
    close: ['m6 6 12 12', 'M18 6 6 18'],
    search: ['M21 21l-5-5', 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],
    Bags: ['M5 7h14l1 14H4L5 7Z', 'M8 8V6a4 4 0 0 1 8 0v2'],
    Shoes: ['M3 13V8l5 3 3-2 3 5 6 2a2 2 0 0 1 1 2v2H3v-7Z', 'M3 17h18', 'M10 11l2-1', 'M12 13l2-1'],
    Accessories: ['M9 7V2h6v5', 'M9 17v5h6v-5', 'M12 8v4l2 1', 'M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0'],
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' })) {
    svg.setAttribute(key, value)
  }
  for (const d of paths[name] || paths.Bags) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
  return svg
}

// Selected ribbon silhouette, drawn as scalable filled paths rather than a raster logo.
function createBrandSymbol() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  for (const [name, value] of Object.entries({ viewBox: '0 0 160 128', fill: 'currentColor', 'aria-hidden': 'true', focusable: 'false' })) {
    svg.setAttribute(name, value)
  }
  const paths = [
    "M81 60C62 18 40 2 20 9C0 15 3 39 20 51C38 65 59 68 81 60ZM74 56C55 65 36 58 22 47C8 35 5 16 21 11C40 4 59 30 74 56Z",
    "M79 60C98 18 120 2 140 9C160 15 157 39 140 51C122 65 101 68 79 60ZM86 56C105 65 124 58 138 47C152 35 155 16 139 11C120 4 101 30 86 56Z",
    "M75 52C91 91 98 114 120 118C100 118 90 100 80 75C70 51 60 29 47 17C60 25 68 39 75 52Z",
    "M85 52C69 91 62 114 40 118C60 118 70 100 80 75C90 51 100 29 113 17C100 25 92 39 85 52Z"
]
  for (const d of paths) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', d)
    path.setAttribute('fill-rule', 'evenodd')
    svg.append(path)
  }
  return svg
}

// Both cards and cart thumbnails share localized photo and fallback handling.
function createProductVisual(product, className) {
  const base = import.meta.env?.BASE_URL || '/'
  const fallback = base + 'images/products/fallback.svg'
  const photo = createElement('img', {
    className: 'product-photo-img',
    attributes: { src: product.image ? base + product.image : fallback,
      alt: textFor(product).alt, loading: 'lazy', decoding: 'async', width: 1024, height: 1024 },
  })
  const visual = createElement('div', { className: className + ' product-photo' }, [photo])
  let usingFallback = !product.image
  let fallbackLabel
  photo.addEventListener('error', () => {
    if (photo.hidden) return
    if (!fallbackLabel) {
      fallbackLabel = createElement('span', { className: 'photo-unavailable', text: t('imageUnavailable', { name: textFor(product).name }) })
      visual.append(fallbackLabel)
    }
    photo.alt = t('imageUnavailable', { name: textFor(product).name })
    if (usingFallback) { photo.hidden = true; return }
    usingFallback = true
    photo.src = fallback
  })
  return visual
}

function createProductCard(product) {
  const copy = textFor(product)
  const visual = createProductVisual(product, 'product-image')
  visual.append(createElement('button', {
    className: 'add', attributes: { type: 'button', 'data-add': product.id,
      'aria-label': t('add', { name: copy.name }), title: t('add', { name: copy.name }) },
  }, [createIcon('plus')]))
  return createElement('article', { className: 'product' }, [
    visual,
    createElement('div', { className: 'product-title' }, [
      createElement('h3', { text: copy.name }),
      createElement('bdi', { className: 'product-price', text: money(product.price) }),
    ]),
    createElement('p', { className: 'product-category', text: t(product.category) }),
    createElement('p', { className: 'product-description', text: copy.description }),
  ])
}

function createCartItem(product, quantity) {
  const copy = textFor(product)
  const quantityButton = (icon, step, key) => createElement('button', {
    attributes: { type: 'button', 'data-change': product.id, 'data-step': step,
      'aria-label': t(key, { name: copy.name }), title: t(key, { name: copy.name }) },
  }, [createIcon(icon)])
  return createElement('article', { className: 'cart-item' }, [
    createProductVisual(product, 'cart-visual'),
    createElement('div', {}, [
      createElement('h3', { text: copy.name }),
      createElement('p', { text: money(product.price) }),
      createElement('div', { className: 'quantity' }, [
        quantityButton('minus', -1, 'decrease'),
        createElement('span', { text: number(quantity), attributes: { 'aria-label': t('quantity', { name: copy.name, count: number(quantity) }) } }),
        quantityButton('plus', 1, 'increase'),
        createElement('button', { className: 'remove', text: t('remove'), attributes: {
          type: 'button', 'data-remove': product.id, 'aria-label': t('removeItem', { name: copy.name }) } }),
      ]),
    ]),
  ])
}

// The shell is mounted once. Language changes update its text, not its listeners.
document.querySelector('#app').innerHTML = `
<div class="announcement wrap"><span data-i18n="announcement"></span> <span id="shipping-offer"></span></div>
<header class="wrap header">
  <a class="wordmark" href="#" data-i18n-aria="home"><span class="brand-mark" data-brand-mark aria-hidden="true"></span><span class="brand-name" lang="en" dir="ltr">YANINDA</span></a>
  <nav data-i18n-aria="navigation"><a href="#shop" id="shop-all" data-i18n="shopAll"></a><a href="#shop" id="affordable-products"></a><a href="#philosophy" data-i18n="philosophy"></a></nav>
  <div class="header-actions" dir="ltr">
    <div class="language-picker"><label for="language" class="sr-only" data-i18n="language"></label><select id="language" dir="auto"><option value="ar" lang="ar" dir="rtl">العربية</option><option value="en" lang="en">English</option><option value="tr" lang="tr">Türkçe</option></select></div>
    <button id="open-cart" class="bag"><span class="bag-icon" aria-hidden="true"></span><span class="bag-label" data-i18n="bag"></span><span id="count"></span></button>
  </div>
</header>
<main>
<section class="hero wrap" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow" data-i18n="heroEyebrow"></span><h1 id="hero-title"><span data-i18n="heroFirst"></span><br><em data-i18n="heroSecond"></em></h1><p data-i18n="heroDescription"></p><a href="#shop" class="primary"><span data-i18n="heroAction"></span><span class="direction-icon" aria-hidden="true">↗</span></a><div class="hero-foot"><span class="brand-mark" data-brand-mark aria-hidden="true"></span><span data-i18n="heroFoot"></span></div></div>
<div class="hero-image"><img src="${import.meta.env?.BASE_URL || '/'}images/brand/yaninda-campaign.jpg" width="1200" height="1200" data-i18n-alt="heroAlt" fetchpriority="high"></div></section>
<div class="benefits wrap">${[['sparkles','benefitDesign','benefitDesignText'],['Bags','benefitLast','benefitLastText'],['heart','benefitPersonal','benefitPersonalText'],['bow','benefitCare','benefitCareText']].map(([icon,title,description])=>`<div><span data-benefit-icon="${icon}" aria-hidden="true"></span><b data-i18n="${title}"></b><small data-i18n="${description}"></small></div>`).join('')}</div>
<section class="shop wrap" id="shop" aria-labelledby="shop-title"><div class="section-heading"><div><span class="eyebrow" data-i18n="shopEyebrow"></span><h2 id="shop-title" data-i18n="shopTitle"></h2></div><p data-i18n="shopDescription"></p></div>
<div class="toolbar"><div class="controls"><label class="search" for="product-search"><span class="sr-only" data-i18n="search"></span><span class="search-icon" aria-hidden="true"></span><input id="product-search" type="search" data-i18n-placeholder="searchPlaceholder" data-i18n-aria="search"></label><div class="control-field"><label for="category" data-i18n="category"></label><select id="category"></select></div><div class="control-field"><label for="sort" data-i18n="price"></label><select id="sort" data-i18n-aria="sort"><option value="featured" data-i18n="featured"></option><option value="low" data-i18n="low"></option><option value="high" data-i18n="high"></option></select></div></div></div>
<p id="results" aria-live="polite"></p><div id="products" class="product-grid"></div></section>
<section class="philosophy wrap" id="philosophy" aria-labelledby="philosophy-title"><span class="sun brand-mark" data-brand-mark aria-hidden="true"></span><span class="eyebrow" data-i18n="philosophyEyebrow"></span><h2 id="philosophy-title" data-i18n="philosophyTitle"></h2><p data-i18n="philosophyText"></p><a class="primary" href="#shop"><span data-i18n="discover"></span> <span class="direction-icon" aria-hidden="true">↗</span></a></section>
</main>
<footer class="wrap"><a class="wordmark" href="#" data-i18n-aria="home"><span class="brand-mark" data-brand-mark aria-hidden="true"></span><span class="brand-name" lang="en" dir="ltr">YANINDA</span></a><p data-i18n="footerTagline"></p><small id="footer-copy"></small></footer>
<dialog id="cart" aria-labelledby="cart-title"><div class="cart-heading"><h2 id="cart-title" data-i18n="cartTitle"></h2><button id="close-cart" data-i18n-aria="closeBag"></button></div><div id="cart-items"></div><div id="cart-bottom"></div></dialog>
<div class="toast" role="status" aria-live="polite"></div>`

// Mount decorative feature icons once; language changes only update their text.
document.querySelectorAll('[data-benefit-icon]').forEach(element => {
  const icon = createIcon(element.dataset.benefitIcon)
  icon.setAttribute('width', '24')
  icon.setAttribute('height', '24')
  element.append(icon)
})

document.querySelectorAll('[data-brand-mark]').forEach(element => element.append(createBrandSymbol()))

// Local fallback is attached once and stays translated when the language changes.
const heroPhoto = document.querySelector('.hero-image > img')
function updateHeroFallback() {
  if (!heroPhoto.dataset.fallback) return
  const message = t('imageUnavailable', { name: 'YANINDA' })
  heroPhoto.alt = message
  const label = document.querySelector('.hero-image .photo-unavailable')
  if (label) label.textContent = message
}
heroPhoto.addEventListener('error', () => {
  if (heroPhoto.hidden) return
  if (heroPhoto.dataset.fallback) {
    heroPhoto.hidden = true
    heroPhoto.parentElement.append(createElement('p', { className: 'photo-unavailable', text: t('imageUnavailable', { name: 'YANINDA' }) }))
  } else {
    heroPhoto.dataset.fallback = 'true'
    heroPhoto.src = (import.meta.env?.BASE_URL || '/') + 'images/products/fallback.svg'
  }
  updateHeroFallback()
})

document.querySelector('.bag-icon').append(createIcon('Bags'))
document.querySelector('.search-icon').append(createIcon('search'))
document.querySelector('#close-cart').append(createIcon('close'))

function notify(key) {
  notice = key
  const toast = document.querySelector('.toast')
  toast.textContent = t(key)
  toast.classList.add('visible')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.classList.remove('visible'); notice = null }, 2600)
}

function renderProducts() {
  document.querySelectorAll('.header nav a').forEach(link => {
    const active = link.id === (affordableOnly ? 'affordable-products' : 'shop-all')
    link.classList.toggle('active', active)
    if (active) link.setAttribute('aria-current', 'true')
    else link.removeAttribute('aria-current')
  })
  const shown = selectProducts(products, {
    query: document.querySelector('#product-search').value,
    category: document.querySelector('#category').value,
    sort: document.querySelector('#sort').value,
    affordableOnly, language,
  })
  document.querySelector('#results').textContent = t('results', { count: number(shown.length) }) + (affordableOnly ? ' · ' + t('underPrice', { price: money(50) }) : '')
  replaceChildren(document.querySelector('#products'), shown.length ? shown.map(createProductCard) : [
    createElement('p', { className: 'empty', text: t('noResults') }),
  ])
}

function renderCart() {
  const cart = cartStore.getCart()
  const focused = document.activeElement
  const focusId = focused?.dataset?.change || focused?.dataset?.remove
  const focusStep = focused?.dataset?.step
  const count = calculateCartCount(cart)
  document.querySelector('#count').textContent = number(count)
  document.querySelector('#open-cart').setAttribute('aria-label', t('openBag', { count: number(count) }))
  const items = products.filter(product => cart[product.id])
  const total = calculateCartTotal(products, cart)
  replaceChildren(document.querySelector('#cart-items'), items.length ? items.map(product => createCartItem(product, cart[product.id])) : [
    createElement('p', { className: 'empty', text: t('emptyCart') }),
  ])
  const bottom = document.querySelector('#cart-bottom')
  if (!items.length) {
    confirmClear = false
    replaceChildren(bottom, [createElement('button', { className: 'primary', text: t('keepShopping'), attributes: { id: 'keep-shopping' } })])
  } else {
    const controls = [
      createElement('div', { className: 'subtotal' }, [createElement('span', { text: t('subtotal') }), createElement('bdi', { text: money(total) })]),
      createElement('p', { className: 'shipping', text: total >= 100 ? t('freeShipping') : t('awayShipping', { price: money(100 - total) }) }),
      createElement('button', { className: 'primary checkout', text: t('checkout'), attributes: { id: 'checkout' } }),
      createElement('p', { className: 'demo-note', text: t('demoNote') }),
      createElement('button', { className: 'clear-cart', text: t('clearCart'), attributes: { id: 'clear-cart' } }),
    ]
    if (confirmClear) controls.push(createElement('div', { className: 'clear-confirmation', attributes: { role: 'group', 'aria-labelledby': 'clear-question' } }, [
      createElement('p', { text: t('clearQuestion'), attributes: { id: 'clear-question' } }),
      createElement('button', { className: 'primary', text: t('confirmClear'), attributes: { id: 'confirm-clear' } }),
      createElement('button', { text: t('cancel'), attributes: { id: 'cancel-clear' } }),
    ]))
    replaceChildren(bottom, controls)
  }
  if (focusId) {
    const selector = focusStep ? `[data-change="${focusId}"][data-step="${focusStep}"]` : `[data-remove="${focusId}"]`
    ;(document.querySelector(selector) || document.querySelector('#cart-items button') || document.querySelector('#keep-shopping'))?.focus()
  }
}

function applyLanguage() {
  document.documentElement.lang = language
  document.documentElement.dir = languages[language].dir
  document.title = t('title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta'))
  for (const [attribute, target] of [['data-i18n', null], ['data-i18n-aria', 'aria-label'], ['data-i18n-alt', 'alt'], ['data-i18n-placeholder', 'placeholder']]) {
    document.querySelectorAll(`[${attribute}]`).forEach(element => {
      const value = t(element.getAttribute(attribute))
      if (target) element.setAttribute(target, value)
      else element.textContent = value
    })
  }
  updateHeroFallback()
  document.querySelectorAll('.brand-name').forEach(element => { element.textContent = 'YANINDA' })
  document.querySelector('#shipping-offer').textContent = t('shippingOffer', { price: money(100) })
  document.querySelector('#affordable-products').textContent = t('underPrice', { price: money(50) })
  document.querySelector('#footer-copy').textContent = t('footer', { year: new Date().getFullYear() })
  document.querySelector('#language').value = language
  const category = document.querySelector('#category').value
  replaceChildren(document.querySelector('#category'), [
    createElement('option', { text: t('allCategories'), attributes: { value: '' } }),
    ...getCategories(products).map(name => createElement('option', { text: t(name), attributes: { value: name } })),
  ])
  document.querySelector('#category').value = category || ''
  if (notice) document.querySelector('.toast').textContent = t(notice)
  renderProducts()
  renderCart()
}

function resetFilters() {
  document.querySelector('#product-search').value = ''
  document.querySelector('#category').value = ''
  document.querySelector('#sort').value = 'featured'
}

// Register each listener once; translating never installs another listener.
document.querySelector('#language').addEventListener('change', event => {
  language = languageStore.setLanguage(event.target.value)
  applyLanguage()
})
document.querySelector('#product-search').addEventListener('input', renderProducts)
document.querySelector('#category').addEventListener('change', renderProducts)
document.querySelector('#sort').addEventListener('change', renderProducts)
document.querySelector('#shop-all').addEventListener('click', () => { resetFilters(); affordableOnly = false; renderProducts() })
document.querySelector('#affordable-products').addEventListener('click', () => { resetFilters(); affordableOnly = true; renderProducts() })
document.querySelector('#products').addEventListener('click', event => {
  const button = event.target.closest('[data-add]')
  if (!button) return
  cartStore.addItem(button.dataset.add)
  renderCart()
  notify('added')
})
const dialog = document.querySelector('#cart')
document.querySelector('#open-cart').addEventListener('click', () => { confirmClear = false; renderCart(); dialog.showModal() })
document.querySelector('#close-cart').addEventListener('click', () => { dialog.close(); confirmClear = false })
dialog.addEventListener('cancel', () => { confirmClear = false })
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close()
  }
  const change = event.target.closest('[data-change]')
  const remove = event.target.closest('[data-remove]')
  if (change) { cartStore.changeQuantity(change.dataset.change, Number(change.dataset.step)); renderCart() }
  if (remove) { cartStore.removeItem(remove.dataset.remove); renderCart(); notify('removed') }
  if (event.target.closest('#keep-shopping')) dialog.close()
  if (event.target.closest('#checkout')) notify('checkoutMessage')
  if (event.target.closest('#clear-cart')) { confirmClear = true; renderCart(); document.querySelector('#confirm-clear')?.focus() }
  if (event.target.closest('#cancel-clear')) { confirmClear = false; renderCart(); document.querySelector('#clear-cart')?.focus() }
  if (event.target.closest('#confirm-clear')) { cartStore.clearCart(); confirmClear = false; renderCart(); notify('cleared'); document.querySelector('#keep-shopping')?.focus() }
})
applyLanguage()
