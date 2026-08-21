/* eslint-disable no-console */
/* eslint-disable import/extensions */

/**
 * Compares the English and Welsh i18next locale JSON files (server/locales/en/*.json vs
 * server/locales/cy/*.json) and reports:
 *   1. Any file present in one locale but not the other.
 *   2. Any key present in one locale's file but not the corresponding file in the other locale.
 *   3. Any pluralised Welsh key that is missing one of Welsh's 6 CLDR plural categories
 *      (zero/one/two/few/many/other) - see server/locales/TRANSLATOR_CONTEXT.md.
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

// Welsh (cy) uses all 6 CLDR plural categories; English only uses 'one' and 'other'.
const CY_PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other']
const PLURAL_SUFFIX_PATTERN = new RegExp(`_(${CY_PLURAL_CATEGORIES.join('|')})$`)

function jsonFileNames(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter(fileName => fileName.endsWith('.json'))
    .sort()
}

function entriesOf(filePath: string): Map<string, string> {
  return new Map(flattenLocale(readLocaleJson(filePath)).map(entry => [entry.key, entry.value]))
}

// Splits a key like "selectVisitors.visitorLimits.maxAdults_two" into its plural
// base ("selectVisitors.visitorLimits.maxAdults") and suffix ("two"), or returns
// null if the key is not a pluralised key.
function pluralKeySplit(key: string): { base: string; suffix: string } | null {
  const match = key.match(PLURAL_SUFFIX_PATTERN)
  if (!match) {
    return null
  }
  return { base: key.slice(0, -match[0].length), suffix: match[1] }
}

// Groups pluralised keys ("foo_one", "foo_other", ...) by their base key, mapping
// each base to the set of plural suffixes present.
function pluralGroups(keys: string[]): Map<string, Set<string>> {
  const groups = new Map<string, Set<string>>()
  keys.forEach(key => {
    const split = pluralKeySplit(key)
    if (!split) {
      return
    }
    if (!groups.has(split.base)) {
      groups.set(split.base, new Set())
    }
    groups.get(split.base)!.add(split.suffix)
  })
  return groups
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
    const namespace = path.basename(fileName, '.json')
    const enEntries = entriesOf(path.join(EN_LOCALES_DIR, fileName))
    const cyEntries = entriesOf(path.join(CY_LOCALES_DIR, fileName))

    const enGroups = pluralGroups([...enEntries.keys()])
    const cyGroups = pluralGroups([...cyEntries.keys()])

    const enOnlyKeys = [...enEntries.keys()].filter(key => !cyEntries.has(key)).sort()

    // Welsh needs extra plural forms (_two/_few/_many/_zero) that English never has for
    // the same base key - these are expected, not a discrepancy, so exclude them here.
    const cyOnlyKeys = [...cyEntries.keys()]
      .filter(key => !enEntries.has(key))
      .filter(key => {
        const split = pluralKeySplit(key)
        return !(split && enGroups.has(split.base))
      })
      .sort()

    if (enOnlyKeys.length || cyOnlyKeys.length) {
      problemsFound = true
      console.log(`\n${fileName}:`)
      if (enOnlyKeys.length) {
        console.log(`  Keys only in 'en':`)
        enOnlyKeys.forEach(key =>
          console.log(`    [\x1b[31m${namespace}:${key}\x1b[0m]: \x1b[34m${enEntries.get(key)}\x1b[0m`),
        )
      }
      if (cyOnlyKeys.length) {
        console.log(`  Keys only in 'cy':`)
        cyOnlyKeys.forEach(key =>
          console.log(`    [\x1b[31m${namespace}:${key}\x1b[0m]: \x1b[34m${cyEntries.get(key)}\x1b[0m`),
        )
      }
    }

    // Any base key pluralised in either locale must have all 6 Welsh CLDR plural
    // categories defined in cy, otherwise i18next silently falls back to English
    // for counts that map to a missing category (e.g. 2 -> 'two', 3 -> 'few').
    const allBases = new Set([...enGroups.keys(), ...cyGroups.keys()])
    const missingCyPluralForms = [...allBases]
      .filter(base => cyGroups.has(base))
      .map(base => ({ base, missing: CY_PLURAL_CATEGORIES.filter(category => !cyGroups.get(base)!.has(category)) }))
      .filter(({ missing }) => missing.length)
      .sort((a, b) => a.base.localeCompare(b.base))

    if (missingCyPluralForms.length) {
      problemsFound = true
      console.log(`\n${fileName}:`)
      console.log(`  Welsh plural forms missing (needs all of: ${CY_PLURAL_CATEGORIES.join(', ')}):`)
      missingCyPluralForms.forEach(({ base, missing }) =>
        console.log(`    [\x1b[31m${namespace}:${base}\x1b[0m] missing: \x1b[34m${missing.join(', ')}\x1b[0m`),
      )
    }
  })

  if (!problemsFound) {
    console.log('No differences found between en and cy locale files.')
  }

  process.exitCode = problemsFound ? 1 : 0
}

main()
