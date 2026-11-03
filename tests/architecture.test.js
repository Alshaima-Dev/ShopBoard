import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../src/', import.meta.url))
const collect = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory()
      ? collect(file)
      : file.endsWith('.ts')
        ? [file]
        : []
  })
const files = collect(root)
const sources = new Map(
  files.map((file) => [file, fs.readFileSync(file, 'utf8')]),
)
const graph = new Map(
  files.map((file) => [
    file,
    [
      ...sources
        .get(file)
        .matchAll(/(?:from\s*|import\s*)['"]([^'"]+\.ts)['"]/g),
    ].map((match) => path.resolve(path.dirname(file), match[1])),
  ]),
)

test('all source module imports resolve and the dependency graph has no cycles', () => {
  const visited = new Set()
  const visiting = new Set()
  function visit(file) {
    assert.ok(graph.has(file), `Unresolved module: ${file}`)
    assert.ok(!visiting.has(file), `Circular dependency: ${file}`)
    if (visited.has(file)) return
    visiting.add(file)
    for (const dependency of graph.get(file)) visit(dependency)
    visiting.delete(file)
    visited.add(file)
  }
  visit(path.join(root, 'main.ts'))
  assert.equal(
    visited.size,
    files.length,
    'Every source module should be used by the application',
  )
})

test('DOM and storage access stay in their respective UI and persistence modules', () => {
  for (const [file, source] of sources) {
    const relative = path.relative(root, file).replaceAll('\\', '/')
    if (!relative.endsWith('.ui.ts') && !relative.startsWith('shared/ui/')) {
      assert.doesNotMatch(
        source,
        /\b(?:document|window)\./,
        `${relative} accesses the DOM`,
      )
    }
    if (!relative.endsWith('.state.ts')) {
      assert.doesNotMatch(
        source,
        /\blocalStorage\b/,
        `${relative} accesses browser storage`,
      )
    }
  }
  const configuration = JSON.parse(
    fs.readFileSync(new URL('../tsconfig.json', import.meta.url)),
  )
  for (const option of ['strict', 'noEmit', 'noUnusedLocals'])
    assert.equal(configuration.compilerOptions[option], true)
})
