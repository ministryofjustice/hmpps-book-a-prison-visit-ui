import type { RequestHandler } from 'express'
import paths from '../constants/paths'
import { clearSession } from '../utils/utils'
import { BookerService } from '../services'

export default class HomeController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session
      booker.prisoners = await this.bookerService.getPrisoners(booker.reference)
      res.render('pages/home', { prisoner: booker.prisoners[0], showOLServiceNav: true })
    }
  }

  public returnHome(): RequestHandler {
    return async (req, res) => {
      clearSession(req)
      res.redirect(paths.HOME)
    }
  }
}
