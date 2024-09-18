import type { RequestHandler } from 'express'
import { BookerService } from '../../services'
import paths from '../../constants/paths'

export default class VisitorsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session

      if (!booker.prisoners?.length) {
        return res.redirect(paths.HOME)
      }

      const visitors = booker.prisoners.length
        ? await this.bookerService.getVisitors(booker.reference, booker.prisoners[0].prisonerNumber)
        : undefined

      return res.render('pages/visitors/visitors', { prisoner: booker.prisoners[0], visitors, showServiceNav: true })
    }
  }
}
