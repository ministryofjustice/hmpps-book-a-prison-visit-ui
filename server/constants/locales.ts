import config from '../config'

export const LOCALE = {
  EN: 'en',
  CY: 'cy',
} as const

export const SUPPORTED_LOCALES = config.features.welshLanguageEnabled
  ? ([LOCALE.EN, LOCALE.CY] as const)
  : ([LOCALE.EN] as const)
