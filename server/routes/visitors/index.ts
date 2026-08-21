import { Router } from 'express'
import { Services } from '../../services'
import VisitorsController from './visitorsController'
import paths from '../../constants/paths'
import addVisitorRoutes from './addVisitor'
import cancelVisitorRequestRoutes from './cancelVisitorRequest'

export default function routes(services: Services): Router {
  const router = Router()

  const visitorsController = new VisitorsController(services.bookerService)

  // Visitors
  router.get(paths.VISITORS, visitorsController.view())

  // Add (request) a visitor routes
  router.use(addVisitorRoutes(services))

  // Cancel a visitor request routes
  router.use(cancelVisitorRequestRoutes(services))

  return router
}
