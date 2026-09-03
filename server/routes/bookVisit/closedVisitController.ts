import type { RequestHandler } from 'express'

export default class ClosedVisitController {
  public constructor() {}

  public view(): RequestHandler {
    return async (_req, res) => {
      res.render('pages/bookVisit/closedVisit')
    }
  }
}
