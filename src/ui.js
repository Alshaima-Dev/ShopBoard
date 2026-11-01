import { products } from './data.js'
import { selectProducts, getCategories, calculateCartCount, calculateCartTotal, formatPrice } from './logic.js'
import { cartStore } from './state.js'

const money = formatPrice

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


// The supplied catalog has no photos, so show an honest category placeholder.
function createProductVisual(product, className) {
  return createElement('div', {
    className: `${className} product-placeholder`,
  }, [
    createElement('span', { className: 'placeholder-symbol', text: '✳', attributes: { 'aria-hidden': 'true' } }),
    createElement('span', { className: 'placeholder-category', text: product.category }),
  ])
}

function createProductCard(product) {
  const visual = createProductVisual(product, 'product-image')
  visual.append(createElement('button', {
    className: 'add',
    text: '+',
    attributes: {
      type: 'button',
      'data-add': product.id,
      'aria-label': `Add ${product.name} to bag`,
    },
  }))

  return createElement('article', { className: 'product' }, [
    visual,
    createElement('div', { className: 'product-title' }, [
      createElement('h3', { text: product.name }),
      createElement('span', { text: formatPrice(product.price) }),
    ]),
    createElement('p', { text: product.category }),
  ])
}

function createCartItem(product, quantity) {
  const quantityButton = (text, step, action) => createElement('button', {
    text,
    attributes: {
      type: 'button',
      'data-change': product.id,
      'data-step': step,
      'aria-label': `${action} ${product.name} quantity`,
    },
  })

  return createElement('article', { className: 'cart-item' }, [
    createProductVisual(product, 'cart-visual'),
    createElement('div', {}, [
      createElement('h3', { text: product.name }),
      createElement('p', { text: formatPrice(product.price) }),
      createElement('div', { className: 'quantity' }, [
        quantityButton('−', -1, 'Decrease'),
        createElement('span', { text: quantity }),
        quantityButton('+', 1, 'Increase'),
        createElement('button', {
          className: 'remove',
          text: 'Remove',
          attributes: { type: 'button', 'data-remove': product.id, 'aria-label': `Remove ${product.name} from bag` },
        }),
      ]),
    ]),
  ])
}

const image = (id,w=800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`

let affordableOnly = false
const bag = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>'
document.querySelector('#app').innerHTML = `
<div class="announcement">Good things, thoughtfully chosen. <span>Free shipping on orders $100+</span><b>✳</b></div>
<header class="wrap header"><a class="wordmark" href="#">shopboard<sup>®</sup></a><nav aria-label="Main navigation"><a href="#shop" class="active" id="shop-all">Shop all</a><a href="#shop" id="affordable-products">Under $50 <i></i></a><a href="#philosophy">Our philosophy</a></nav><button id="open-cart" class="bag">${bag} Bag <span id="count">0</span></button></header>
<main><section class="hero wrap" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">— &nbsp; MADE FOR YOUR EVERYDAY</span><h1 id="hero-title">A little less.<br>A little <em>better.</em></h1><p>Thoughtful picks for wherever life takes you.<br>Discover everyday essentials that feel like you.</p><a href="#shop" class="primary">Find your everyday <span>↗</span></a><div class="hero-foot"><span>✳</span> Good design. Lasting company.</div></div><div class="hero-image"><img src="${image('photo-1616486338812-3dadae4b4ace',1400)}" alt="A calm living room with warm neutral furniture and natural textures" fetchpriority="high"><span class="image-note">A slower kind of living.</span><a class="collection-label" href="#shop"><span>THE EVERYDAY EDIT</span><strong>Room for the little things.</strong><b>↗</b></a></div></section>
<div class="benefits wrap"><div><span>↗</span><b>Considered design</b><small>Beautiful, useful, always.</small></div><div><span>♧</span><b>Made to stay</b><small>Less replacing. More enjoying.</small></div><div><span>♡</span><b>A personal touch</b><small>Objects with a little soul.</small></div><div><span>▱</span><b>Delivered with care</b><small>From our home to yours.</small></div></div>
<section class="shop wrap" id="shop" aria-labelledby="shop-title"><div class="section-heading"><div><span class="eyebrow">THE GOOD STUFF</span><h2 id="shop-title">Your everyday, elevated.</h2></div><p>Small discoveries. Lasting favorites.</p></div><div class="toolbar"><div class="controls"><label class="search" for="product-search"><span class="sr-only">Search products</span><span aria-hidden="true">⌕</span><input id="product-search" type="search" placeholder="Find something good" aria-label="Search products"></label><label for="category">Category</label><select id="category"></select><label for="sort">Price</label><select id="sort" aria-label="Sort products"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div></div><p id="results" aria-live="polite"></p><div id="products" class="product-grid"></div></section>
<section class="philosophy wrap" id="philosophy" aria-labelledby="philosophy-title"><span class="sun">✳</span><span class="eyebrow">FEWER THINGS. MORE MEANING.</span><h2 id="philosophy-title">Make room for what matters.</h2><p>We believe a good home is built slowly, with things you love.<br>Useful, beautiful pieces. Nothing extra. Just right.</p><a href="#shop">Discover your next favorite &nbsp; ↗</a></section></main>
<footer class="wrap"><a class="wordmark" href="#">shopboard<sup>®</sup></a><p>A little better, every day.</p><small>© ${new Date().getFullYear()} Shopboard · A demo shop, made with care.</small></footer>
<dialog id="cart" aria-labelledby="cart-title"><div class="cart-heading"><h2 id="cart-title">Your bag</h2><button id="close-cart" aria-label="Close bag">✕</button></div><div id="cart-items"></div><div id="cart-bottom"></div></dialog><div class="toast" role="status" aria-live="polite"></div>`
let timer
function notify(message){const toast=document.querySelector('.toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('visible'),2600)}
function renderProducts(){
 document.querySelectorAll('.header nav a').forEach(a => { const active = a.id === (affordableOnly ? 'affordable-products' : 'shop-all'); a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current') })
 // Read all three controls together so changing one preserves the others.
 const query = document.querySelector('#product-search').value.trim().toLowerCase()
 const category = document.querySelector('#category').value
 const sort = document.querySelector('#sort').value

 const shown = selectProducts(products, { query, category, sort, affordableOnly })
 document.querySelector('#results').textContent=`${shown.length} thoughtfully chosen ${shown.length===1?'essential':'essentials'}${affordableOnly?' · Under $50':''}`
 // Turn each product object into a real DOM card, then update the list.
 const cards = shown.map(createProductCard)
 replaceChildren(document.querySelector('#products'), cards.length ? cards : [
   createElement('p', { className: 'empty', text: 'No matches just yet. Try another search or category.' }),
 ])
}
function renderCart(){
 const cart = cartStore.getCart();
 const focused = document.activeElement;
 const focusId = focused?.dataset?.change || focused?.dataset?.remove;
 const focusStep = focused?.dataset?.step;
 document.querySelector('#count').textContent = calculateCartCount(cart)
 const items = products.filter(product => cart[product.id]), total = calculateCartTotal(products, cart)
 replaceChildren(document.querySelector('#cart-items'), items.length
   ? items.map(product => createCartItem(product, cart[product.id]))
   : [createElement('p', { className: 'empty', text: 'Your bag has room for something good.' })])
 document.querySelector('#cart-bottom').innerHTML=items.length?`<div class="subtotal"><span>Subtotal</span><strong>${money(total)}</strong></div><p class="shipping">${total>=100?'Your order qualifies for free shipping.':`${money(100-total)} away from free shipping.`}</p><button class="primary checkout" id="checkout">Checkout demo <span>↗</span></button><p class="demo-note">Demo store · No payments or orders are processed.</p>`:'<button id="keep-shopping" class="primary">Explore the collection ↗</button>'
 if (focusId) { const selector = focusStep ? '[data-change="' + focusId + '"][data-step="' + focusStep + '"]' : '[data-remove="' + focusId + '"]'; (document.querySelector(selector) || document.querySelector('#cart-items button') || document.querySelector('#keep-shopping'))?.focus() }
}
function resetFilters() {
 document.querySelector('#product-search').value = ''
 document.querySelector('#category').value = ''
 document.querySelector('#sort').value = 'featured'
}

// Derive the available categories from the catalog rather than hardcoding them.
const categories = getCategories(products)
replaceChildren(document.querySelector('#category'), [
 createElement('option', { text: 'All categories', attributes: { value: '' } }),
 ...categories.map(name => createElement('option', { text: name, attributes: { value: name } })),
])

document.querySelector('#product-search').addEventListener('input', renderProducts)
document.querySelector('#category').addEventListener('change', renderProducts)
document.querySelector('#sort').addEventListener('change', renderProducts)

document.querySelector('#affordable-products').addEventListener('click',()=>{resetFilters();affordableOnly=true;renderProducts()})
document.querySelector('#shop-all').addEventListener('click',()=>{resetFilters();affordableOnly=false;renderProducts()})
document.querySelector('#products').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;cartStore.addItem(b.dataset.add);renderCart();notify('A good choice. Added to your bag.')})
const dialog=document.querySelector('#cart')
document.querySelector('#open-cart').addEventListener('click',()=>dialog.showModal())
document.querySelector('#close-cart').addEventListener('click',()=>dialog.close())
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}const b=e.target.closest('[data-change]'),remove=e.target.closest('[data-remove]');if(b){const id=b.dataset.change;cartStore.changeQuantity(id, Number(b.dataset.step));renderCart()}if(remove){cartStore.removeItem(remove.dataset.remove);renderCart()}if(e.target.closest('#keep-shopping'))dialog.close();if(e.target.closest('#checkout'))notify('This is a demo shop. No order was placed.')})
renderProducts();renderCart()
