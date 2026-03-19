import express, { Router } from 'express'

import i18next from 'i18next'
import FsBackend, { FsBackendOptions } from 'i18next-fs-backend'
import i18nextMiddleware from 'i18next-http-middleware'
import { LOCALE, SUPPORTED_LOCALES } from '../constants/locales'
import config from '../config'

export default function setUpI18n(): Router {
  const router = express.Router()

  i18next
    .use(FsBackend)
    .use(i18nextMiddleware.LanguageDetector)

    .init<FsBackendOptions>({
      initAsync: false,
      fallbackLng: LOCALE.EN,
      supportedLngs: SUPPORTED_LOCALES,
      preload: SUPPORTED_LOCALES,
      showSupportNotice: false,

      backend: {
        loadPath: 'server/locales/{{lng}}.json',
      },

      detection: {
        order: ['querystring', 'cookie'],
        lookupQuerystring: 'lng',
        lookupCookie: 'lng',
        caches: ['cookie'],
        ignoreCase: true,
        cookieSecure: config.https,
        cookieDomain: new URL(config.domain).hostname,
        cookieSameSite: 'lax',
        cookieHttpOnly: true,
      },
    })

  router.use(i18nextMiddleware.handle(i18next))

  return router
}
