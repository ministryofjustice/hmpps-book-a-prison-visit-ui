/**
 * Tracks whether each Welsh translation is still up to date with the English text it was
 * translated from, by storing a short hash of the English source alongside each key in
 * server/locales/translation-state.json.
 *
 * Pluralised keys (`_one`/`_other` in English, plus Welsh-only `_two`/`_few`/`_many`/`_zero`
 * forms - see server/locales/TRANSLATOR_CONTEXT.md) are tracked as a single group, keyed by
 * their base (e.g. "maxAdults" rather than "maxAdults_one"). The hash covers every English
 * plural form for that base, so a change to either "_one" or "_other" marks all of that
 * base's Welsh forms as stale - including the Welsh-only ones with no English equivalent.
 *
 * (Code from Copilot)
 */

/* eslint-disable import/extensions */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import { CY_PLURAL_CATEGORIES, pluralGroups, pluralKeySplit, type LocaleEntry } from './i18nLocaleFlatten.ts'

export const TRANSLATION_STATE_FILE = path.join(process.cwd(), 'server', 'locales', 'translation-state.json')

export type TranslationState = { [namespace: string]: { [trackingKey: string]: string } }

// Truncated to 16 hex chars: short enough for readable diffs, negligible collision risk here.
export function computeHash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16)
}

// Returns the key used to track staleness for a given locale key: the plural base for
// pluralised keys (so all of its suffixed forms share one hash), or the key itself.
export function trackingKeyFor(key: string): string {
  return pluralKeySplit(key)?.base ?? key
}

// Builds one hash per tracking key from a namespace's English entries, combining all plural
// forms for a given base so that a change to any of them invalidates the whole group.
export function buildTranslationHashes(enEntries: LocaleEntry[]): Map<string, string> {
  const enByKey = new Map(enEntries.map(entry => [entry.key, entry.value]))
  const groups = pluralGroups(enEntries.map(entry => entry.key))
  const hashes = new Map<string, string>()

  enEntries.forEach(({ key }) => {
    const split = pluralKeySplit(key)
    if (split) {
      if (hashes.has(split.base)) {
        return
      }
      const suffixes = groups.get(split.base)!
      const combined = CY_PLURAL_CATEGORIES.filter(category => suffixes.has(category))
        .map(category => `${category}=${enByKey.get(`${split.base}_${category}`)}`)
        .join('\u0001')
      hashes.set(split.base, computeHash(combined))
    } else {
      hashes.set(key, computeHash(enByKey.get(key)!))
    }
  })

  return hashes
}

export function loadTranslationState(): TranslationState {
  return fs.existsSync(TRANSLATION_STATE_FILE) ? JSON.parse(fs.readFileSync(TRANSLATION_STATE_FILE, 'utf-8')) : {}
}

export function saveTranslationState(state: TranslationState): void {
  const sortedState: TranslationState = {}
  Object.keys(state)
    .sort()
    .forEach(namespace => {
      sortedState[namespace] = {}
      Object.keys(state[namespace])
        .sort()
        .forEach(key => {
          sortedState[namespace][key] = state[namespace][key]
        })
    })
  fs.writeFileSync(TRANSLATION_STATE_FILE, `${JSON.stringify(sortedState, null, 2)}\n`)
}
