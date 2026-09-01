import { enGB, cy } from 'date-fns/locale'

export const LOCALE = {
  EN: 'en',
  CY: 'cy',
} as const

export type Locale = (typeof LOCALE)[keyof typeof LOCALE] // 'en' | 'cy'

export const SUPPORTED_LOCALES = [LOCALE.EN, LOCALE.CY] as const

export const DATE_FNS_LOCALE = {
  [LOCALE.EN]: enGB,
  [LOCALE.CY]: cy,
} as const
