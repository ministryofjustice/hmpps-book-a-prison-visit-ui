import type { RequestHandler } from 'express'

export default class VisitBookedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/bookVisit/visitBooked', {
        bookingConfirmed: req.session.bookingConfirmed,
      })
    }
  }
}
