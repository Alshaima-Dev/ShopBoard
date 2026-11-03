import { createElement, requiredElement } from './dom.ts'
import { createIcon, createBrandSymbol } from './icons.ts'
import { t } from './formatting.ts'

export function mountStorefront() {
  // The shell is mounted once. Language changes update its text, not its listeners.
  requiredElement('#app', HTMLElement).innerHTML = `
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
  <div class="benefits wrap">${[
    ['sparkles', 'benefitDesign', 'benefitDesignText'],
    ['Bags', 'benefitLast', 'benefitLastText'],
    ['heart', 'benefitPersonal', 'benefitPersonalText'],
    ['bow', 'benefitCare', 'benefitCareText'],
  ]
    .map(
      ([icon, title, description]) =>
        `<div><span data-benefit-icon="${icon}" aria-hidden="true"></span><b data-i18n="${title}"></b><small data-i18n="${description}"></small></div>`,
    )
    .join('')}</div>
  <section class="shop wrap" id="shop" aria-labelledby="shop-title"><div class="section-heading"><div><span class="eyebrow" data-i18n="shopEyebrow"></span><h2 id="shop-title" data-i18n="shopTitle"></h2></div><p data-i18n="shopDescription"></p></div>
  <div class="toolbar"><div class="controls"><label class="search" for="product-search"><span class="sr-only" data-i18n="search"></span><span class="search-icon" aria-hidden="true"></span><input id="product-search" type="search" data-i18n-placeholder="searchPlaceholder" data-i18n-aria="search"></label><div class="control-field"><label for="category" data-i18n="category"></label><select id="category"></select></div><div class="control-field"><label for="sort" data-i18n="price"></label><select id="sort" data-i18n-aria="sort"><option value="featured" data-i18n="featured"></option><option value="low" data-i18n="low"></option><option value="high" data-i18n="high"></option></select></div></div></div>
  <p id="results" aria-live="polite"></p><div id="products" class="product-grid"></div></section>
  <section class="philosophy wrap" id="philosophy" aria-labelledby="philosophy-title"><span class="sun brand-mark" data-brand-mark aria-hidden="true"></span><span class="eyebrow" data-i18n="philosophyEyebrow"></span><h2 id="philosophy-title" data-i18n="philosophyTitle"></h2><p data-i18n="philosophyText"></p><a class="primary" href="#shop"><span data-i18n="discover"></span> <span class="direction-icon" aria-hidden="true">↗</span></a></section>
  </main>
  <footer class="wrap"><a class="wordmark" href="#" data-i18n-aria="home"><span class="brand-mark" data-brand-mark aria-hidden="true"></span><span class="brand-name" lang="en" dir="ltr">YANINDA</span></a><p data-i18n="footerTagline"></p><small id="footer-copy"></small></footer>
  <dialog id="cart" aria-labelledby="cart-title"><div class="cart-heading"><h2 id="cart-title" data-i18n="cartTitle"></h2><button id="close-cart" data-i18n-aria="closeBag"></button></div><div id="cart-items"></div><div id="cart-bottom"></div></dialog>
  <div class="toast" role="status" aria-live="polite"></div>`

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
  heroPhoto.addEventListener('error', () => {
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
  })

  requiredElement('.bag-icon', HTMLElement).append(createIcon('Bags'))
  requiredElement('.search-icon', HTMLElement).append(createIcon('search'))
  requiredElement('#close-cart', HTMLElement).append(createIcon('close'))

  return { updateHeroFallback }
}
