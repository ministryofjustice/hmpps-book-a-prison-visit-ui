import type { RequestHandler } from 'express'

export default class BookingConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingConfirmed } = req.session

      res.render(bookingConfirmed.isARequest ? 'pages/bookVisit/visitRequested' : 'pages/bookVisit/visitBooked', {
        bookingConfirmed,
        prison: bookingConfirmed.prison,
        showOLServiceNav: true,
      })
    }
  }
}
