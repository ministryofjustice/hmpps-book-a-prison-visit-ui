import { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class PrisonerNotMatchedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { addPrisonerJourneyResult } = req.session
      if (addPrisonerJourneyResult?.result !== false) {
        return res.redirect(paths.RETURN_HOME)
      }
      return res.render('pages/addPrisoner/prisonerNotMatched', {
        showOLServiceNav: true,
        prisonId: addPrisonerJourneyResult.selectedPrisonId,
      })
    }
  }
}
