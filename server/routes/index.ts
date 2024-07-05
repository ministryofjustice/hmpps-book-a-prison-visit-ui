import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import HomeController from './homeController'
import bookingJourneyRoutes from './bookVisit'
import paths from '../constants/paths'
import bookingsRoutes from './bookings/index'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const home = new HomeController(services.bookerService)

  router.use(bookingsRoutes(services))

  get(paths.HOME, home.view())

  router.use(bookingJourneyRoutes(services))

  return router
}
