import { RequestHandler, Response } from 'express'
import createError from 'http-errors'
import paths from '../constants/paths'
import logger from '../../logger'

const journeyOrder: string[] = [
  paths.BOOK_VISIT.SELECT_PRISONER,
  paths.BOOK_VISIT.SELECT_VISITORS,
  paths.BOOK_VISIT.CHOOSE_TIME,
  paths.BOOK_VISIT.ADDITIONAL_SUPPORT,
  paths.BOOK_VISIT.MAIN_CONTACT,
  paths.BOOK_VISIT.CHECK_DETAILS,
  paths.BOOK_VISIT.BOOKED,
]

export default function bookVisitSessionValidator(): RequestHandler {
  return (req, res, next) => {
    const { booker, bookingJourney } = req.session
    const { baseUrl, method, path } = req
    const requestPath = baseUrl + path

    const journeyStage = journeyOrder.indexOf(requestPath)

    // Unknown path
    if (journeyStage === -1) {
      return next(createError(404))
    }

    // No booker prisoner - any path
    if (!booker.prisoners?.length) {
      return logAndRedirect(res, method, requestPath, booker.reference)
    }

    // Select visitors page
    if (journeyStage >= journeyOrder.indexOf(paths.BOOK_VISIT.SELECT_VISITORS) && !bookingJourney?.prisoner) {
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

    // TODO add more pages

    return next()
  }
}

function logAndRedirect(res: Response, method: string, requestPath: string, bookerReference: string) {
  logger.info(
    `Session validation failed at ${method} ${requestPath} for booker ${bookerReference}. Redirecting to '${paths.HOME}'`,
  )
  return res.redirect(paths.HOME)
}
