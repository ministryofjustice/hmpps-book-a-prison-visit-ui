import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import HomeController from './homeController'
import bookingJourneyRoutes from './bookVisit'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const home = new HomeController(services.bookerService)

  get('/', home.view())

  router.use('/book-visit', bookingJourneyRoutes(services))

  return router
}
