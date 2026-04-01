import express, { Router } from 'express'

import i18next from 'i18next'
import FsBackend, { FsBackendOptions } from 'i18next-fs-backend'
import i18nextMiddleware from 'i18next-http-middleware'
import path from 'path'
import { LOCALE, SUPPORTED_LOCALES } from '../constants/locales'
import config from '../config'

export default function setUpI18n({ production }: { production: boolean }): Router {
  const router = express.Router()

  if (!i18next.isInitialized) {
    i18next
      .use(FsBackend)
      .use(i18nextMiddleware.LanguageDetector)

      .init<FsBackendOptions>({
        initAsync: false,
        fallbackLng: LOCALE.EN,
        supportedLngs: SUPPORTED_LOCALES,
        preload: SUPPORTED_LOCALES,
        showSupportNotice: false,

        ns: [
          'common',
          'errors',
          'validation',
          'addPrisoner',
          'addVisitor',
          'bookVisit',
          'selectPrison',
          'shared',
          'visitors',
          'visits',
          'staticPages',
        ],
        defaultNS: 'common',

        backend: {
          loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
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

        interpolation: {
          // Nunjucks already auto-escapes so don't want to double-escape
          escapeValue: false,
        },
      })
  }

  // Throw error on missing translation key (only non-production)
  i18next.options.saveMissing = !production
  i18next.options.missingKeyHandler = (lngs, ns, key) => {
    throw new Error(`Missing translation for key '${key}' in namespace '${ns}' and language '${lngs}'`)
  }

  router.use(i18nextMiddleware.handle(i18next))

  return router
}
