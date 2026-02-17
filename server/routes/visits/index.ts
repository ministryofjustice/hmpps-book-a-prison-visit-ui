import { Router } from 'express'
import { Services } from '../../services'
import paths from '../../constants/paths'
import VisitsController from './visitsController'
import VisitDetailsController from './visitDetailsController'
import CancelVisitController from './cancel/cancelVisitController'
import CancelVisitConfirmedController from './cancel/cancelVisitConfirmedController'

export default function routes(services: Services): Router {
  const router = Router()

  const visitsController = new VisitsController(services.visitService)
  const visitDetailsController = new VisitDetailsController(services.prisonService)
  const cancelVisitController = new CancelVisitController(services.visitService)
  const cancelVisitConfirmedController = new CancelVisitConfirmedController()

  // Short term redirect from old bookings URL to new visits URL (because old URL in confirmation emails)
  // Added 17/02/2026 - can be removed when /bookings requests no longer showing in logs
  router.get('/bookings', (req, res) => {
    res.redirect(paths.VISITS.HOME)
  })

  router.get(paths.VISITS.HOME, visitsController.view('future'))
  router.get(paths.VISITS.PAST, visitsController.view('past'))
  router.get(paths.VISITS.CANCELLED, visitsController.view('cancelled'))

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

  router.get(`${paths.VISITS.CANCEL_CONFIRMATION}`, cancelVisitConfirmedController.view())

  return router
}
