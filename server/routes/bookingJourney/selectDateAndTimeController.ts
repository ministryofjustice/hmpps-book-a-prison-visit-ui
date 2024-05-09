import type { RequestHandler } from 'express'
import { BookerService } from '../../services'

export default class DateAndTimeController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/bookingJourney/selectDateAndTime', {
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
      })
    }
  }
}
