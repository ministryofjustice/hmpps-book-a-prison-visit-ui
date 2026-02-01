import { RequestHandler, Response } from 'express'
import createError from 'http-errors'
import paths from '../constants/paths'
import logger from '../../logger'

const journeyOrder: string[] = [
  paths.BOOK_VISIT.SELECT_PRISONER,
  paths.BOOK_VISIT.CANNOT_BOOK,
  paths.BOOK_VISIT.SELECT_VISITORS,
  paths.BOOK_VISIT.CLOSED_VISIT,
  paths.BOOK_VISIT.CHOOSE_TIME,
  paths.BOOK_VISIT.ADDITIONAL_SUPPORT,
  paths.BOOK_VISIT.MAIN_CONTACT,
  paths.BOOK_VISIT.CONTACT_DETAILS,
  paths.BOOK_VISIT.CHECK_DETAILS,
  paths.BOOK_VISIT.BOOKED,
  paths.BOOK_VISIT.REQUESTED,
]

export default function bookVisitSessionValidator(): RequestHandler {
  return (req, res, next) => {
    const { booker, bookVisitJourney, bookVisitConfirmed } = req.session
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
    if (requestPath === paths.BOOK_VISIT.BOOKED || requestPath === paths.BOOK_VISIT.REQUESTED) {
      return bookVisitConfirmed && !bookVisitJourney
        ? next()
        : logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Cannot book page - requires reason to be set
    if (requestPath === paths.BOOK_VISIT.CANNOT_BOOK) {
      return bookVisitJourney?.cannotBookReason ? next() : logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Select visitors
    if (journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.SELECT_VISITORS) && !bookVisitJourney?.prisoner) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Select visitors page - POST only
    if (
      journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.SELECT_VISITORS) &&
      method === 'POST' &&
      (!bookVisitJourney.prison || !bookVisitJourney.eligibleVisitors?.length)
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Closed visit & Choose visit time page
    if (
      (journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.CLOSED_VISIT) ||
        journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.CHOOSE_TIME)) &&
      (!bookVisitJourney.prison ||
        !bookVisitJourney.eligibleVisitors?.length ||
        !bookVisitJourney.selectedVisitors?.length ||
        !bookVisitJourney.sessionRestriction)
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Choose visit time page - POST only
    if (
      journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.CHOOSE_TIME) &&
      method === 'POST' &&
      (!bookVisitJourney.allVisitSessionIds?.length || !bookVisitJourney.allVisitSessions?.length)
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Additional support page
    if (
      journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.ADDITIONAL_SUPPORT) &&
      (!bookVisitJourney.selectedVisitSession || !bookVisitJourney.applicationReference)
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Main contact page
    if (
      journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.MAIN_CONTACT) &&
      typeof bookVisitJourney.visitorSupport !== 'string'
    ) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Contact details page
    if (journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.CONTACT_DETAILS) && !bookVisitJourney.mainContact) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Check details page
    if (journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.CHECK_DETAILS) && !bookVisitJourney.mainContact) {
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
