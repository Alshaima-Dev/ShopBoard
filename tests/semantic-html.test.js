import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')

test('the HTML document contains the page landmarks and one meaningful main h1', () => {
  for (const tag of ['header', 'nav', 'main', 'footer']) {
    assert.equal([...html.matchAll(new RegExp(`<${tag}\\b`, 'g'))].length, 1)
  }
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)]
  assert.equal(headings.length, 1)
  assert.match(headings[0][1], /Your Style\./)
  assert.match(headings[0][1], /Your Story\./)
  assert.match(html, /<main\b[^>]*>[\s\S]*?<h1\b/)
  for (const control of html.matchAll(/<(?:input|select)\b[^>]*>/g)) {
    const id = control[0].match(/\bid="([^"]+)"/)?.[1]
    assert.ok(id, 'Each control needs an ID for its label')
    assert.match(html, new RegExp(`<label\\b[^>]*for="${id}"[^>]*>\\s*\\S`))
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(ids).size, ids.length, 'Static IDs must be unique')
})

test('signup constraints are native HTML and static markup is not rebuilt in TypeScript', () => {
  const email = html.match(/<input\b(?=[^>]*id="signup-email")[^>]*>/)?.[0]
  const password = html.match(
    /<input\b(?=[^>]*id="signup-password")[^>]*>/,
  )?.[0]
  assert.ok(email)
  assert.ok(password)
  assert.match(email, /\btype="email"/)
  assert.match(email, /\brequired\b/)
  assert.match(password, /\btype="password"/)
  assert.match(password, /\bminlength="8"/)
  assert.match(password, /\brequired\b/)
  assert.match(html, /<form\b(?=[^>]*id="signup-form")[^>]*>/)
  for (const file of [
    '../src/shared/ui/storefront.ts',
    '../src/modules/signup/signup.ui.ts',
  ]) {
    assert.doesNotMatch(
      fs.readFileSync(new URL(file, import.meta.url), 'utf8'),
      /\.innerHTML\s*=/,
    )
  }
})
