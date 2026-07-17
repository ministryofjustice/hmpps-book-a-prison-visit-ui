/* eslint-disable no-console */
/* eslint-disable import/extensions */

/**
 * Compares the English and Welsh i18next locale JSON files (server/locales/en/*.json vs
 * server/locales/cy/*.json) and reports:
 *   1. Any file present in one locale but not the other.
 *   2. Any key present in one locale's file but not the corresponding file in the other locale.
 *
 * Usage: npm run i18n:locale-compare
 *
 * (Code from Copilot)
 */

import fs from 'node:fs'
import path from 'node:path'

import { flattenLocale, readLocaleJson } from './i18nLocaleFlatten.ts'

const EN_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'en')
const CY_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'cy')

function jsonFileNames(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter(fileName => fileName.endsWith('.json'))
    .sort()
}

function keysOf(filePath: string): Set<string> {
  return new Set(flattenLocale(readLocaleJson(filePath)).map(entry => entry.key))
}

function main() {
  let problemsFound = false

  const enFileNames = new Set(jsonFileNames(EN_LOCALES_DIR))
  const cyFileNames = new Set(jsonFileNames(CY_LOCALES_DIR))

  const enOnlyFiles = [...enFileNames].filter(fileName => !cyFileNames.has(fileName))
  const cyOnlyFiles = [...cyFileNames].filter(fileName => !enFileNames.has(fileName))

  if (enOnlyFiles.length) {
    problemsFound = true
    console.log(`Files only in 'en': ${enOnlyFiles.join(', ')}`)
  }
  if (cyOnlyFiles.length) {
    problemsFound = true
    console.log(`Files only in 'cy': ${cyOnlyFiles.join(', ')}`)
  }

  const commonFileNames = [...enFileNames].filter(fileName => cyFileNames.has(fileName)).sort()

  commonFileNames.forEach(fileName => {
    const enKeys = keysOf(path.join(EN_LOCALES_DIR, fileName))
    const cyKeys = keysOf(path.join(CY_LOCALES_DIR, fileName))

    const enOnlyKeys = [...enKeys].filter(key => !cyKeys.has(key)).sort()
    const cyOnlyKeys = [...cyKeys].filter(key => !enKeys.has(key)).sort()

    if (enOnlyKeys.length || cyOnlyKeys.length) {
      problemsFound = true
      console.log(`\n${fileName}:`)
      if (enOnlyKeys.length) {
        console.log(`  Keys only in 'en': ${enOnlyKeys.join(', ')}`)
      }
      if (cyOnlyKeys.length) {
        console.log(`  Keys only in 'cy': ${cyOnlyKeys.join(', ')}`)
      }
    }
  })

  if (!problemsFound) {
    console.log('No differences found between en and cy locale files.')
  }

  process.exitCode = problemsFound ? 1 : 0
}

main()
