import type { Product } from '../products/products.types.ts'
import { products } from '../products/products.data.ts'
import { createProductVisual } from '../products/products.ui.ts'
import { cartStore } from './cart.state.ts'
import { calculateCartCount, calculateCartTotal } from './cart.logic.ts'
import {
  createElement,
  replaceChildren,
  requiredElement,
} from '../../shared/ui/dom.ts'
import { createIcon } from '../../shared/ui/icons.ts'
import { t, money, number, textFor } from '../../shared/ui/formatting.ts'

function createCartItem(product: Product, quantity: number) {
  const copy = textFor(product)
  const quantityButton = (icon: string, step: number, key: string) =>
    createElement(
      'button',
      {
        attributes: {
          type: 'button',
          'data-change': product.id,
          'data-step': step,
          'aria-label': t(key, { name: copy.name }),
          title: t(key, { name: copy.name }),
        },
      },
      [createIcon(icon)],
    )
  return createElement('article', { className: 'cart-item' }, [
    createProductVisual(product, 'cart-visual'),
    createElement('div', {}, [
      createElement('h3', { text: copy.name }),
      createElement('p', { text: money(product.price) }),
      createElement('div', { className: 'quantity' }, [
        quantityButton('minus', -1, 'decrease'),
        createElement('span', {
          text: number(quantity),
          attributes: {
            'aria-label': t('quantity', {
              name: copy.name,
              count: number(quantity),
            }),
          },
        }),
        quantityButton('plus', 1, 'increase'),
        createElement('button', {
          className: 'remove',
          text: t('remove'),
          attributes: {
            type: 'button',
            'data-remove': product.id,
            'aria-label': t('removeItem', { name: copy.name }),
          },
        }),
      ]),
    ]),
  ])
}

export function initCartUI(notify: (key: string) => void) {
  let confirmClear = false

  function renderCart() {
    const cart = cartStore.getCart()
    const focused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const focusId = focused?.dataset?.change || focused?.dataset?.remove
    const focusStep = focused?.dataset?.step
    const count = calculateCartCount(cart)
    requiredElement('#count', HTMLElement).textContent = number(count)
    requiredElement('#open-cart', HTMLElement).setAttribute(
      'aria-label',
      t('openBag', { count: number(count) }),
    )
    const items = products.filter((product) => cart[product.id])
    const total = calculateCartTotal(products, cart)
    replaceChildren(
      requiredElement('#cart-items', HTMLElement),
      items.length
        ? items.map((product) => createCartItem(product, cart[product.id]))
        : [createElement('p', { className: 'empty', text: t('emptyCart') })],
    )
    const bottom = requiredElement('#cart-bottom', HTMLElement)
    if (!items.length) {
      confirmClear = false
      replaceChildren(bottom, [
        createElement('button', {
          className: 'primary',
          text: t('keepShopping'),
          attributes: { id: 'keep-shopping' },
        }),
      ])
    } else {
      const controls = [
        createElement('div', { className: 'subtotal' }, [
          createElement('span', { text: t('subtotal') }),
          createElement('bdi', { text: money(total) }),
        ]),
        createElement('p', {
          className: 'shipping',
          text:
            total >= 100
              ? t('freeShipping')
              : t('awayShipping', { price: money(100 - total) }),
        }),
        createElement('button', {
          className: 'primary checkout',
          text: t('checkout'),
          attributes: { id: 'checkout' },
        }),
        createElement('p', { className: 'demo-note', text: t('demoNote') }),
        createElement('button', {
          className: 'clear-cart',
          text: t('clearCart'),
          attributes: { id: 'clear-cart' },
        }),
      ]
      if (confirmClear)
        controls.push(
          createElement(
            'div',
            {
              className: 'clear-confirmation',
              attributes: {
                role: 'group',
                'aria-labelledby': 'clear-question',
              },
            },
            [
              createElement('p', {
                text: t('clearQuestion'),
                attributes: { id: 'clear-question' },
              }),
              createElement('button', {
                className: 'primary',
                text: t('confirmClear'),
                attributes: { id: 'confirm-clear' },
              }),
              createElement('button', {
                text: t('cancel'),
                attributes: { id: 'cancel-clear' },
              }),
            ],
          ),
        )
      replaceChildren(bottom, controls)
    }
    if (focusId) {
      const selector = focusStep
        ? `[data-change="${focusId}"][data-step="${focusStep}"]`
        : `[data-remove="${focusId}"]`
      ;(
        document.querySelector<HTMLElement>(selector) ||
        document.querySelector<HTMLElement>('#cart-items button') ||
        document.querySelector<HTMLElement>('#keep-shopping')
      )?.focus()
    }
  }

  const dialog = requiredElement('#cart', HTMLDialogElement)
  requiredElement('#open-cart', HTMLElement).addEventListener('click', () => {
    confirmClear = false
    renderCart()
    dialog.showModal()
  })
  requiredElement('#close-cart', HTMLElement).addEventListener('click', () => {
    dialog.close()
    confirmClear = false
  })
  dialog.addEventListener('cancel', () => {
    confirmClear = false
  })
  dialog.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect()
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close()
    }
    const change = event.target.closest<HTMLElement>('[data-change]')
    const remove = event.target.closest<HTMLElement>('[data-remove]')
    if (change) {
      cartStore.changeQuantity(
        change.dataset.change,
        Number(change.dataset.step),
      )
      renderCart()
    }
    if (remove) {
      cartStore.removeItem(remove.dataset.remove)
      renderCart()
      notify('removed')
    }
    if (event.target.closest('#keep-shopping')) dialog.close()
    if (event.target.closest('#checkout')) notify('checkoutMessage')
    if (event.target.closest('#clear-cart')) {
      confirmClear = true
      renderCart()
      document.querySelector<HTMLElement>('#confirm-clear')?.focus()
    }
    if (event.target.closest('#cancel-clear')) {
      confirmClear = false
      renderCart()
      document.querySelector<HTMLElement>('#clear-cart')?.focus()
    }
    if (event.target.closest('#confirm-clear')) {
      cartStore.clearCart()
      confirmClear = false
      renderCart()
      notify('cleared')
      document.querySelector<HTMLElement>('#keep-shopping')?.focus()
    }
  })

  function addItem(id: string | undefined) {
    cartStore.addItem(id)
    renderCart()
    notify('added')
  }

  return { renderCart, addItem }
}
