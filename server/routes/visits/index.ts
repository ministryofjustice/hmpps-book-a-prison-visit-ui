import { Router } from 'express'
import { Services } from '../../services'
import paths from '../../constants/paths'
import BookingsController from './bookingsController'
import VisitDetailsController from './visitDetailsController'
import CancelController from './cancel/cancelController'
import CancelConfirmedController from './cancel/cancelConfirmedController'

export default function routes(services: Services): Router {
  const router = Router()

  const bookingsController = new BookingsController(services.visitService)
  const visitDetailsController = new VisitDetailsController(services.prisonService)
  const cancelVisitController = new CancelController(services.visitService)
  const cancelVisitConfirmationController = new CancelConfirmedController()

  router.get(paths.VISITS.HOME, bookingsController.view('future'))
  router.get(paths.VISITS.PAST, bookingsController.view('past'))
  router.get(paths.VISITS.CANCELLED, bookingsController.view('cancelled'))

  router.get(
    `${paths.VISITS.DETAILS}/:visitDisplayId`,
    visitDetailsController.validate(),
    visitDetailsController.view('future'),
  )

  router.get(
    `${paths.VISITS.VISIT_PAST}/:visitDisplayId`,
    visitDetailsController.validate(),
    visitDetailsController.view('past'),
  )

  router.get(
    `${paths.VISITS.VISIT_CANCELLED}/:visitDisplayId`,
    visitDetailsController.validate(),
    visitDetailsController.view('cancelled'),
  )

  router.get(
    `${paths.VISITS.CANCEL_VISIT}/:visitDisplayId`,
    cancelVisitController.validateDisplayId(),
    cancelVisitController.view(),
  )

  router.post(
    `${paths.VISITS.CANCEL_VISIT}/:visitDisplayId`,
    cancelVisitController.validateCancelChoice(),
    cancelVisitController.submit(),
  )

  router.get(`${paths.VISITS.CANCEL_CONFIRMATION}`, cancelVisitConfirmationController.view())

  return router
}
