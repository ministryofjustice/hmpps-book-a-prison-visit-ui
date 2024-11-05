import type { RequestHandler } from 'express'
import paths from '../../../constants/paths'

export default class CancelConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { bookingCancelled } = req.session

      if (!bookingCancelled) {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      return res.render('pages/bookings/cancel/cancelConfirmed', {
        hasPhoneNumber: bookingCancelled.hasPhoneNumber,
        showServiceNav: true,
      })
    }
  }
}
