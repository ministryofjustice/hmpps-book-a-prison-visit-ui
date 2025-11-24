import { Router } from 'express'
import { Services } from '../../services'
import paths from '../../constants/paths'
import AddVisitorStartController from './addVisitorStartController'
import VisitorDetailsController from './visitorDetailsController'
import CheckVisitorDetailsController from './checkVisitorDetailsController'

export default function routes(services: Services): Router {
  const router = Router()

  const addVisitorStartController = new AddVisitorStartController()
  const visitorDetailsController = new VisitorDetailsController()
  const checkVisitorDetailsController = new CheckVisitorDetailsController(services.bookerService)

  router.get(paths.ADD_VISITOR.START, addVisitorStartController.view())

  router.get(paths.ADD_VISITOR.DETAILS, visitorDetailsController.view())
  router.post(paths.ADD_VISITOR.DETAILS, visitorDetailsController.validate(), visitorDetailsController.submit())

  router.get(paths.ADD_VISITOR.CHECK, checkVisitorDetailsController.view())
  router.post(paths.ADD_VISITOR.CHECK, checkVisitorDetailsController.submit())

  return router
}
