export default {
  'src/**/*.ts': ['eslint --max-warnings=0', 'prettier --check'],
  'tests/**/*.js': ['eslint --max-warnings=0', 'prettier --check'],
  './*.config.js': ['eslint --max-warnings=0', 'prettier --check'],
  'src/**/*.css': 'prettier --check',
  './*.json': 'prettier --check',
  './index.html': 'prettier --check',
}
