import express from 'express'

import createError from 'http-errors'

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import { metricsMiddleware } from './monitoring/metricsApp'

import setupGovukOneLogin from './middleware/setUpGovukOneLogin'
import govukOneLogin from './authentication/govukOneLogin'
import setUpCsrf from './middleware/setUpCsrf'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'

import unauthenticatedRoutes from './routes/unauthenticatedRoutes'
import routes from './routes'

import type { Services } from './services'
import populateCurrentBooker from './middleware/populateCurrentBooker'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(metricsMiddleware)
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, services.applicationInfo)
  app.use(setupGovukOneLogin())
  app.use(unauthenticatedRoutes())
  app.use(govukOneLogin.authenticationMiddleware())
  app.use(populateCurrentBooker(services.bookerService))
  app.use(setUpCsrf())

  app.use(routes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
