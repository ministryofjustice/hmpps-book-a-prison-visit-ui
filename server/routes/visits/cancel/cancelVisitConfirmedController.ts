import type { RequestHandler } from 'express'
import paths from '../../../constants/paths'

export default class CancelVisitConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { visitCancelled: bookingCancelled } = req.session

      if (!bookingCancelled) {
        return res.redirect(paths.VISITS.HOME)
      }

      return res.render('pages/visits/cancel/cancelConfirmed', {
        bookingCancelled,
        showOLServiceNav: true,
      })
    }
  }
}
