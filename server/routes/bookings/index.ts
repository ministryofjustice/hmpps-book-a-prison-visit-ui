import { RequestHandler, Router } from 'express'
import { ValidationChain } from 'express-validator'
import { Services } from '../../services'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import paths from '../../constants/paths'
import BookingsController from './bookingsController'
import BookingDetailsController from './bookingDetailsController'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  // const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const getWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.get(path, ...validationChain, asyncMiddleware(handler))

  const bookings = new BookingsController(services.visitService)
  const bookingDetailsController = new BookingDetailsController(services.bookerService)

  get(paths.BOOKINGS.HOME, bookings.view())
  getWithValidation(
    `${paths.BOOKINGS.VISIT}/:visitNumber`,
    bookingDetailsController.validate(),
    bookingDetailsController.view(),
  )

  return router
}
