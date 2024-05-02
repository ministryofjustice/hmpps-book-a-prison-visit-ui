import type { RequestHandler } from 'express'
import { BookerService } from '../../services'

export default class SelectVisitorsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session
      if (!booker.visitors) {
        req.session.booker.visitors = await this.bookerService.getVisitors(
          booker.reference,
          booker.prisoners[0].prisonerNumber,
        )
      }

      res.render('pages/bookingJourney/selectVisitors', {
        booker: req.session.booker,
        visitors: req.session.booker.visitors,
        bookingJourney: req.session.bookingJourney,
      })
    }
  }
}
