import type { RequestHandler } from 'express'

export default class CannotBookController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisoner } = req.session.bookingJourney
      delete req.session.bookingJourney

      return res.render('pages/bookVisit/cannotBook', { prisoner })
    }
  }
}
