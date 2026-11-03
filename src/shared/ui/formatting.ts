import type { Product } from '../../modules/products/products.types.ts'
import type { TranslationValues } from '../../modules/i18n/i18n.ts'
import {
  translate,
  formatPrice,
  formatNumber,
  getProductText,
} from '../../modules/i18n/i18n.ts'
import { languageStore } from '../../modules/i18n/i18n.state.ts'

// UI-only adapters read the single language preference; calculations stay pure.
export const getUILanguage = () => languageStore.getLanguage()
export const t = (key: string, values?: TranslationValues) =>
  translate(getUILanguage(), key, values)
export const money = (value: number) => formatPrice(value, getUILanguage())
export const number = (value: number) => formatNumber(value, getUILanguage())
export const textFor = (product: Product) =>
  getProductText(product, getUILanguage())
