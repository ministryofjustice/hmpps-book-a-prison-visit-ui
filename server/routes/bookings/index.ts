import { RequestHandler, Router } from 'express'
import { ValidationChain } from 'express-validator'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import paths from '../../constants/paths'
import BookingsController from './bookingsController'
import BookingDetailsController from './bookingDetailsController'
import CancelController from './cancel/cancelController'
import CancelConfirmedController from './cancel/cancelConfirmedController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const getWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.get(path, ...validationChain, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  const bookingsController = new BookingsController(services.visitService)
  const bookingDetailsController = new BookingDetailsController(services.bookerService, services.prisonService)
  const cancelVisitController = new CancelController(services.bookerService, services.visitService)
  const cancelVisitConfirmationController = new CancelConfirmedController()

  get(paths.BOOKINGS.HOME, bookingsController.view('future'))
  get(paths.BOOKINGS.PAST, bookingsController.view('past'))
  get(paths.BOOKINGS.CANCELLED, bookingsController.view('cancelled'))

  getWithValidation(
    `${paths.BOOKINGS.VISIT}/:visitDisplayId`,
    bookingDetailsController.validate(),
    bookingDetailsController.view('future'),
  )

  getWithValidation(
    `${paths.BOOKINGS.VISIT_PAST}/:visitDisplayId`,
    bookingDetailsController.validate(),
    bookingDetailsController.view('past'),
  )

  getWithValidation(
    `${paths.BOOKINGS.VISIT_CANCELLED}/:visitDisplayId`,
    bookingDetailsController.validate(),
    bookingDetailsController.view('cancelled'),
  )

  getWithValidation(
    `${paths.BOOKINGS.CANCEL_VISIT}/:visitDisplayId`,
    cancelVisitController.validateDisplayId(),
    cancelVisitController.view(),
  )

  postWithValidation(
    `${paths.BOOKINGS.CANCEL_VISIT}/:visitDisplayId`,
    cancelVisitController.validateCancelChoice(),
    cancelVisitController.submit(),
  )

  get(`${paths.BOOKINGS.CANCEL_CONFIRMATION}`, cancelVisitConfirmationController.view())

  return router
}
