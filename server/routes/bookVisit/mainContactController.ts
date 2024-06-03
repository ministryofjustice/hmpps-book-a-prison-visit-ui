import type { RequestHandler } from 'express'

export default class MainContactController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/bookingJourney/selectMainContact', {
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
      })
    }
  }
}
