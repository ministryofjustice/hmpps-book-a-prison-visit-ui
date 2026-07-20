import { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class PrisonerAddedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      if (req.session.addPrisonerJourneyResult?.result !== true) {
        return res.redirect(paths.RETURN_HOME)
      }

      return res.render('pages/addPrisoner/prisonerAdded', { showOLServiceNav: true })
    }
  }
}
