import { RequestHandler } from 'express'

export default class AddVisitorStartController {
  public view(): RequestHandler {
    return async (req, res) => {
      delete req.session.addVisitorJourneyResult
      return res.render('pages/visitors/addVisitor/addVisitorStart', { showOLServiceNav: true })
    }
  }
}
