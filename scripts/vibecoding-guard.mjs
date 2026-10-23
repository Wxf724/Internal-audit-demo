import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const srcDir = join(root, 'src')
const pagesDir = join(srcDir, 'pages')
const legacyPageFiles = new Set([
  'src/pages/NotFound.tsx',
  'src/pages/login/index.tsx',
  'src/pages/login/components/LoginCard.tsx',
])

const wrappedHeroImports = new Set([
  'Button',
  'Input',
  'Textarea',
  'Modal',
  'Pagination',
  'Tabs',
  'DatePicker',
  'DateRangePicker',
  'TreeSelect',
  'Tree',
  'SliderBar',
  'Spin',
  'AiFab',
])

const colorPatterns = [
  /\b(?:text|bg|border|ring|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d{1,3})?\b/g,
  /\b(?:text|bg|border|ring)-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\]/g,
  /#[0-9a-fA-F]{3,8}\b/g,
]

const sourceExts = new Set(['.ts', '.tsx', '.js', '.jsx'])
const issues = []

const walk = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return sourceExts.has(extname(entry.name)) ? [path] : []
  })
}

const lineOf = (content, index) => content.slice(0, index).split('\n').length
const rel = (path) => relative(root, path)
const shouldInspect = (file) => {
  const path = rel(file)
  if (legacyPageFiles.has(path)) return false
  return path.startsWith('src/pages/')
}

const addIssue = (file, line, message) => {
  issues.push(`${rel(file)}:${line} ${message}`)
}

const inspectImports = (file, content) => {
  const importPattern = /import\s+\{([^}]+)\}\s+from\s+['"]@heroui\/react['"]/g
  for (const match of content.matchAll(importPattern)) {
    const names = match[1]
      .split(',')
      .map((item) => item.trim().split(/\s+as\s+/)[0]?.trim())
      .filter(Boolean)
    const blocked = names.filter((name) => wrappedHeroImports.has(name))
    if (blocked.length) {
      addIssue(file, lineOf(content, match.index), `wrapped component imported from @heroui/react: ${blocked.join(', ')}. Use @/components.`)
    }
  }
}

const inspectColors = (file, content) => {
  for (const pattern of colorPatterns) {
    for (const match of content.matchAll(pattern)) {
      const token = match[0]
      if (token.includes('text-white')) continue
      addIssue(file, lineOf(content, match.index), `hardcoded color "${token}". Use CSS variables such as bg-(--surface), text-(--foreground), border-(--border).`)
    }
  }
}

const inspectPageLength = (file, content) => {
  if (!file.endsWith('/index.tsx')) return
  const lines = content.split('\n').length
  if (lines > 500) addIssue(file, 1, `page index has ${lines} lines. Move state to hooks/useXxxPage.ts and UI blocks to components/.`)
}

const inspectModuleShape = () => {
  let modules = []
  try {
    modules = readdirSync(pagesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  } catch {
    return
  }

  for (const entry of modules) {
    const moduleDir = join(pagesDir, entry.name)
    const indexPath = join(moduleDir, 'index.tsx')
    try {
      if (!statSync(indexPath).isFile()) continue
    } catch {
      continue
    }

    const index = readFileSync(indexPath, 'utf8')
    const lines = index.split('\n').length
    if (lines > 300) {
      for (const required of ['components', 'hooks']) {
        try {
          if (!statSync(join(moduleDir, required)).isDirectory()) throw new Error('missing')
        } catch {
          addIssue(indexPath, 1, `page over 300 lines should include ${required}/ for structured vibecoding output.`)
        }
      }
    }
  }
}

for (const file of walk(srcDir).filter(shouldInspect)) {
  const content = readFileSync(file, 'utf8')
  inspectImports(file, content)
  inspectColors(file, content)
  inspectPageLength(file, content)
}

inspectModuleShape()

if (issues.length) {
  console.error(`vibecoding guard found ${issues.length} issue(s):`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('vibecoding guard passed')
