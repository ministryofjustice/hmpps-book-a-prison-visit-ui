import { RequestHandler, Router } from 'express'
import { Services } from '../../services'
import VisitorsController from './visitorsController'
import paths from '../../constants/paths'
import asyncMiddleware from '../../middleware/asyncMiddleware'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const visitorsController = new VisitorsController(services.bookerService)

  get(paths.VISITORS, visitorsController.view())

  return router
}
