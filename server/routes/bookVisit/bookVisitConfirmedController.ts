import type { RequestHandler } from 'express'

export default class BookVisitConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookVisitConfirmed } = req.session

      res.render(bookVisitConfirmed.isARequest ? 'pages/bookVisit/visitRequested' : 'pages/bookVisit/visitBooked', {
        bookVisitConfirmed,
        prison: bookVisitConfirmed.prison,
        showOLServiceNav: true,
      })
    }
  }
}
