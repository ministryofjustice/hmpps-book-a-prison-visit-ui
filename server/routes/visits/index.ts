import { Router } from 'express'
import { Services } from '../../services'
import paths from '../../constants/paths'
import BookingsController from './bookingsController'
import BookingDetailsController from './bookingDetailsController'
import CancelController from './cancel/cancelController'
import CancelConfirmedController from './cancel/cancelConfirmedController'

export default function routes(services: Services): Router {
  const router = Router()

  const bookingsController = new BookingsController(services.visitService)
  const bookingDetailsController = new BookingDetailsController(services.prisonService)
  const cancelVisitController = new CancelController(services.visitService)
  const cancelVisitConfirmationController = new CancelConfirmedController()

  router.get(paths.BOOKINGS.HOME, bookingsController.view('future'))
  router.get(paths.BOOKINGS.PAST, bookingsController.view('past'))
  router.get(paths.BOOKINGS.CANCELLED, bookingsController.view('cancelled'))

  router.get(
    `${paths.BOOKINGS.VISIT}/:visitDisplayId`,
    bookingDetailsController.validate(),
    bookingDetailsController.view('future'),
  )

  router.get(
    `${paths.BOOKINGS.VISIT_PAST}/:visitDisplayId`,
    bookingDetailsController.validate(),
    bookingDetailsController.view('past'),
  )

  router.get(
    `${paths.BOOKINGS.VISIT_CANCELLED}/:visitDisplayId`,
    bookingDetailsController.validate(),
    bookingDetailsController.view('cancelled'),
  )

  router.get(
    `${paths.BOOKINGS.CANCEL_VISIT}/:visitDisplayId`,
    cancelVisitController.validateDisplayId(),
    cancelVisitController.view(),
  )

  router.post(
    `${paths.BOOKINGS.CANCEL_VISIT}/:visitDisplayId`,
    cancelVisitController.validateCancelChoice(),
    cancelVisitController.submit(),
  )

  router.get(`${paths.BOOKINGS.CANCEL_CONFIRMATION}`, cancelVisitConfirmationController.view())

  return router
}
