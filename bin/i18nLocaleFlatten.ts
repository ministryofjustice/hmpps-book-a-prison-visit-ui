/**
 * Locale JSON files (as used by i18next) are nested objects whose leaf values are strings.
 * These helpers flatten/un-flatten that structure to/from a flat list of dot-separated
 * "key" / "value" pairs, suitable for a two-column spreadsheet representation.
 *
 * Flattening preserves the original key order, and un-flattening reconstructs an object with
 * keys inserted in the same order, so `un-flatten(flatten(x))` round-trips to an object with
 * identical structure, key order and values as `x`.
 *
 * (Code from Copilot)
 */

import fs from 'node:fs'

export type LocaleEntry = { key: string; value: string }

export type LocaleObject = { [key: string]: string | LocaleObject }

export function readLocaleJson(filePath: string): LocaleObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

export function flattenLocale(obj: LocaleObject, prefix = ''): LocaleEntry[] {
  const entries: LocaleEntry[] = []

  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'string') {
      entries.push({ key: fullKey, value })
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenLocale(value, fullKey))
    } else {
      throw new Error(`Unsupported value at key "${fullKey}": expected a string or object, got ${typeof value}`)
    }
  })

  return entries
}

export function unFlattenLocale(entries: LocaleEntry[]): LocaleObject {
  const result: LocaleObject = {}

  entries.forEach(({ key, value }) => {
    const segments = key.split('.')
    let current = result

    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        current[segment] = value
        return
      }

      if (typeof current[segment] !== 'object' || current[segment] === null) {
        current[segment] = {}
      }
      current = current[segment] as LocaleObject
    })
  })

  return result
}

// Welsh (cy) uses all 6 CLDR plural categories; English only uses 'one' and 'other'.
export const CY_PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other']
const PLURAL_SUFFIX_PATTERN = new RegExp(`_(${CY_PLURAL_CATEGORIES.join('|')})$`)

// Splits a key like "selectVisitors.visitorLimits.maxAdults_two" into its plural
// base ("selectVisitors.visitorLimits.maxAdults") and suffix ("two"), or returns
// null if the key is not a pluralised key.
export function pluralKeySplit(key: string): { base: string; suffix: string } | null {
  const match = key.match(PLURAL_SUFFIX_PATTERN)
  if (!match) {
    return null
  }
  return { base: key.slice(0, -match[0].length), suffix: match[1] }
}

// Groups pluralised keys ("foo_one", "foo_other", ...) by their base key, mapping
// each base to the set of plural suffixes present.
export function pluralGroups(keys: string[]): Map<string, Set<string>> {
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

// Orders keys so that: non-plural keys stay in their original en/cy order, and each
// plural group's suffixed keys (english order + any Welsh-only suffixes) sit together
// in canonical zero/one/two/few/many/other order, in the position of their first occurrence.
export function orderKeysWithPluralGroups(enKeys: string[], cyKeys: string[]): string[] {
  const combinedGroups = pluralGroups([...enKeys, ...cyKeys])

  const orderedKeys: string[] = []
  const emittedBases = new Set<string>()

  ;[...enKeys, ...cyKeys.filter(key => !enKeys.includes(key))].forEach(key => {
    const split = pluralKeySplit(key)
    if (!split) {
      orderedKeys.push(key)
      return
    }
    if (emittedBases.has(split.base)) {
      return
    }
    emittedBases.add(split.base)
    const suffixesPresent = combinedGroups.get(split.base)!
    CY_PLURAL_CATEGORIES.filter(category => suffixesPresent.has(category)).forEach(category =>
      orderedKeys.push(`${split.base}_${category}`),
    )
  })

  return orderedKeys
}
