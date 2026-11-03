# ShopBoard languages

## Files

- `src/modules/i18n/i18n.ts`: Arabic, English, and Turkish interface messages, locale settings, text lookup, and number formatting. No DOM or storage.
- `src/modules/products/products.data.ts`: stable product data plus `translations.en`, `translations.ar`, and `translations.tr`. Each contains a `name`, `description`, and `alt`.
- `src/modules/products/products.logic.ts`: searches localized product names with locale-aware case folding, filters stable category values, and sorts copies. USD formatting stays in `src/modules/i18n/i18n.ts`.
- `src/modules/cart/cart.state.ts`: persists the cart under `shopboard-catalog-cart-v2`.
- `src/modules/i18n/i18n.state.ts`: saves the language under `shopboard-language`; English is the default. Storage failures do not stop the shop.
- `src/shared/ui/storefront.ts`: mounts the unchanged page shell, icons, and campaign fallback.
- `src/modules/i18n/i18n.ui.ts`: updates document language/direction, title, interface text, and accessibility labels. `src/main.ts` connects its language callback to the product, cart, and toast refresh functions.
- `src/style.css`: logical layout properties, Arabic font support, and a fixed physical position for the header language picker.

## Editing translations

1. Edit a message in the matching `messages.en`, `messages.ar`, or `messages.tr` object in `src/modules/i18n/i18n.ts`.
2. Keep every message key present in all three languages.
3. Preserve placeholders such as `{name}`, `{count}`, `{year}`, and `{price}`. The UI fills them with the correct value.
4. Edit a product's display text in its `translations` object in `src/modules/products/products.data.ts`.
5. Do not translate or change product IDs, numeric prices, image paths, internal category values, or storage keys.

Category IDs remain `Bags`, `Shoes`, and `Accessories`; only their labels are translated. Language menu options intentionally retain their native names. Prices stay in USD with locale-appropriate formatting; there is no currency conversion. Search uses only the active language's product names. Turkish search preserves the difference between dotted and dotless i. Arabic search also ignores vowel marks and tatweel.

Switching language preserves the current search text, category, price order, and cart. An old-language search may therefore have no results until the visitor edits or clears it.

The image fallback SVG has no baked-in English label; its caption and alt text come from the active language. Clear-cart confirmation is rendered in the page so its buttons are translated too.

## Verification

Run `node --test tests/localization.test.js` and `npm run build`.

Also check in a browser: switching without reload, page refresh, RTL/LTR layout, fixed picker location, combined controls, all images, cart quantities and totals, clear-cart cancellation/confirmation, and keyboard focus. Test mobile Safari and real touch devices separately from desktop Chrome emulation.
