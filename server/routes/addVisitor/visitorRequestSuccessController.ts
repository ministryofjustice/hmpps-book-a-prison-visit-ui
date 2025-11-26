import { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class VisitorRequestSuccessController {
  public view(): RequestHandler {
    return async (req, res) => {
      if (req.session.addVisitorJourney?.result === undefined) {
        return res.redirect(paths.VISITORS)
      }

      delete req.session.addVisitorJourney

      return res.render('pages/addVisitor/visitorRequestSuccess', { showOLServiceNav: true })
    }
  }
}
