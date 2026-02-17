import type { RequestHandler } from 'express'
import paths from '../../../constants/paths'

export default class CancelVisitConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { visitCancelled } = req.session

      if (!visitCancelled) {
        return res.redirect(paths.VISITS.HOME)
      }

      return res.render('pages/visits/cancel/cancelConfirmed', {
        visitCancelled,
        showOLServiceNav: true,
      })
    }
  }
}
