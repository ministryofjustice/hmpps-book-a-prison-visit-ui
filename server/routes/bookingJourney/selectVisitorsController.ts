import type { RequestHandler } from 'express'
import { BookerService } from '../../services'

export default class SelectVisitorsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker, bookingJourney } = req.session
      if (!bookingJourney.allVisitors) {
        const allVisitors = await this.bookerService.getVisitors(booker.reference, booker.prisoners[0].prisonerNumber)
      }
      res.render('pages/bookingJourney/selectVisitors', {
        visitors: req.session.bookingJourney.allVisitors,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      // const { bookingJourney } = req.session

      const { visitors } = req.body

      req.session.bookingJourney.selectedVisitors = visitors

      res.redirect('/book-a-visit/date-and-time')
    }
  }
}
