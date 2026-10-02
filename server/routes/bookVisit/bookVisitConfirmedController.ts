import type { RequestHandler } from 'express'
import { PrisonService } from '../../services'

export default class BookVisitConfirmedController {
  public constructor(private readonly prisonService: PrisonService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const bookVisitConfirmed = req.session.bookVisitConfirmed!
      const prison = await this.prisonService.getPrison(bookVisitConfirmed.prisonId)

      res.render(bookVisitConfirmed.isARequest ? 'pages/bookVisit/visitRequested' : 'pages/bookVisit/visitBooked', {
        bookVisitConfirmed,
        prison,
        showOLServiceNav: true,
      })
    }
  }
}
