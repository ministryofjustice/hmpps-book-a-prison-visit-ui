import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import HomeController from './homeController'
import bookingJourneyRoutes from './bookVisit'
import paths from '../constants/paths'
import BookingsController from './bookingsController'
import AccessDeniedController from './accessDeniedController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const home = new HomeController(services.bookerService)
  const booking = new BookingsController(services.visitService)
  const accessDenied = new AccessDeniedController()

  get(paths.HOME, home.view())
  get(paths.BOOKINGS.HOME, booking.view())

  router.use(bookingJourneyRoutes(services))

  router.get(paths.ACCESS_DENIED, accessDenied.view())

  return router
}
