import type { RequestHandler } from 'express'

export default class MainContactController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/bookVisit/mainContact', {
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
      })
    }
  }
}
