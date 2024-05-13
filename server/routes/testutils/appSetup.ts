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
import cookieSession from 'cookie-session'
import { NotFound } from 'http-errors'

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

export const flashProvider = jest.fn()

function appSetup(services: Services, production: boolean, userSupplier: () => Express.User): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app, testAppInfo)
  app.use(cookieSession({ keys: [''] }))
  app.use((req, res, next) => {
    req.session.booker = { reference: bookerReference } // emulate populateCurrentBooker()
    req.user = userSupplier()
    req.flash = flashProvider
    res.locals = {
      user: { ...req.user },
    }
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(routes(services))
  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {},
  userSupplier = () => user,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => Express.User
}): Express {
  return appSetup(services as Services, production, userSupplier)
}
