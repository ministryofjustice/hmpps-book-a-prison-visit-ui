import type { RequestHandler } from 'express'

export default class VisitBookedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingConfirmed } = req.session
      res.render('pages/bookVisit/visitBooked', { bookingConfirmed, showServiceNav: true })
    }
  }
}
