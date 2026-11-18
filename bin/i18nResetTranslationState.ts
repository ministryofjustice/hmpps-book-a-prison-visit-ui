/* eslint-disable no-console */
/* eslint-disable import/extensions */

/**
 * Resets server/locales/translation-state.json to match whatever is currently in
 * server/locales/en/*.json and server/locales/cy/*.json, marking every key/plural-group with
 * an existing Welsh translation as "up to date" with the current English text.
 *
 * Run this after adopting translation-state tracking (to establish the initial baseline
 * without a flood of false "stale" reports for existing translations), or any time an English
 * change is reviewed and judged not to need a matching Welsh update (for example a
 * punctuation-only tweak) - this confirms the current Welsh text as still valid.
 *
 * Usage: npm run i18n:reset-translation-state
 *
 * (Code from Copilot)
 */

import fs from 'node:fs'
import path from 'node:path'

import { flattenLocale, readLocaleJson } from './i18nLocaleFlatten.ts'
import {
  buildTranslationHashes,
  saveTranslationState,
  trackingKeyFor,
  type TranslationState,
} from './i18nTranslationState.ts'

const EN_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'en')
const CY_LOCALES_DIR = path.join(process.cwd(), 'server', 'locales', 'cy')

function jsonFileNames(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter(fileName => fileName.endsWith('.json'))
    .sort()
}

function main() {
  const state: TranslationState = {}

  const commonFileNames = jsonFileNames(EN_LOCALES_DIR).filter(fileName =>
    fs.existsSync(path.join(CY_LOCALES_DIR, fileName)),
  )

  commonFileNames.forEach(fileName => {
    const namespace = path.basename(fileName, '.json')
    const englishEntries = flattenLocale(readLocaleJson(path.join(EN_LOCALES_DIR, fileName)))
    const welshKeys = new Set(
      flattenLocale(readLocaleJson(path.join(CY_LOCALES_DIR, fileName))).map(entry => entry.key),
    )

    const currentHashes = buildTranslationHashes(englishEntries)
    const namespaceState: { [trackingKey: string]: string } = {}

    // Only reset tracking keys that actually have a Welsh translation to confirm.
    const trackingKeysWithWelsh = new Set([...welshKeys].map(trackingKeyFor))
    trackingKeysWithWelsh.forEach(trackingKey => {
      const hash = currentHashes.get(trackingKey)
      if (hash) {
        namespaceState[trackingKey] = hash
      }
    })

    state[namespace] = namespaceState
    console.log(`${namespace}: reset ${Object.keys(namespaceState).length} tracking key(s)`)
  })

  saveTranslationState(state)
}

main()
