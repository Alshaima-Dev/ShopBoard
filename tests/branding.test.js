import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const ui = fs.readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8')
const favicon = fs.readFileSync(new URL('../public/yaninda.svg', import.meta.url), 'utf8')

test('header and footer logos use editable text instead of embedded logo images', () => {
  const logos = ui.match(/<a class="wordmark"[^>]*>[\s\S]*?<\/a>/g)
  assert.equal(logos.length, 2)
  for (const logo of logos) {
    assert.match(logo, /<span class="brand-name" lang="en" dir="ltr">YANINDA<\/span>/)
    assert.match(logo, /data-brand-mark/)
    assert.doesNotMatch(logo, /<img\b|<image\b/)
  }
  assert.doesNotMatch(ui, /yaninda-logo-(dark|light)\.png|yaninda-symbol-(dark|light)\.png/)
})

test('inline brand symbol and SVG favicon share the same scalable ribbon geometry', () => {
  const symbol = ui.slice(ui.indexOf('function createBrandSymbol()'), ui.indexOf('// Both cards'))
  const paths = JSON.parse(symbol.match(/const paths = (\[[\s\S]*?\])/)[1])
  assert.ok(paths.length > 0)
  assert.match(symbol, /fill: 'currentColor'/)
  assert.match(symbol, /'aria-hidden': 'true'/)
  for (const path of paths) assert.ok(favicon.includes('d="' + path + '"'))
  assert.doesNotMatch(favicon, /<image\b|<filter\b|gradient|data:image/i)
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.match(html, /type="image\/svg\+xml" href="\/yaninda.svg"/)
})
