/* eslint-disable import/first */
// eslint-disable-next-line import/order
import type { ApplicationInfo } from '../../applicationInfo'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  productId: 'UNASSIGNED',
  branchName: 'main',
}

jest.mock('../../applicationInfo', () => {
  return jest.fn(() => testAppInfo)
})

import express, { Express, Request } from 'express'
import { NotFound } from 'http-errors'
import type { Session, SessionData } from 'express-session'
import { ValidationError } from 'express-validator'

import setUpI18n from '../../middleware/setUpI18n'
import setCurrentUrl from '../../middleware/setCurrentUrl'
import removeLngAndRedirect from '../../middleware/removeLngAndRedirect'
import maintenancePageRoute from '../maintenancePageRoute'
import authenticatedRoutes from '../authenticatedRoutes'
import unauthenticatedRoutes from '../unauthenticatedRoutes'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import type { Services } from '../../services'
import TestData from './testData'
import analyticsConsent from '../../middleware/analyticsConsent'
import { FlashFormValues, MoJAlert } from '../../@types/bapv'
import { type Locale, LOCALE } from '../../constants/locales'

export const user: Express.User = {
  // Default values from GOV.UK One Login Simulator
  sub: 'urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=',
  phone_number_verified: true,
  phone_number: '07123456789',
  email_verified: true,
  email: 'test@example.com',

  idToken: 'idToken',
}

const bookerReference = TestData.bookerReference().value
const prisoners = [TestData.prisoner()]

export type FlashData = {
  errors?: ValidationError[]
  formValues?: FlashFormValues[]
  messages?: [MoJAlert]
}
export const flashProvider = jest.fn()

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => Express.User | undefined,
  sessionData: SessionData,
  cookies: Request['cookies'],
  lng?: Locale,
): Express {
  const app = express()

  // Need to set any cookies before i18n middleware so that language can be detected from cookies
  app.use((req, res, next) => {
    req.cookies = { ...cookies, ...(lng && { lng }) }
    next()
  })

  // TODO remove explicit setting of supportedLngs once Welsh feature flag is removed
  app.use(setUpI18n({ production, supportedLngs: [LOCALE.EN, LOCALE.CY] }))

  app.set('view engine', 'njk')

  nunjucksSetup(app, testAppInfo)
  app.use((req, res, next) => {
    if (!sessionData.booker) {
      // eslint-disable-next-line no-param-reassign
      sessionData.booker = { reference: bookerReference, prisoners } // emulate populateCurrentBooker()
    }
    req.session = sessionData as Session & Partial<SessionData>
    req.user = userSupplier()
    req.flash = flashProvider
    res.locals = {
      ...res.locals,
      ...(req.user && { user: { ...req.user } }),

      prisonNames: TestData.prisonNames(), // emulate populatePrisonNames()
    }
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.get('*any', setCurrentUrl())
  app.get('*any', removeLngAndRedirect())
  app.use(maintenancePageRoute())
  app.use(analyticsConsent())
  app.use(unauthenticatedRoutes(services))
  app.use(authenticatedRoutes(services))
  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {},
  userSupplier = () => user,
  sessionData = {} as SessionData,
  cookies = {} as Request['cookies'],
  lng,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => Express.User | undefined
  sessionData?: SessionData
  cookies?: Request['cookies']
  lng?: Locale
}): Express {
  return appSetup(services as Services, production, userSupplier, sessionData, cookies, lng)
}
