import type { RequestHandler } from 'express'
import type { BookerService } from '../../services'
import { buildPrisonersTableRows } from './prisonersUtils'
import { Locale } from '../../constants/locales'

export default class PrisonersController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const booker = req.session.booker!
      // Ensure prisoners list is up to date
      booker.prisoners = await this.bookerService.getPrisoners(booker.reference)

      const prisonersTableRows = buildPrisonersTableRows({
        prisoners: booker.prisoners,
        lng: req.language as Locale,
      })

      return res.render('pages/prisoners/prisoners', {
        prisoners: booker.prisoners,
        prisonersTableRows,
        showOLServiceNav: true,
      })
    }
  }
}
