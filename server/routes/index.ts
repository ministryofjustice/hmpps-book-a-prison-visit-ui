import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import HomeController from './homeController'
import bookingJourneyRoutes from './bookVisit'
import paths from '../constants/paths'
import bookingsRoutes from './bookings/index'
import AccessDeniedController from './accessDeniedController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const homeController = new HomeController(services.bookerService)
  const accessDeniedController = new AccessDeniedController()

  get(paths.HOME, homeController.view())
  get(paths.RETURN_HOME, homeController.returnHome())
  get(paths.ACCESS_DENIED, accessDeniedController.view())

  router.use(bookingsRoutes(services))
  router.use(bookingJourneyRoutes(services))

  return router
}
