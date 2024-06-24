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

import express, { Express } from 'express'
import { NotFound } from 'http-errors'
import type { Session, SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'

import unauthenticatedRoutes from '../unauthenticatedRoutes'
import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import type { Services } from '../../services'
import TestData from './testData'

export const user: Express.User = {
  sub: 'user1',
  phone_number_verified: true,
  phone_number: '+440123456789',
  email_verified: true,
  email: 'user1@example.com',
}

const bookerReference = TestData.bookerReference().value

export type FlashErrors = FieldValidationError[]
export type FlashFormValues = Record<string, string | string[] | number[]>
export type FlashData = {
  errors?: FlashErrors
  formValues?: FlashFormValues[]
  message?: [string]
}
export const flashProvider = jest.fn()

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => Express.User,
  sessionData: SessionData,
): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app, testAppInfo)
  app.use((req, res, next) => {
    if (!sessionData.booker) {
      // eslint-disable-next-line no-param-reassign
      sessionData.booker = { reference: bookerReference } // emulate populateCurrentBooker()
    }
    req.session = sessionData as Session & Partial<SessionData>
    req.user = userSupplier()
    req.flash = flashProvider
    res.locals = {
      user: { ...req.user },
    }
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(unauthenticatedRoutes())
  app.use(routes(services))
  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {},
  userSupplier = () => user,
  sessionData = {} as SessionData,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => Express.User
  sessionData?: SessionData
}): Express {
  return appSetup(services as Services, production, userSupplier, sessionData)
}
