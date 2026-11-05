import { RequestHandler } from 'express'
import paths from '../../constants/paths'
import { BookerService } from '../../services'
import config from '../../config'

export default class PrisonerAddedController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      if (req.session.addPrisonerJourneyResult?.result !== true) {
        return res.redirect(paths.RETURN_HOME)
      }

      if (config.features.multiplePrisoners) {
        const booker = req.session.booker!
        booker.prisoners = await this.bookerService.getPrisoners(booker.reference)

        const prisoner = req.session.booker?.prisoners.find(
          p => p.prisonerNumber === req.session.addPrisonerJourneyResult?.prisonerNumber,
        )

        return res.render('pages/addPrisoner/prisonerAdded', {
          showOLServiceNav: true,
          prisonerId: prisoner?.prisonerDisplayId,
        })
      }

      return res.render('pages/addPrisoner/prisonerAdded', { showOLServiceNav: true })
    }
  }
}
