import { Router } from 'express'
import { Services } from '../../services'
import paths from '../../constants/paths'
import VisitsController from './visitsController'
import VisitDetailsController from './visitDetailsController'
import CancelVisitController from './cancel/cancelVisitController'
import CancelVisitConfirmedController from './cancel/cancelVisitConfirmedController'

export default function routes(services: Services): Router {
  const router = Router()

  const visitsController = new VisitsController(services.visitService, services.bookerService)
  const visitDetailsController = new VisitDetailsController(services.prisonService)
  const cancelVisitController = new CancelVisitController(services.visitService)
  const cancelVisitConfirmedController = new CancelVisitConfirmedController()

  // Home (future visits), past and cancelled visits
  router.get(paths.VISITS.HOME, visitsController.home())
  router.get(paths.VISITS.PAST, visitsController.view('past'))
  router.get(paths.VISITS.CANCELLED, visitsController.view('cancelled'))

  // (future) visit details
  router.get(
    `${paths.VISITS.DETAILS}/:visitDisplayId`,
    visitDetailsController.validate(),
    visitDetailsController.view('future'),
  )

  // (past) visit details
  router.get(
    `${paths.VISITS.VISIT_PAST}/:visitDisplayId`,
    visitDetailsController.validate(),
    visitDetailsController.view('past'),
  )

  // (cancelled) visit details
  router.get(
    `${paths.VISITS.VISIT_CANCELLED}/:visitDisplayId`,
    visitDetailsController.validate(),
    visitDetailsController.view('cancelled'),
  )

  // Cancel a visit journey
  // Are you sure page
  router
    .route(`${paths.VISITS.CANCEL_VISIT}/:visitDisplayId`)
    .all(cancelVisitController.validateVisitDisplayId())
    .get(cancelVisitController.view())
    .post(cancelVisitController.validateCancelChoice(), cancelVisitController.submit())

  // Cancel confirmation page
  router.get(paths.VISITS.CANCEL_CONFIRMATION, cancelVisitConfirmedController.view())

  return router
}
