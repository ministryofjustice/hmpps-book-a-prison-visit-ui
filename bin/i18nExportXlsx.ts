/* eslint-disable no-console */
/* eslint-disable import/extensions */

/**
 * Exports all i18next locale JSON files (server/locales/en/*.json and server/locales/cy/*.json)
 * to a single .xlsx workbook, with one worksheet per JSON file (namespace). Each worksheet has
 * three columns: Translation key | English text | Welsh text.
 *
 * A row is included for every key found in either locale, so keys that only exist in one
 * locale - for example a Welsh-only plural form (`_two`/`_few`/`_many`) that has no English
 * equivalent, or an English key not yet translated - still appear, with the other language's
 * cell left blank.
 *
 * Usage: npm run i18n:export-xlsx
 *
 * (Code from Copilot)
 */

import fs from 'node:fs'
import path from 'node:path'
import writeExcelFile from 'write-excel-file/node'

import { flattenLocale, orderKeysWithPluralGroups, readLocaleJson } from './i18nLocaleFlatten.ts'

const EN_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'en')
const CY_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'cy')
const OUTPUT_FILE = path.join(process.cwd(), 'server', 'locales', 'translations.xlsx')

const HEADER_ROW = ['Translation key', 'English text', 'Welsh text']

function jsonFileNames(dir: string): string[] {
  return fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter(fileName => fileName.endsWith('.json'))
        .sort()
    : []
}

function entriesByKey(filePath: string): Map<string, string> {
  return fs.existsSync(filePath)
    ? new Map(flattenLocale(readLocaleJson(filePath)).map(entry => [entry.key, entry.value]))
    : new Map()
}

function buildSheet(fileName: string) {
  const namespace = path.basename(fileName, '.json')

  const enByKey = entriesByKey(path.join(EN_LOCALES_DIR, fileName))
  const cyByKey = entriesByKey(path.join(CY_LOCALES_DIR, fileName))

  const allKeys = orderKeysWithPluralGroups([...enByKey.keys()], [...cyByKey.keys()])

  return {
    sheet: namespace,
    stickyRowsCount: 1,
    columns: [{ width: 50 }, { width: 70 }, { width: 70 }],
    data: [
      HEADER_ROW.map(value => ({ value, fontWeight: 'bold' as const })),
      ...allKeys.map(key => [{ value: key }, { value: enByKey.get(key) ?? '' }, { value: cyByKey.get(key) ?? '' }]),
    ],
  }
}

async function main() {
  const fileNames = [...new Set([...jsonFileNames(EN_LOCALES_DIR), ...jsonFileNames(CY_LOCALES_DIR)])].sort()

  const sheets = fileNames.map(buildSheet)

  await writeExcelFile(sheets).toFile(OUTPUT_FILE)

  console.log(`Wrote ${sheets.length} worksheet(s) to ${OUTPUT_FILE}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
