import { RequestHandler, Response } from 'express'
import createError from 'http-errors'
import paths from '../constants/paths'
import logger from '../../logger'

const journeyOrder: string[] = [
  paths.BOOK_VISIT.SELECT_PRISONER,
  paths.BOOK_VISIT.CANNOT_BOOK,
  paths.BOOK_VISIT.SELECT_VISITORS,
  paths.BOOK_VISIT.CHOOSE_TIME,
  paths.BOOK_VISIT.ADDITIONAL_SUPPORT,
  paths.BOOK_VISIT.MAIN_CONTACT,
  paths.BOOK_VISIT.CHECK_DETAILS,
  paths.BOOK_VISIT.BOOKED,
]

export default function bookVisitSessionValidator(): RequestHandler {
  return (req, res, next) => {
    const { booker, bookingJourney, bookingConfirmed } = req.session
    const { baseUrl, method, path } = req
    const requestPath = `${baseUrl}${path}`

    const journeyStage = journeyOrder.indexOf(requestPath)

    // Unknown path
    if (journeyStage === -1) {
      return next(createError(404))
    }

    // No booker prisoner - any path
    if (!booker.prisoners?.length) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Booking confirmed (check first because bookingJourney cleared just before this stage)
    if (requestPath === paths.BOOK_VISIT.BOOKED) {
      return bookingConfirmed && !bookingJourney ? next() : logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Select visitors / Cannot book page
    if (journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.CANNOT_BOOK) && !bookingJourney?.prisoner) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Select visitors page - POST only
    if (
      journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.SELECT_VISITORS) &&
      method === 'POST' &&
      (!bookingJourney.prison || !bookingJourney.allVisitors?.length)
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Choose visit time page
    if (
      journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.CHOOSE_TIME) &&
      (!bookingJourney.prison || !bookingJourney.allVisitors?.length || !bookingJourney.selectedVisitors?.length)
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Choose visit time page - POST only
    if (
      journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.CHOOSE_TIME) &&
      method === 'POST' &&
      (!bookingJourney.allVisitSessionIds?.length || !bookingJourney.allVisitSessions?.length)
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Additional support page
    if (
      journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.ADDITIONAL_SUPPORT) &&
      (!bookingJourney.selectedVisitSession || !bookingJourney.applicationReference)
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Main contact page
    if (
      journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.MAIN_CONTACT) &&
      typeof bookingJourney.visitorSupport !== 'string'
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Check details page
    if (journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.CHECK_DETAILS) && !bookingJourney.mainContact) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    return next()
  }
}

function logAndRedirect(res: Response, method: string, requestPath: string, bookerReference: string) {
  logger.info(
    `Session validation failed at ${method} ${requestPath} for booker ${bookerReference}. Redirecting to '${paths.HOME}'`,
  )
  return res.redirect(paths.HOME)
}
