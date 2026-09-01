import { Router } from 'express'
import { Services } from '../../../services'
import paths from '../../../constants/paths'
import CancelVisitorRequestController from './cancelVisitorRequestController'
import CancelVisitorRequestConfirmedController from './cancelVisitorRequestConfirmedController'

export default function routes(services: Services): Router {
  const router = Router()

  const cancelVisitorRequestController = new CancelVisitorRequestController(services.bookerService)
  const cancelVisitorRequestConfirmedController = new CancelVisitorRequestConfirmedController()

  router
    .route(`${paths.CANCEL_VISITOR_REQUEST.CANCEL}/:visitorRequestDisplayId`)
    .all(cancelVisitorRequestController.validateVisitorRequestDisplayId())
    .get(cancelVisitorRequestController.view())
    .post(cancelVisitorRequestController.validateCancelChoice(), cancelVisitorRequestController.submit())

  router.get(paths.CANCEL_VISITOR_REQUEST.CANCEL_CONFIRMATION, cancelVisitorRequestConfirmedController.view())

  return router
}
