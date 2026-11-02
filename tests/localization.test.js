import test from 'node:test'
import assert from 'node:assert/strict'
import { products } from '../src/data.js'
import { languages, messages, translate, getProductText } from '../src/i18n.js'
import { searchProducts, selectProducts, formatPrice, calculateCartTotal } from '../src/logic.js'
// Tests inject storage explicitly; do not use Node's experimental browser storage.
Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true })
const { createCartStore, createLanguageStore } = await import('../src/state.js')

const memoryStorage = () => {
  const items = new Map()
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) }
}

test('all interface keys and interpolation variables exist in every language', () => {
  const keys = Object.keys(messages.en).sort()
  for (const language of Object.keys(languages)) {
    assert.deepEqual(Object.keys(messages[language]).sort(), keys)
    for (const key of keys) {
      assert.ok(messages[language][key].trim())
      const variables = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
      assert.deepEqual(variables(messages[language][key]), variables(messages.en[key]))
    }
    assert.ok(translate(language, 'results', { count: 12 }).includes('12'))
  }
})

test('every product has names, descriptions, and alt text in every language', () => {
  for (const product of products) {
    for (const language of Object.keys(languages)) {
      const copy = getProductText(product, language)
      for (const field of ['name', 'description', 'alt']) assert.ok(copy[field].trim())
      assert.ok(!copy.name.includes('?'))
      assert.ok(!copy.description.includes('?'))
    }
    assert.equal(product.name, product.translations.en.name)
  }
})

test('locale-aware search, category filters, and both price orders work together without mutation', () => {
  const original = JSON.stringify(products)
  for (const language of Object.keys(languages)) {
    for (const product of products) {
      const name = getProductText(product, language).name
      for (const query of [name, name.toLocaleUpperCase(language), name.toLocaleLowerCase(language)]) {
        assert.ok(searchProducts(products, query, language).some(item => item.id === product.id))
        for (const sort of ['low', 'high']) {
          const result = selectProducts(products, { query, category: product.category, sort, language })
          assert.ok(result.some(item => item.id === product.id))
          assert.ok(result.every(item => item.category === product.category))
          const prices = result.map(item => item.price)
          assert.deepEqual(prices, [...prices].sort((a, b) => sort === 'low' ? a - b : b - a))
        }
      }
    }
    assert.equal(selectProducts(products, { query: 'zzzz-not-found', language }).length, 0)
  }
  assert.deepEqual(searchProducts(products, 'KOŞU AYAKKABISI', 'tr').map(p => p.id), [5])
  assert.ok(searchProducts(products, 'SIRT', 'tr').some(p => p.id === 2))
  assert.ok(searchProducts(products, 'GÜMÜŞ', 'tr').some(p => p.id === 8))
  assert.ok(searchProducts(products, 'حَقِيبَة', 'ar').some(p => p.id === 1))
  assert.equal(JSON.stringify(products), original)
})

test('language persistence never changes cart contents, values, or the currency', () => {
  const storage = memoryStorage()
  const cart = createCartStore(products, storage)
  const preference = createLanguageStore(storage)
  assert.equal(preference.getLanguage(), 'en')
  cart.addItem(1)
  cart.addItem(1)
  cart.addItem(8)
  const expected = cart.getCart()
  for (const language of ['ar', 'tr', 'en']) {
    preference.setLanguage(language)
    assert.equal(createLanguageStore(storage).getLanguage(), language)
    assert.deepEqual(createCartStore(products, storage).getCart(), expected)
    assert.equal(calculateCartTotal(products, expected), 328)
    assert.equal(new Intl.NumberFormat(languages[language].locale, { style: 'currency', currency: 'USD' }).resolvedOptions().currency, 'USD')
    assert.ok(formatPrice(328, language).length)
  }
  const copy = cart.getCart()
  copy[1] = 99
  assert.equal(cart.getCart()[1], 2)
  cart.clearCart()
  assert.deepEqual(createCartStore(products, storage).getCart(), {})
  assert.equal(preference.setLanguage('invalid'), 'en')
})

test('invalid and blocked language storage fall back to English', () => {
  const storage = memoryStorage()
  storage.setItem('shopboard-language', 'xx')
  assert.equal(createLanguageStore(storage).getLanguage(), 'en')
  const blocked = createLanguageStore({ getItem() { throw Error('blocked') }, setItem() { throw Error('full') } })
  assert.equal(blocked.getLanguage(), 'en')
  assert.equal(blocked.setLanguage('ar'), 'ar')
})

test('YANINDA identity and approved taglines stay consistent in every language', () => {
  const taglines = {
    en: 'Style by Your Side.',
    tr: 'Tarzın her an yanında.',
    ar: '\u0623\u0646\u0627\u0642\u062a\u0643 \u062f\u0627\u0626\u0645\u064b\u0627 \u0628\u062c\u0627\u0646\u0628\u0643.',
  }
  for (const language of Object.keys(languages)) {
    assert.ok(messages[language].title.startsWith('YANINDA'))
    assert.ok(messages[language].home.includes('YANINDA'))
    assert.ok(messages[language].footer.includes('YANINDA'))
    assert.ok(messages[language].footer.includes('ALSHAIMA'))
    assert.equal(messages[language].heroFoot, taglines[language])
    assert.equal(messages[language].footerTagline, taglines[language])
    assert.ok(!Object.values(messages[language]).some(value => /shopboard|\u0634\u0648\u0628 \u0628\u0648\u0631\u062f/i.test(value)))
  }
})
