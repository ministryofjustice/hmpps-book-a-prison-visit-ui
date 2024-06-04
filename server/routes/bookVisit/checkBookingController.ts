import type { RequestHandler } from 'express'

export default class CheckBookingController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/bookVisit/checkBooking', {
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
      })
    }
  }
}
