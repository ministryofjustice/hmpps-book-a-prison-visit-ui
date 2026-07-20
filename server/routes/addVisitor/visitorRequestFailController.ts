import { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class VisitorRequestFailController {
  public view(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourneyResult } = req.session

      if (!addVisitorJourneyResult) {
        return res.redirect(paths.VISITORS)
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
          return res.redirect(paths.VISITORS)
      }

      return res.render(`pages/addVisitor/${pageTemplate}`, {
        showOLServiceNav: true,
        firstName: addVisitorJourneyResult.firstName,
        lastName: addVisitorJourneyResult.lastName,
      })
    }
  }
}
