import { Router } from 'express'
import { Services } from '../../../services'
import paths from '../../../constants/paths'
import CancelVisitorRequestController from './cancelVisitorRequestController'
import CancelVisitorRequestConfirmedController from './cancelVisitorRequestConfirmedController'

export default function routes(services: Services): Router {
  const router = Router()

  const cancelVisitorRequestController = new CancelVisitorRequestController(services.bookerService)
  const cancelVisitorRequestConfirmedController = new CancelVisitorRequestConfirmedController()

  router.get(
    `${paths.CANCEL_VISITOR_REQUEST.CANCEL}/:visitorDisplayId`,
    cancelVisitorRequestController.validateDisplayId(),
    cancelVisitorRequestController.view(),
  )

  router.post(
    `${paths.CANCEL_VISITOR_REQUEST.CANCEL}/:visitorDisplayId`,
    cancelVisitorRequestController.validateCancelChoice(),
    cancelVisitorRequestController.validateDisplayId(),
    cancelVisitorRequestController.submit(),
  )

  router.get(paths.CANCEL_VISITOR_REQUEST.CANCEL_CONFIRMATION, cancelVisitorRequestConfirmedController.view())

  return router
}
