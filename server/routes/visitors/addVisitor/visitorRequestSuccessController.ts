import { RequestHandler } from 'express'
import paths from '../../../constants/paths'
import config from '../../../config'

export default class VisitorRequestSuccessController {
  public viewRequested(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourneyResult } = req.session
      if (addVisitorJourneyResult === undefined) {
        return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITORS)
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
        return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITORS)
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
