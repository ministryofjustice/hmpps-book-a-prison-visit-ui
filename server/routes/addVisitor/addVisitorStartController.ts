import { RequestHandler } from 'express'

export default class AddVisitorStartController {
  public view(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/addVisitor/addVisitorStart', { showOLServiceNav: true })
    }
  }
}
