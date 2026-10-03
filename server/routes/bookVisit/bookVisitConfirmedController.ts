import type { RequestHandler } from 'express'
import { PrisonService } from '../../services'

export default class BookVisitConfirmedController {
  public constructor(private readonly prisonService: PrisonService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const bookVisitConfirmed = req.session.bookVisitConfirmed!

      if (bookVisitConfirmed.isARequest) {
        return res.render('pages/bookVisit/visitRequested', {
          bookVisitConfirmed,
          showOLServiceNav: true,
        })
      }

      const prison = await this.prisonService.getPrison(bookVisitConfirmed.prisonId)

      return res.render('pages/bookVisit/visitBooked', {
        bookVisitConfirmed,
        prison,
        showOLServiceNav: true,
      })
    }
  }
}
