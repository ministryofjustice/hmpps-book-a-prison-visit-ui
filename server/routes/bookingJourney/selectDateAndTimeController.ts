import type { RequestHandler } from 'express'

export default class SelectDateAndTimeController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/bookingJourney/selectDateAndTime', {
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
      })
    }
  }
}
