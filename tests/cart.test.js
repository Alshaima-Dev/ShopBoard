import test from 'node:test'
import assert from 'node:assert/strict'
import { products } from '../src/modules/products/products.data.ts'
import {
  calculateCartCount,
  calculateCartTotal,
} from '../src/modules/cart/cart.logic.ts'

Object.defineProperty(globalThis, 'localStorage', {
  value: undefined,
  configurable: true,
})
const { createCartStore } = await import('../src/modules/cart/cart.state.ts')

test('existing saved carts load and keep their original key and quantity-map format', () => {
  const key = 'shopboard-catalog-cart-v2'
  const saved = new Map([[key, '{"1":2,"8":1}']])
  const storage = {
    getItem: (name) => saved.get(name) ?? null,
    setItem: (name, value) => saved.set(name, value),
  }
  const cart = createCartStore(products, storage)
  assert.deepEqual(cart.getCart(), { 1: 2, 8: 1 })
  assert.equal(calculateCartCount(cart.getCart()), 3)
  assert.equal(calculateCartTotal(products, cart.getCart()), 328)
  cart.changeQuantity(1, -1)
  cart.removeItem(8)
  cart.addItem(3)
  assert.deepEqual(JSON.parse(saved.get(key)), { 1: 1, 3: 1 })
  assert.deepEqual(createCartStore(products, storage).getCart(), { 1: 1, 3: 1 })
  const copy = cart.getCart()
  copy[1] = 99
  assert.equal(cart.getCart()[1], 1)
  cart.clearCart()
  assert.equal(saved.get(key), '{}')
  assert.deepEqual([...saved.keys()], [key])
})

test('cart validation and blocked or corrupt storage preserve a usable in-memory cart', () => {
  const cart = createCartStore(products, {
    getItem: () => '{"1":200,"2":-1,"3":1.5,"4":"2","999":4}',
    setItem() {},
  })
  assert.deepEqual(cart.getCart(), { 1: 99 })
  cart.changeQuantity(1, 1)
  cart.addItem(999)
  cart.changeQuantity(2, 1.5)
  assert.deepEqual(cart.getCart(), { 1: 99 })
  for (const storage of [
    { getItem: () => '{broken', setItem() {} },
    {
      getItem() {
        throw Error('blocked')
      },
      setItem() {
        throw Error('full')
      },
    },
  ]) {
    const store = createCartStore(products, storage)
    assert.deepEqual(store.getCart(), {})
    store.addItem(1)
    assert.deepEqual(store.getCart(), { 1: 1 })
    store.changeQuantity(1, -1)
    assert.deepEqual(store.getCart(), {})
  }
})
