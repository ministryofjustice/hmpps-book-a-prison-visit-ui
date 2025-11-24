import { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class PrisonerNotMatchedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { addPrisonerJourney } = req.session
      if (addPrisonerJourney?.result !== false) {
        return res.redirect(paths.RETURN_HOME)
      }
      return res.render('pages/addPrisoner/prisonerNotMatched', {
        showOLServiceNav: true,
        prisonName: addPrisonerJourney.selectedPrison.prisonName,
      })
    }
  }
}
