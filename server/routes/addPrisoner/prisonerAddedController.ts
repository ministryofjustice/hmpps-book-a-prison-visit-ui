import { RequestHandler } from 'express'
import paths from '../../constants/paths'
import { BookerService } from '../../services'

export default class PrisonerAddedController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      if (req.session.addPrisonerJourneyResult?.result !== true) {
        return res.redirect(paths.RETURN_HOME)
      }

      const booker = req.session.booker!
      const { addPrisonerJourneyResult } = req.session
      booker.prisoners = await this.bookerService.getPrisoners(booker.reference)

      const prisoner =
        addPrisonerJourneyResult &&
        req.session.booker?.prisoners.find(p => p.prisonerNumber === addPrisonerJourneyResult.prisonerNumber)

      if (!prisoner) {
        return res.redirect(paths.RETURN_HOME)
      }

      return res.render('pages/addPrisoner/prisonerAdded', {
        showOLServiceNav: true,
        prisonerId: prisoner?.prisonerDisplayId,
      })
    }
  }
}
