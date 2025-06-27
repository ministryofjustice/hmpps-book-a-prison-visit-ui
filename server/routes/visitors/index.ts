import { Router } from 'express'
import { Services } from '../../services'
import VisitorsController from './visitorsController'
import paths from '../../constants/paths'

export default function routes(services: Services): Router {
  const router = Router()

  const visitorsController = new VisitorsController(services.bookerService)

  router.get(paths.VISITORS, visitorsController.view())

  return router
}
