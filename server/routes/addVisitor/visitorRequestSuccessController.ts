import { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class VisitorRequestSuccessController {
  public viewRequested(): RequestHandler {
    return async (req, res) => {
      if (req.session.addVisitorJourney?.result === undefined) {
        return res.redirect(paths.VISITORS)
      }

      delete req.session.addVisitorJourney

      return res.render('pages/addVisitor/visitorRequested', { showOLServiceNav: true })
    }
  }

  public viewApproved(): RequestHandler {
    return async (req, res) => {
      if (req.session.addVisitorJourney?.result === undefined) {
        return res.redirect(paths.VISITORS)
      }

      const visitorName = `${req.session.addVisitorJourney.visitorDetails.firstName} ${req.session.addVisitorJourney.visitorDetails.lastName}`
      const prisonerName = `${req.session.booker.prisoners[0].firstName} ${req.session.booker.prisoners[0].lastName}`

      delete req.session.addVisitorJourney

      return res.render('pages/addVisitor/visitorApproved', { showOLServiceNav: true, visitorName, prisonerName })
    }
  }
}
