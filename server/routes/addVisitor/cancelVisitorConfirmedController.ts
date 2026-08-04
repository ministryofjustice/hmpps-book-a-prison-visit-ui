import type { RequestHandler } from 'express'
import paths from '../../constants/paths'
import config from '../../config'

export default class CancelVisitorConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      if (!config.features.bookerWithdrawEnabled) return res.redirect(paths.VISITORS)

      return res.render('pages/addVisitor/cancel/cancelConfirmed', {
        showOLServiceNav: true,
      })
    }
  }
}
