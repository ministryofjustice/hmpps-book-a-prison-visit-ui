import type { TFunction } from 'i18next'

// eslint-disable-next-line import/prefer-default-export
export const mockTFunction = ((key: string, variables?: Record<string, unknown>) => {
  if (!variables) {
    return key
  }
  return `${key}|${Object.entries(variables)
    .map(([k, v]) => `${k}:${v}`)
    .join('|')}`
}) as TFunction
