import { Router } from 'express'
import { Services } from '../../services'
import paths from '../../constants/paths'
import AddVisitorStartController from './addVisitorStartController'
import VisitorDetailsController from './visitorDetailsController'
import CheckVisitorDetailsController from './checkVisitorDetailsController'
import VisitorRequestSuccessController from './visitorRequestSuccessController'
import VisitorRequestFailController from './visitorRequestFailController'

export default function routes(services: Services): Router {
  const router = Router()

  const addVisitorStartController = new AddVisitorStartController()
  const visitorDetailsController = new VisitorDetailsController()
  const checkVisitorDetailsController = new CheckVisitorDetailsController(services.bookerService)
  const visitorRequestSuccessController = new VisitorRequestSuccessController()
  const visitorRequestFailController = new VisitorRequestFailController()

  router.get(paths.ADD_VISITOR.START, addVisitorStartController.view())

  router.get(paths.ADD_VISITOR.DETAILS, visitorDetailsController.view())
  router.post(paths.ADD_VISITOR.DETAILS, visitorDetailsController.validate(), visitorDetailsController.submit())

  router.get(paths.ADD_VISITOR.CHECK, checkVisitorDetailsController.view())
  router.post(paths.ADD_VISITOR.CHECK, checkVisitorDetailsController.submit())

  router.get(paths.ADD_VISITOR.SUCCESS, visitorRequestSuccessController.view())

  router.get(
    [
      paths.ADD_VISITOR.FAIL_ALREADY_REQUESTED,
      paths.ADD_VISITOR.FAIL_ALREADY_LINKED,
      paths.ADD_VISITOR.FAIL_TOO_MANY_REQUESTS,
    ],
    visitorRequestFailController.view(),
  )

  return router
}
