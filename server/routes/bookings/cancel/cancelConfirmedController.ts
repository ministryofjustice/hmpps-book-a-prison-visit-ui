import type { RequestHandler } from 'express'

export default class CancelConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/bookings/cancel/bookingCancelled', {
        showServiceNav: true,
      })
    }
  }
}
