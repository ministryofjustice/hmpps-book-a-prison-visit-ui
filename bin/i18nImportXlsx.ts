/* eslint-disable no-console */
/* eslint-disable import/extensions */

/**
 * Reads the Welsh translations from server/locales/translations.xlsx (produced by
 * `npm run i18n:export-xlsx`, then filled in by a translator) and writes out the
 * corresponding server/locales/cy/*.json files.
 *
 * Only keys with a non-empty Welsh translation are written, so that i18next continues to
 * fall back to the English text for any keys not yet translated. This includes Welsh-only
 * plural forms (e.g. `_two`/`_few`/`_many`) that have no English equivalent, since Welsh
 * needs more CLDR plural categories than English - see server/locales/TRANSLATOR_CONTEXT.md.
 *
 * Also updates server/locales/translation-state.json, recording the current English hash
 * for every key/plural-group just (re)translated, so `npm run i18n:locale-compare` can later
 * detect if the English text changes again without a matching Welsh update.
 *
 * Usage: npm run i18n:import-xlsx
 *
 * (Code from Copilot)
 */

import fs from 'node:fs'
import path from 'node:path'
import readXlsxFile from 'read-excel-file/node'

import {
  flattenLocale,
  orderKeysWithPluralGroups,
  pluralGroups,
  pluralKeySplit,
  readLocaleJson,
  unFlattenLocale,
  type LocaleEntry,
} from './i18nLocaleFlatten.ts'
import {
  buildTranslationHashes,
  loadTranslationState,
  saveTranslationState,
  trackingKeyFor,
} from './i18nTranslationState.ts'

const EN_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'en')
const CY_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'cy')
const INPUT_FILE = path.join(process.cwd(), 'server', 'locales', 'translations.xlsx')

const HEADER_ROW_COUNT = 1
const KEY_COLUMN_INDEX = 0
const WELSH_COLUMN_INDEX = 2

function cellToString(cellValue: unknown): string {
  if (cellValue === null || cellValue === undefined) {
    return ''
  }
  return String(cellValue).trim()
}

function importSheet(
  namespace: string,
  rows: unknown[][],
  existingNamespaceState: { [trackingKey: string]: string },
): { translatedCount: number; namespaceState: { [trackingKey: string]: string } } {
  const englishEntries = flattenLocale(readLocaleJson(path.join(EN_LOCALES_DIR, `${namespace}.json`)))
  const englishKeys = new Set(englishEntries.map(entry => entry.key))
  const englishPluralGroups = pluralGroups([...englishKeys])

  // A key not in English is still valid if it's an extra Welsh plural form (e.g.
  // "plurals.visitTime_two") of a base key that's pluralised in English.
  const isExpectedWelshOnlyKey = (key: string): boolean => {
    const split = pluralKeySplit(key)
    return split !== null && englishPluralGroups.has(split.base)
  }

  const welshByKey = new Map<string, string>()
  const orderedKeys: string[] = []
  rows.slice(HEADER_ROW_COUNT).forEach(row => {
    const key = cellToString(row[KEY_COLUMN_INDEX])
    if (!key) {
      return
    }
    if (!welshByKey.has(key)) {
      orderedKeys.push(key)
    }
    welshByKey.set(key, cellToString(row[WELSH_COLUMN_INDEX]))

    if (!englishKeys.has(key) && !isExpectedWelshOnlyKey(key)) {
      console.warn(`[${namespace}] key "${key}" found in spreadsheet but not in server/locales/en/${namespace}.json`)
    }
  })

  const missingFromSheet = englishEntries.filter(entry => !welshByKey.has(entry.key))
  missingFromSheet.forEach(entry => {
    console.warn(`[${namespace}] key "${entry.key}" is missing from the spreadsheet`)
  })

  // Preserve English key order first, and place any Welsh-only keys (e.g. extra plural
  // forms) alongside their `_one`/`_other` siblings rather than at the end of the file.
  // Only include keys that have a non-empty Welsh translation.
  const allKeys = orderKeysWithPluralGroups(
    englishEntries.map(entry => entry.key),
    orderedKeys,
  )

  const translatedEntries: LocaleEntry[] = allKeys
    .filter(key => welshByKey.get(key))
    .map(key => ({ key, value: welshByKey.get(key) as string }))

  const cyObject = unFlattenLocale(translatedEntries)
  fs.writeFileSync(path.join(CY_LOCALES_DIR, `${namespace}.json`), `${JSON.stringify(cyObject, null, 2)}\n`)

  // Record that these translations now match the current English text, so a future English
  // edit (and only that) will be flagged by `npm run i18n:locale-compare`.
  const currentHashes = buildTranslationHashes(englishEntries)
  const namespaceState = { ...existingNamespaceState }
  translatedEntries.forEach(({ key }) => {
    const trackingKey = trackingKeyFor(key)
    const hash = currentHashes.get(trackingKey)
    if (hash) {
      namespaceState[trackingKey] = hash
    }
  })

  return { translatedCount: translatedEntries.length, namespaceState }
}

async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`Could not find ${INPUT_FILE}. Run "npm run i18n:export-xlsx" first, or check the file path.`)
  }

  const sheets = await readXlsxFile(INPUT_FILE)
  const translationState = loadTranslationState()

  sheets.forEach(({ sheet: namespace, data: rows }) => {
    const englishJsonPath = path.join(EN_LOCALES_DIR, `${namespace}.json`)
    if (!fs.existsSync(englishJsonPath)) {
      console.warn(`Skipping worksheet "${namespace}": no matching server/locales/en/${namespace}.json`)
      return
    }

    const { translatedCount, namespaceState } = importSheet(namespace, rows, translationState[namespace] ?? {})
    translationState[namespace] = namespaceState
    const totalCount = flattenLocale(readLocaleJson(englishJsonPath)).length
    console.log(`${namespace}: wrote ${translatedCount}/${totalCount} translated keys`)
  })

  saveTranslationState(translationState)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
