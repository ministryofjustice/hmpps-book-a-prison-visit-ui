import type { RequestHandler } from 'express'
import { BookerService } from '../../services'

export default class MainContactController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/bookingJourney/selectMainContact', {
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
      })
    }
  }
}
