import { RequestHandler } from 'express'
import paths from '../../../constants/paths'
import config from '../../../config'

export default class VisitorRequestSuccessController {
  public viewRequested(): RequestHandler {
    return async (req, res) => {
      if (req.session.addVisitorJourneyResult === undefined) {
        if (!config.features.multiplePrisoners) {
          return res.redirect(paths.VISITORS)
        }

        return res.redirect(paths.PRISONERS)
      }

      return res.render('pages/visitors/addVisitor/visitorRequested', { showOLServiceNav: true })
    }
  }

  public viewApproved(): RequestHandler {
    return async (req, res) => {
      if (req.session.addVisitorJourneyResult === undefined) {
        if (!config.features.multiplePrisoners) {
          return res.redirect(paths.VISITORS)
        }
        return res.redirect(paths.PRISONERS)
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
