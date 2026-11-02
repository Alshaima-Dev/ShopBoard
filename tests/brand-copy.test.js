import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { messages, translate } from '../src/i18n.js'

// Independent approved copy: do not derive expected wording from translations.
export const approvedCopy = {
  en: ['STYLE FOR EVERYONE', 'Your Style. Your Story.', 'Discover fashion, bags, shoes, and accessories for every style and every moment.', 'Explore the Collection', 'Style by Your Side.', '© 2026 YANINDA. Designed & developed by ALSHAIMA.'],
  ar: ['أناقة للجميع', 'أناقتك. حكايتك.', 'اكتشف الأزياء والحقائب والأحذية والإكسسوارات التي تناسب كل أسلوب وكل لحظة.', 'اكتشف التشكيلة', 'أناقتك دائمًا بجانبك.', '© 2026 YANINDA — تصميم وتطوير ALSHAIMA.'],
  tr: ['HERKES İÇİN STİL', 'Tarzın. Hikâyen.', 'Her tarza ve her ana uygun moda, çanta, ayakkabı ve aksesuarları keşfet.', 'Koleksiyonu Keşfet', 'Tarzın her an yanında.', '© 2026 YANINDA — Tasarım ve geliştirme: ALSHAIMA.'],
}

export const outdatedCopy = /MADE FOR YOUR EVERYDAY|A little less\.|A little better\.|Thoughtful picks for wherever life takes you|Find your everyday|Good design\. Lasting company\.|A slower kind of living\.|FEWER THINGS\. MORE MEANING\.|Make room for what matters\.|We believe a good home is built slowly|Discover your next favorite|A little better, every day\.|Good things, thoughtfully chosen\.|© 2026 ShopBoard|A demo shop, made with care\./i

test('hero, promotion, announcement and footer use the exact approved copy', () => {
  for (const [language, expected] of Object.entries(approvedCopy)) {
    const m = messages[language]
    assert.deepEqual([m.heroEyebrow, `${m.heroFirst} ${m.heroSecond}`, m.heroDescription, m.heroAction, m.heroFoot, translate(language, 'footer', { year: 2026 })], expected)
    assert.deepEqual([m.philosophyEyebrow, m.philosophyTitle, m.philosophyText, m.discover, m.footerTagline, translate(language, 'footer', { year: 2026 })], expected)
    assert.equal(m.announcement, expected[4])
    assert.doesNotMatch(Object.values(m).join('\n'), outdatedCopy)
  }
})

test('visible sections bind the approved keys and keep the dynamic copyright year', () => {
  const ui = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8')
  for (const [section, keys] of [
    [ui.match(/<section class="hero wrap"[\s\S]*?<\/section>/)?.[0], ['heroEyebrow', 'heroFirst', 'heroSecond', 'heroDescription', 'heroAction']],
    [ui.match(/<section class="philosophy wrap"[\s\S]*?<\/section>/)?.[0], ['philosophyEyebrow', 'philosophyTitle', 'philosophyText', 'discover']],
    [ui.match(/<footer[\s\S]*?<\/footer>/)?.[0], ['footerTagline']],
    [ui.match(/<div class="announcement wrap"[^\n]*/)?.[0], ['announcement']],
  ]) {
    assert.ok(section, 'Expected visible section is missing')
    for (const key of keys) assert.ok(section.includes(`data-i18n="${key}"`), `Missing active binding: ${key}`)
  }
  assert.ok(ui.includes("t('footer', { year: new Date().getFullYear() })"))
  for (const file of ['../src/ui.js', '../src/main.js', '../index.html']) {
    assert.doesNotMatch(readFileSync(new URL(file, import.meta.url), 'utf8'), outdatedCopy)
  }
})
