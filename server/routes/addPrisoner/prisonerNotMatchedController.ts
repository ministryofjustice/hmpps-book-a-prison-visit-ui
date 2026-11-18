import { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class PrisonerNotMatchedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { addPrisonerJourneyResult } = req.session

      if (addPrisonerJourneyResult?.result === true) {
        return res.redirect(paths.RETURN_HOME)
      }

      let pageTemplate
      let prisoner
      switch (addPrisonerJourneyResult?.result) {
        case 'PRISONER_ALREADY_REGISTERED_AGAINST_BOOKER':
          pageTemplate = 'prisonerAlreadyLinked'
          prisoner = req.session.booker?.prisoners?.find(
            p => p.prisonerNumber === addPrisonerJourneyResult?.prisonerNumber,
          )
          break

        case 'FAILED_REGISTRATION':
          pageTemplate = 'prisonerNotMatched'
          break

        default:
          return res.redirect(paths.RETURN_HOME)
      }

      return res.render(`pages/addPrisoner/${pageTemplate}`, {
        showOLServiceNav: true,
        prisonId: addPrisonerJourneyResult.selectedPrisonId,
        prisoner,
      })
    }
  }
}
