import type { Language } from '../products/products.types.ts'
import type { StorageAdapter } from '../../shared/storage.types.ts'
import { getLanguage } from './i18n.ts'

// Preferences use a separate key and never touch the saved shopping cart.
export function createLanguageStore(storage?: StorageAdapter | null) {
  if (storage === undefined) {
    try {
      storage = globalThis.localStorage
    } catch {
      storage = null
    }
  }
  let language: Language = 'en'
  try {
    language = getLanguage(storage?.getItem('shopboard-language'))
  } catch {
    // Keep English when the saved preference cannot be read.
  }
  return {
    getLanguage: () => language,
    setLanguage(value: unknown) {
      language = getLanguage(value)
      try {
        storage?.setItem('shopboard-language', language)
      } catch {
        // Keep the in-memory language selection when saving is unavailable.
      }
      return language
    },
  }
}
export const languageStore = createLanguageStore()
