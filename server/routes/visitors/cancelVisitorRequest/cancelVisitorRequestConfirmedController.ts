import type { RequestHandler } from 'express'

export default class CancelVisitorRequestConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (_req, res) => {
      return res.render('pages/visitors/cancelVisitorRequest/cancelConfirmed', {
        showOLServiceNav: true,
      })
    }
  }
}
