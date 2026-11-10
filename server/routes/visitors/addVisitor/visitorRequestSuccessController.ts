import { RequestHandler } from 'express'
import paths from '../../../constants/paths'
import config from '../../../config'

export default class VisitorRequestSuccessController {
  public viewRequested(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourneyResult } = req.session
      if (addVisitorJourneyResult === undefined) {
        if (!config.features.multiplePrisoners) {
          return res.redirect(paths.VISITORS)
        }

        return res.redirect(paths.PRISONERS)
      }

      return res.render('pages/visitors/addVisitor/visitorRequested', {
        showOLServiceNav: true,
        prisonerDisplayId: addVisitorJourneyResult.prisoner.prisonerDisplayId,
      })
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

      const { firstName, lastName, prisoner } = req.session.addVisitorJourneyResult

      return res.render('pages/visitors/addVisitor/visitorApproved', {
        showOLServiceNav: true,
        firstName,
        lastName,
        prisoner,
      })
    }
  }
}
