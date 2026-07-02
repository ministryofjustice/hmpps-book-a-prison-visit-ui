/* eslint-disable no-console */
/* eslint-disable import/extensions */

/**
 * Exports all English i18next locale JSON files (server/locales/en/*.json) to a single
 * .xlsx workbook, with one worksheet per JSON file. Each worksheet has three columns:
 * Translation key | English text | Welsh text (left blank, for the translator to fill in).
 *
 * Usage: npm run i18n:export-xlsx
 *
 * (Code from Copilot)
 */

import fs from 'node:fs'
import path from 'node:path'
import writeExcelFile from 'write-excel-file/node'

import { flattenLocale, readLocaleJson } from './i18nLocaleFlatten.ts'

const EN_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'en')
const CY_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'cy')
const OUTPUT_FILE = path.join(process.cwd(), 'server', 'locales', 'translations.xlsx')

const HEADER_ROW = ['Translation key', 'English text', 'Welsh text']

function buildSheet(fileName: string) {
  const namespace = path.basename(fileName, '.json')
  const entries = flattenLocale(readLocaleJson(path.join(EN_LOCALES_DIR, fileName)))

  // Carry forward any translations that already exist in server/locales/cy, so that
  // re-exporting (e.g. after adding new English keys) doesn't lose completed translation work.
  // Newly added English keys will simply have a blank Welsh cell for the translator to fill in.
  const cyFilePath = path.join(CY_LOCALES_DIR, fileName)
  const existingWelshByKey = new Map<string, string>(
    fs.existsSync(cyFilePath) ? flattenLocale(readLocaleJson(cyFilePath)).map(entry => [entry.key, entry.value]) : [],
  )

  return {
    sheet: namespace,
    stickyRowsCount: 1,
    columns: [{ width: 50 }, { width: 70 }, { width: 70 }],
    data: [
      HEADER_ROW.map(value => ({ value, fontWeight: 'bold' as const })),
      ...entries.map(({ key, value }) => [{ value: key }, { value }, { value: existingWelshByKey.get(key) ?? '' }]),
    ],
  }
}

async function main() {
  const fileNames = fs
    .readdirSync(EN_LOCALES_DIR)
    .filter(fileName => fileName.endsWith('.json'))
    .sort()

  const sheets = fileNames.map(buildSheet)

  await writeExcelFile(sheets).toFile(OUTPUT_FILE)

  console.log(`Wrote ${sheets.length} worksheet(s) to ${OUTPUT_FILE}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
