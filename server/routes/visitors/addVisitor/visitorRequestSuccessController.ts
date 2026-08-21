import { RequestHandler } from 'express'
import paths from '../../../constants/paths'

export default class VisitorRequestSuccessController {
  public viewRequested(): RequestHandler {
    return async (req, res) => {
      if (req.session.addVisitorJourneyResult === undefined) {
        return res.redirect(paths.VISITORS)
      }

      return res.render('pages/visitors/addVisitor/visitorRequested', { showOLServiceNav: true })
    }
  }

  public viewApproved(): RequestHandler {
    return async (req, res) => {
      if (req.session.addVisitorJourneyResult === undefined) {
        return res.redirect(paths.VISITORS)
      }

      const { firstName, lastName } = req.session.addVisitorJourneyResult
      const prisoner = req.session.booker!.prisoners[0]

      return res.render('pages/visitors/addVisitor/visitorApproved', {
        showOLServiceNav: true,
        firstName,
        lastName,
        prisoner,
      })
    }
  }
}
