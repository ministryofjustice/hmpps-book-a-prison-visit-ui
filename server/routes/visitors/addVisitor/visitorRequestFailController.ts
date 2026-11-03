import { RequestHandler } from 'express'
import paths from '../../../constants/paths'
import config from '../../../config'

export default class VisitorRequestFailController {
  public view(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourneyResult } = req.session
      const prisoner = req.session.booker!.prisoners[0]

      if (!addVisitorJourneyResult) {
        if (!config.features.multiplePrisoners) {
          return res.redirect(paths.VISITS.HOME)
        }

        return res.redirect(prisoner ? `${paths.VISITORS}/${prisoner.prisonerDisplayId}` : paths.PRISONERS)
      }

      let pageTemplate
      switch (addVisitorJourneyResult.result) {
        case 'MAX_IN_PROGRESS_REQUESTS_REACHED':
          pageTemplate = 'visitorRequestFailTooManyRequests'
          break

        case 'REQUEST_ALREADY_EXISTS':
          pageTemplate = 'visitorRequestFailAlreadyRequested'
          break

        case 'VISITOR_ALREADY_EXISTS':
          pageTemplate = 'visitorRequestFailAlreadyLinked'
          break

        default:
          if (prisoner) {
            return res.redirect(`${paths.VISITORS}/${prisoner.prisonerDisplayId}`)
          }
          return res.redirect(config.features.multiplePrisoners ? paths.PRISONERS : paths.VISITS.HOME)
      }

      return res.render(`pages/visitors/addVisitor/${pageTemplate}`, {
        showOLServiceNav: true,
        firstName: addVisitorJourneyResult.firstName,
        lastName: addVisitorJourneyResult.lastName,
      })
    }
  }
}
