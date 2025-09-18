/* eslint-disable import/first */
// eslint-disable-next-line import/order
import type { ApplicationInfo } from '../../applicationInfo'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
}

jest.mock('../../applicationInfo', () => {
  return jest.fn(() => testAppInfo)
})

import express, { Express, Request } from 'express'
import { NotFound } from 'http-errors'
import type { Session, SessionData } from 'express-session'
import { ValidationError } from 'express-validator'

import maintenancePageRoute from '../maintenancePageRoute'
import authenticatedRoutes from '../authenticatedRoutes'
import unauthenticatedRoutes from '../unauthenticatedRoutes'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import type { Services } from '../../services'
import TestData from './testData'
import analyticsConsent from '../../middleware/analyticsConsent'
import { FlashFormValues, MoJAlert } from '../../@types/bapv'

export const user: Express.User = {
  sub: 'user1',
  phone_number_verified: true,
  phone_number: '+440123456789',
  email_verified: true,
  email: 'user1@example.com',
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
  userSupplier: () => Express.User,
  sessionData: SessionData,
  cookies: Request['cookies'],
): Express {
  const app = express()

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
    req.cookies = cookies
    res.locals = {
      user: { ...req.user },
    }
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
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
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => Express.User
  sessionData?: SessionData
  cookies?: Request['cookies']
}): Express {
  return appSetup(services as Services, production, userSupplier, sessionData, cookies)
}
