import { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class VisitorRequestFailController {
  public view(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourney } = req.session

      if (addVisitorJourney?.result === undefined) {
        return res.redirect(paths.VISITORS)
      }

      let pageTemplate
      switch (addVisitorJourney.result) {
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

      delete req.session.addVisitorJourney

      return res.render(`pages/addVisitor/${pageTemplate}`, {
        showOLServiceNav: true,
        visitorDetails: addVisitorJourney.visitorDetails,
      })
    }
  }
}
