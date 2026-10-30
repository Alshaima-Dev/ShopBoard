import './style.css'
const image = (id,w=800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`
const products = [
 {id:1,name:'The everyday lounge chair',category:'Furniture',price:249,image:'photo-1567538096630-e0c55bd6374c',detail:'Natural oak / cream',tag:'Bestseller'},
 {id:2,name:'Slow morning mug',category:'Kitchen',price:24,image:'photo-1514228742587-6b1558fcca3d',detail:'Warm white',tag:''},
 {id:3,name:'A little green company',category:'Living',price:38,image:'photo-1459411552884-841db9b3cc2a',detail:'Plant + ceramic pot',tag:'New arrival'},
 {id:4,name:'Soft days cushion',category:'Textiles',price:42,image:'photo-1584100936595-c0654b55a2e2',detail:'Earthy neutrals',tag:''},
 {id:5,name:'The gathering chair',category:'Furniture',price:189,image:'photo-1598300042247-d088f8ab3a91',detail:'Natural finish',tag:'New arrival'},
 {id:6,name:'Everyday ceramic set',category:'Kitchen',price:68,image:'photo-1490312278390-ab64016e0aa9',detail:'Stone / set of 3',tag:'A thoughtful gift'},
]
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)
let cart = {}, category = 'All essentials', query = '', newOnly = false
try { const saved=JSON.parse(localStorage.getItem('shopboard-cart')); products.forEach(p=>{if(Number.isInteger(saved?.[p.id])&&saved[p.id]>0) cart[p.id]=Math.min(99,saved[p.id])}) } catch {}
const bag = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>'
document.querySelector('#app').innerHTML = `
<div class="announcement">Good things, thoughtfully chosen. <span>Free shipping on orders $100+</span><b>✳</b></div>
<header class="wrap header"><a class="wordmark" href="#">shopboard<sup>®</sup></a><nav aria-label="Main navigation"><a href="#shop" class="active" id="shop-all">Shop all</a><a href="#shop" id="new-arrivals">New arrivals <i></i></a><a href="#philosophy">Our philosophy</a></nav><button id="open-cart" class="bag">${bag} Bag <span id="count">0</span></button></header>
<main><section class="hero wrap" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">— &nbsp; MADE FOR YOUR EVERYDAY</span><h1 id="hero-title">A little less.<br>A little <em>better.</em></h1><p>Thoughtful objects for the spaces you love.<br>Discover everyday essentials that feel like you.</p><a href="#shop" class="primary">Find your everyday <span>↗</span></a><div class="hero-foot"><span>✳</span> Good design. Lasting company.</div></div><div class="hero-image"><img src="${image('photo-1616486338812-3dadae4b4ace',1400)}" alt="A calm living room with warm neutral furniture and natural textures" fetchpriority="high"><span class="image-note">A slower kind of living.</span><a class="collection-label" href="#shop"><span>THE EVERYDAY EDIT</span><strong>Room for the little things.</strong><b>↗</b></a></div></section>
<div class="benefits wrap"><div><span>↗</span><b>Considered design</b><small>Beautiful, useful, always.</small></div><div><span>♧</span><b>Made to stay</b><small>Less replacing. More enjoying.</small></div><div><span>♡</span><b>A personal touch</b><small>Objects with a little soul.</small></div><div><span>▱</span><b>Delivered with care</b><small>From our home to yours.</small></div></div>
<section class="shop wrap" id="shop" aria-labelledby="shop-title"><div class="section-heading"><div><span class="eyebrow">THE GOOD STUFF</span><h2 id="shop-title">Your everyday, elevated.</h2></div><p>Small discoveries. Lasting favorites.</p></div><div class="toolbar"><div class="filters" role="group" aria-label="Product category">${['All essentials','Furniture','Living','Kitchen','Textiles'].map((c,i)=>`<button data-category="${c}" class="${i===0?'selected':''}" aria-pressed="${i===0}">${c}</button>`).join('')}</div><div class="controls"><label class="search" for="product-search"><span class="sr-only">Search products</span><span aria-hidden="true">⌕</span><input id="product-search" type="search" placeholder="Find something good" aria-label="Search products"></label><label class="sr-only" for="sort">Sort products</label><select id="sort" aria-label="Sort products"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div></div><p id="results" aria-live="polite"></p><div id="products" class="product-grid"></div></section>
<section class="philosophy wrap" id="philosophy" aria-labelledby="philosophy-title"><span class="sun">✳</span><span class="eyebrow">FEWER THINGS. MORE MEANING.</span><h2 id="philosophy-title">Make room for what matters.</h2><p>We believe a good home is built slowly, with things you love.<br>Useful, beautiful pieces. Nothing extra. Just right.</p><a href="#shop">Discover your next favorite &nbsp; ↗</a></section></main>
<footer class="wrap"><a class="wordmark" href="#">shopboard<sup>®</sup></a><p>A little better, every day.</p><small>© ${new Date().getFullYear()} Shopboard · A demo shop, made with care.</small></footer>
<dialog id="cart" aria-labelledby="cart-title"><div class="cart-heading"><h2 id="cart-title">Your bag</h2><button id="close-cart" aria-label="Close bag">✕</button></div><div id="cart-items"></div><div id="cart-bottom"></div></dialog><div class="toast" role="status" aria-live="polite"></div>`
let timer
function notify(message){const toast=document.querySelector('.toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('visible'),2600)}
function renderProducts(){
 document.querySelectorAll('.header nav a').forEach(a => { const active = a.id === (newOnly ? 'new-arrivals' : 'shop-all'); a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current') })
 const shown=products.filter(p=>(category==='All essentials'||p.category===category)&&`${p.name} ${p.category} ${p.detail}`.toLowerCase().includes(query)&&(!newOnly||p.tag==='New arrival'))
 const sort=document.querySelector('#sort').value
 if(sort!=='featured') shown.sort((a,b)=>sort==='low'?a.price-b.price:b.price-a.price)
 document.querySelector('#results').textContent=`${shown.length} thoughtfully chosen ${shown.length===1?'essential':'essentials'}${newOnly?' · New arrivals':''}`
 document.querySelector('#products').innerHTML=shown.length?shown.map(p=>`<article class="product"><div class="product-image"><img src="${image(p.image)}" alt="${p.name}, ${p.detail.toLowerCase()}" loading="lazy">${p.tag?`<span class="tag">${p.tag}</span>`:''}<button data-add="${p.id}" class="add" aria-label="Add ${p.name} to bag">+</button></div><div class="product-title"><h3>${p.name}</h3><span>${money(p.price)}</span></div><p>${p.detail}</p><span class="swatch" aria-hidden="true"></span><span class="swatch second" aria-hidden="true"></span></article>`).join(''):'<p class="empty">No matches just yet. Try another search or category.</p>'
}
function renderCart(){
 const focused = document.activeElement;
 const focusId = focused?.dataset?.change || focused?.dataset?.remove;
 const focusStep = focused?.dataset?.step;
 document.querySelector('#count').textContent=Object.values(cart).reduce((a,b)=>a+b,0)
 const items=products.filter(p=>cart[p.id]), total=items.reduce((sum,p)=>sum+p.price*cart[p.id],0)
 document.querySelector('#cart-items').innerHTML=items.length?items.map(p=>`<div class="cart-item"><img src="${image(p.image,160)}" alt="${p.name}"><div><h3>${p.name}</h3><p>${money(p.price)}</p><div class="quantity"><button data-change="${p.id}" data-step="-1" aria-label="Decrease ${p.name} quantity">−</button><span>${cart[p.id]}</span><button data-change="${p.id}" data-step="1" aria-label="Increase ${p.name} quantity">+</button><button class="remove" data-remove="${p.id}">Remove</button></div></div></div>`).join(''):'<p class="empty">Your bag has room for something good.</p>'
 document.querySelector('#cart-bottom').innerHTML=items.length?`<div class="subtotal"><span>Subtotal</span><strong>${money(total)}</strong></div><p class="shipping">${total>=100?'Your order qualifies for free shipping.':`${money(100-total)} away from free shipping.`}</p><button class="primary checkout" id="checkout">Checkout demo <span>↗</span></button><p class="demo-note">Demo store · No payments or orders are processed.</p>`:'<button id="keep-shopping" class="primary">Explore the collection ↗</button>'
 if (focusId) { const selector = focusStep ? '[data-change="' + focusId + '"][data-step="' + focusStep + '"]' : '[data-remove="' + focusId + '"]'; (document.querySelector(selector) || document.querySelector('#cart-items button') || document.querySelector('#keep-shopping'))?.focus() }
 try{localStorage.setItem('shopboard-cart',JSON.stringify(cart))}catch{}
}
function resetFilters(){category='All essentials';query='';document.querySelector('#product-search').value='';document.querySelectorAll('[data-category]').forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))})}
document.querySelector('.filters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;newOnly=false;document.querySelectorAll('[data-category]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',String(el===b))});renderProducts()})
document.querySelector('#product-search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();renderProducts()})
document.querySelector('#sort').addEventListener('change',renderProducts)
document.querySelector('#new-arrivals').addEventListener('click',()=>{resetFilters();newOnly=true;renderProducts()})
document.querySelector('#shop-all').addEventListener('click',()=>{resetFilters();newOnly=false;renderProducts()})
document.querySelector('#products').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;cart[b.dataset.add]=Math.min(99,(cart[b.dataset.add]||0)+1);renderCart();notify('A good choice. Added to your bag.')})
const dialog=document.querySelector('#cart')
document.querySelector('#open-cart').addEventListener('click',()=>dialog.showModal())
document.querySelector('#close-cart').addEventListener('click',()=>dialog.close())
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}const b=e.target.closest('[data-change]'),remove=e.target.closest('[data-remove]');if(b){const id=b.dataset.change;cart[id]=Math.min(99,cart[id]+Number(b.dataset.step));if(cart[id]<=0)delete cart[id];renderCart()}if(remove){delete cart[remove.dataset.remove];renderCart()}if(e.target.closest('#keep-shopping'))dialog.close();if(e.target.closest('#checkout'))notify('This is a demo shop. No order was placed.')})
renderProducts();renderCart()
