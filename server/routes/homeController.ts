import type { RequestHandler } from 'express'
import { BookerService } from '../services'
import paths from '../constants/paths'
import { clearSession } from '../utils/utils'

export default class HomeController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session
      const prisoners = await this.bookerService.getPrisoners(booker.reference)
      booker.prisoners = prisoners

      res.render('pages/home', { prisoners: booker.prisoners, showServiceNav: true })
    }
  }

  public returnHome(): RequestHandler {
    return async (req, res) => {
      clearSession(req)
      res.redirect(paths.HOME)
    }
  }
}
