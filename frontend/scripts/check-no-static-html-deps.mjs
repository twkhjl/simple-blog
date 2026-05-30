import { readFileSync } from 'node:fs'
import process from 'node:process'

const sourceRoot = new URL('../src/', import.meta.url)
const candidateFiles = [
  'router/index.ts',
  'layouts/PublicLayout.vue',
  'pages/public/HomePage.vue',
  'pages/public/AboutPage.vue',
  'pages/public/ContactPage.vue',
  'pages/public/ArticleListPage.vue',
  'pages/public/PostDetailPage.vue',
  'utils/staticPage.ts',
  'utils/staticDrawer.ts',
]

const bannedPatterns = [
  /\?raw\b/,
  /page_example\//,
  /extractStaticBodyHtml/,
  /bindStaticDrawer/,
  /\.html\?raw/,
]

const violations = []

for (const relativePath of candidateFiles) {
  const absolutePath = new URL(relativePath, sourceRoot)

  try {
    const source = readFileSync(absolutePath, 'utf8')

    for (const pattern of bannedPatterns) {
      if (pattern.test(source)) {
        violations.push(`${relativePath} matches ${pattern}`)
      }
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      continue
    }

    throw error
  }
}

if (violations.length > 0) {
  console.error('Static HTML dependency check failed:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

console.log('Static HTML dependency check passed.')
