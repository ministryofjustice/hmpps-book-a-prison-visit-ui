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
