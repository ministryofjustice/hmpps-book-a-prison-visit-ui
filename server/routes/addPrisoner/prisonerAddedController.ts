import { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class PrisonerAddedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      if (req.session.addPrisonerJourney?.result !== true) {
        return res.redirect(paths.HOME)
      }

      delete req.session.addPrisonerJourney

      return res.render('pages/addPrisoner/prisonerAdded')
    }
  }
}
