import type { RequestHandler } from 'express'

export default class CancelVisitorConfirmedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (_req, res) => {
      return res.render('pages/addVisitor/cancel/cancelConfirmed', {
        showOLServiceNav: true,
      })
    }
  }
}
