import type { RequestHandler } from 'express'
import { BookingConfirmed } from '../../@types/bapv'

export default class CheckVisitDetailsController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/bookVisit/checkVisitDetails', {
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { bookingJourney } = req.session

      // TODO try/catch book visit and get visit reference

      const bookingConfirmed: BookingConfirmed = {
        prisonCode: bookingJourney.prison.code,
        prisonName: bookingJourney.prison.prisonName,
        visitReference: 'TEST_VISIT_REFERENCE',
      }
      req.session.bookingConfirmed = bookingConfirmed

      delete req.session.bookingJourney

      res.redirect('/book-visit/visit-booked')
    }
  }
}
