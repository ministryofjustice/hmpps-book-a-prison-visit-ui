import { Router } from 'express'
import type { Services } from '../services'
import HomeController from './homeController'
import paths from '../constants/paths'
import addPrisonerRoutes from './addPrisoner'
import bookVisitRoutes from './bookVisit'
import bookingsRoutes from './bookings'
import visitorsRoutes from './visitors'

export default function routes(services: Services): Router {
  const router = Router()

  const homeController = new HomeController(services.bookerService)

  router.get(paths.HOME, homeController.view())
  router.get(paths.RETURN_HOME, homeController.returnHome())

  router.use(addPrisonerRoutes(services))

  router.use(bookVisitRoutes(services))
  router.use(bookingsRoutes(services))
  router.use(visitorsRoutes(services))

  return router
}
