import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import HomeController from './homeController'
import bookVisit from './bookVisit'
import paths from '../constants/paths'
import bookingsRoutes from './bookings'
import AccessDeniedController from './accessDeniedController'
import VisitorsController from './visitorsController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const homeController = new HomeController(services.bookerService)
  const visitorsController = new VisitorsController(services.bookerService)
  const accessDeniedController = new AccessDeniedController()

  get(paths.HOME, homeController.view())
  get(paths.RETURN_HOME, homeController.returnHome())

  router.use(bookVisit(services))

  router.use(bookingsRoutes(services))

  get(paths.VISITORS, visitorsController.view())

  get(paths.ACCESS_DENIED, accessDeniedController.view())

  return router
}
